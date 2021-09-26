import { getManager, SelectQueryBuilder } from 'typeorm';
import { UserModel } from '../db/models/UserModel';
import configurationService from './ConfigurationService';

class MatchingQueryService {
  private get _dbManager() {
    return getManager();
  }

  /**
   * Запрос для второстепенного поиска, если по аудио не нашли матч то ищем без учета аудио
   *
   * @method
   */
  public async getMinorQuery(user: UserModel) {
    const coefs = await configurationService.loadNumberOptions();

    let query = this._dbManager
      .createQueryBuilder()
      .select([
        'u.*',
        'city.geoLat',
        'city.geoLon',
        'city.name',
        /* подсчет результирующего числа */
        `(${/* расстояние */ ''}
    
          (1 / ((city.geoLat - ${user.city.geoLat})*(city.geoLat - ${user.city.geoLat}) + 
          (city.geoLon - ${user.city.geoLon})*(city.geoLon - ${user.city.geoLon}) + 0.1 )) * ${coefs.DISTANCE_COEF} +
          
          ${/* возраст */ ''}
    
          ABS(1 / POW(
			 
          ABS(cast(u.age as signed) - ${user.age})
            
          , 0.2)) * ${coefs.AGE_COEF} +
    
          ${/* активность */ ''}
    
          ifnull(u.activity, 0) * ${coefs.ACTIVITY_COEF} -
    
          ${/* существующие матчи TODO УБРАТЬ МИНУС И ЗАМЕНИТЬ НА ОТР КОЭФ ОЧЕВИДНО ЖЕ */ ''}
    
          (ifnull(Matches1.count, 0) + ifnull(Matches2.count, 0)) * ${coefs.MATCHES_COEF})
          
          as resultCount`,
      ])
      .from('user', 'u');

    query = this.chainMatchesJoins(query, user);
    query = this.chainGenderFilter(query, user);
    query = this.chainExcludeMatchesFilter(query, user);
    query = this.chainSort(query, user);

    const str = query.getSql();

    console.log(str);

    return str;
  }

  public async getAudioMatchingQuery(user: UserModel) {
    const coefs = await configurationService.loadNumberOptions();

    let query = this._dbManager
      .createQueryBuilder()
      .select([
        'u.*',
        'city.geoLat',
        'city.geoLon',
        'city.name',
        'vkIdMatches.count AS VkIdAudioMatches',
        'SNGNMatches.count AS SongGroupAudioMatches',
        'GNMatches.count AS GroupAudioMatches',
        /* подсчет результирующего числа */
        /* совпадения по аудио */
        `(ifnull(vkIdMatches.count, 0) * ${coefs.AUDIO_VKID_COEF} + 
          ifnull(SNGNMatches.count, 0) * ${coefs.AUDIO_GROUPSONG_COEF} + 
          ifnull(GNMatches.count, 0) * ${coefs.AUDIO_GROUP_COEF} + 
    
          ${/* расстояние */ ''}
    
          (1 / ((city.geoLat - ${user.city.geoLat})*(city.geoLat - ${user.city.geoLat}) + 
          (city.geoLon - ${user.city.geoLon})*(city.geoLon - ${user.city.geoLon}) + 0.1 )) * ${coefs.DISTANCE_COEF} +
          
          ${/* возраст */ ''}
    
    
          ABS(1 / POW(
			 
            ABS(cast(u.age as signed) - ${user.age})
              
            , 0.2)) * ${coefs.AGE_COEF} +
      
          ${/* активность */ ''}
    
          ifnull(u.activity, 0) * ${coefs.ACTIVITY_COEF} -
    
          ${/* существующие матчи TODO УБРАТЬ МИНУС И ЗАМЕНИТЬ НА ОТР КОЭФ ОЧЕВИДНО ЖЕ */ ''}
    
          (ifnull(Matches1.count, 0) + ifnull(Matches2.count, 0)) * ${coefs.MATCHES_COEF})
          
          as resultCount`,
      ])
      .from('user', 'u');

    query = this.chainAudioJoins(query, user);
    query = this.chainMatchesJoins(query, user);
    query = this.chainGenderFilter(query, user);
    query = this.chainExcludeMatchesFilter(query, user);
    query = this.chainExcludeNoAudios(query, user);
    query = this.chainSort(query, user);

    const str = query.getSql();

    console.log(str);

    return str;
  }

  private chainExcludeNoAudios(query: SelectQueryBuilder<unknown>, user: UserModel) {
    query = query.andWhere(
      `vkIdMatches.count IS NOT NULL OR SNGNMatches.count IS NOT NULL OR GNMatches.count IS NOT null`
    );

    return query;
  }

  private chainSort(query: SelectQueryBuilder<unknown>, user: UserModel) {
    query = query.andWhere(`u.id <> ${user.id}`).orderBy('resultCount', 'DESC').limit(5);

    return query;
  }

  private chainAudioJoins(query: SelectQueryBuilder<unknown>, user: UserModel) {
    query = query /* совпадения аудио по vkId */
      .leftJoin(
        (qb) =>
          qb
            .select(['ua2.userId AS userId', 'COUNT(*) count'])
            .from(
              (qb) =>
                qb
                  .select(['vkId', 'userId AS user2Id'])
                  .from('user_audio', 'user_audio')
                  .leftJoin('audio', 'audio', 'user_audio.audioId = audio.id')
                  .where(`user_audio.userId = ${user.id}`),
              'ua1'
            )
            .leftJoin(
              (qb) =>
                qb
                  .select(['user_audio.userId as userId', 'vkId'])
                  .from('user_audio', 'user_audio')
                  .leftJoin('audio', 'audio', 'user_audio.audioId = audio.id'),
              'ua2',
              'ua1.vkId = ua2.vkId'
            )
            .where(`ua2.userId <> ${user.id}`)
            .groupBy('ua2.userId'),
        'vkIdMatches',
        'vkIdMatches.userId = u.id'
      )
      /* совпадения аудио по songName && groupName */
      .leftJoin(
        (qb) =>
          qb
            .select(['ua2.userId AS userId', 'COUNT(*) count'])
            .from(
              (qb) =>
                qb /* # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['groupName', 'songName', 'user_audio.userId AS user2Id'])
                  .from('user_audio', 'user_audio')
                  .leftJoin('audio', 'audio', 'user_audio.audioId = audio.id')
                  .where(`user_audio.userId = ${user.id}`),
              'ua1'
            )
            .leftJoin(
              (qb) =>
                qb
                  .select(['user_audio.userId as userId', 'songName', 'groupName'])
                  .from('user_audio', 'user_audio')
                  .leftJoin('audio', 'audio', 'user_audio.audioId = audio.id'),
              'ua2',
              'ua1.songName = ua2.songName AND ua1.groupName = ua2.groupName'
            )
            .where(`userId <> ${user.id}`)
            .groupBy('ua2.userId'),
        'SNGNMatches',
        'SNGNMatches.userId = u.id'
      )
      /* совпадения аудио по groupName */
      .leftJoin(
        (qb) =>
          qb
            .select(['ua2.userId AS userId', 'COUNT(*) count'])
            .from(
              (qb) =>
                qb
                  .select(['groupName', 'user_audio.userId AS user2Id'])
                  .from('user_audio', 'user_audio')
                  .leftJoin('audio', 'audio', 'user_audio.audioId = audio.id')
                  .where(`user_audio.userId = ${user.id}`),
              'ua1'
            )
            .leftJoin(
              (qb) =>
                qb
                  .select(['user_audio.userId as userId', 'groupName'])
                  .from('user_audio', 'user_audio')
                  .leftJoin('audio', 'audio', 'user_audio.audioId = audio.id'),
              'ua2',
              'ua1.groupName = ua2.groupName'
            )
            .where(`ua2.userId <> ${user.id}`)
            .groupBy('ua2.userId'),
        'GNMatches',
        'GNMatches.userId = u.id'
      );

    return query;
  }

  private chainMatchesJoins(query: SelectQueryBuilder<unknown>, user: UserModel) {
    /* матчи */
    query = query
      .leftJoin(
        (qb) =>
          qb
            .select(['ua2.user2Id', 'COUNT(*) count'])
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match')
                  .where(`user1Id = ${user.id}`),
              'ua1'
            )
            .leftJoin((qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'), 'ua2', 'ua1.id = ua2.id')
            .groupBy('ua2.user2Id'),
        'Matches1',
        'Matches1.user2Id = u.id'
      )
      /* матчи 2 */
      .leftJoin(
        (qb) =>
          qb
            .select(['ua2.user1Id as user1Id', 'COUNT(*) count'])
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match')
                  .where(`user2Id = ${user.id}`),
              'ua1'
            )
            .leftJoin((qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'), 'ua2', 'ua1.id = ua2.id')
            .groupBy('ua2.user1Id'),
        'Matches2',
        'Matches2.user1Id = u.id'
      )
      /* исключим те матчи которые еще не получили ответа */
      .leftJoin(
        (qb) =>
          qb
            .select(['ua2.user2Id as user2Id', 'COUNT(*) count'])
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match')
                  .where(`user1Id = ${user.id} AND user1LikeDate is NULL`),
              'ua1'
            )
            .leftJoin((qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'), 'ua2', 'ua1.id = ua2.id')
            .groupBy('ua2.user2Id'),
        'ExcludeMatches',
        'ExcludeMatches.user2Id = u.id'
      )
      /* исключим те матчи которые недавно от u1 */
      .leftJoin(
        (qb) =>
          qb
            .select('ua2.user2Id')
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match').where(`user1Id = ${user.id} AND 
                  (DATE_SUB(CURDATE(), INTERVAL 1 DAY) < creationDate
                  OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user1LikeDate
                  OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user2LikeDate)`),
              'ua1'
            )
            .leftJoin((qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'), 'ua2', 'ua1.id = ua2.id')
            .groupBy('ua2.user2Id'),
        'ExcludeMatches2',
        'ExcludeMatches2.user2Id = u.id'
      )
      /* исключим те матчи которые недавно от u2 */
      .leftJoin(
        (qb) =>
          qb
            .select('ua2.user1Id')
            .from(
              (qb) =>
                qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match').where(`user2Id = ${user.id} AND 
                  (DATE_SUB(CURDATE(), INTERVAL 1 DAY) < creationDate
                  OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user1LikeDate
                  OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user2LikeDate)`),
              'ua1'
            )
            .leftJoin((qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'), 'ua2', 'ua1.id = ua2.id')
            .groupBy('user1Id'),
        'ExcludeMatches3',
        'ExcludeMatches3.user1Id = u.id'
      )
      /* расстояние */
      .innerJoin('city', 'city', 'u.cityId = city.id')
      .innerJoin('user_options', 'uO', 'u.userOptionsId = uO.id');

    return query;
  }

  private chainGenderFilter(query: SelectQueryBuilder<unknown>, user: UserModel) {
    /* матрица для этого фильтра в /docs/ */
    switch (true) {
      case user.gender === 'male' && user.userOptions.searchGenderFilter === 'all':
        query = query.andWhere(`
            (uO.searchGenderFilter = 'male' AND u.gender = "male"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "male"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'male' AND u.gender = "female")
          `);
        break;
      case user.gender === 'female' && user.userOptions.searchGenderFilter === 'all':
        query = query.andWhere(`
           (uO.searchGenderFilter = 'male' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'female' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "male"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "female")
          `);
        break;
      case user.gender === 'male' && user.userOptions.searchGenderFilter === 'male':
        query = query.andWhere(`
            (uO.searchGenderFilter = 'male' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'female' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "male"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "female")
          `);
        break;
      case user.gender === 'female' && user.userOptions.searchGenderFilter === 'male':
        query = query.andWhere(`
            (uO.searchGenderFilter = 'male' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "male")
          `);
        break;
      case user.gender === 'female' && user.userOptions.searchGenderFilter === 'female':
        query = query.andWhere(`
            (uO.searchGenderFilter = 'female' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "female")
        `);
        break;
      case user.gender === 'male' && user.userOptions.searchGenderFilter === 'female':
        query = query.andWhere(`
            (uO.searchGenderFilter = 'male' AND u.gender = "female"
            OR
            uO.searchGenderFilter = 'all' AND u.gender = "female")
           `);
        break;
    }

    return query;
  }

  private chainExcludeMatchesFilter(query: SelectQueryBuilder<unknown>, user: UserModel) {
    query = query
      .andWhere('ExcludeMatches.user2Id is null')
      .andWhere('ExcludeMatches2.user2Id is null')
      .andWhere('ExcludeMatches3.user1Id is null');

    return query;
  }
}

const matchingQueryService = new MatchingQueryService();

export default matchingQueryService;
