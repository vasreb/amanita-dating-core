import { getManager } from 'typeorm';

import { MatchModel } from '../db/models/MatchModel';
import SuccessErrorDto from '../models/SuccessErrorDto';
import { UserModel } from '../db/models/UserModel';
import userService from './UserService';
import LikeResultModel from '../models/LikeResultModel';
import MatchUserModel from '../models/MatchUserModel';
import notifyService from './NotifyService';
import configurationService from './ConfigurationService';

class MatchingService {
  private _userService = userService;
  private _notifyService = notifyService;

  private get _dbManager() {
    return getManager();
  }

  public async getMatchingQuery(user: UserModel) {
    const coefs = {
      DISTANCE_COEF: null,
      AUDIO_VKID_COEF: null,
      AUDIO_GROUPSONG_COEF: null,
      AUDIO_GROUP_COEF: null,
      AGE_COEF: null,
      ACTIVITY_COEF: null,
      MATCHES_COEF: null,
    };

    await configurationService.loadNumberOptions(coefs);

    let query = this._dbManager
      .createQueryBuilder()
      .select([
        'u.*',
        'city.geoLat',
        'city.geoLon',
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
    
          ABS(1 / (cast(u.age as signed) - ${user.age} + 0.1)) * ${coefs.AGE_COEF} +
    
          ${/* активность */ ''}
    
          ifnull(u.activity, 0) * ${coefs.ACTIVITY_COEF} -
    
          ${/* существующие матчи TODO УБРАТЬ МИНУС И ЗАМЕНИТЬ НА ОТР КОЭФ ОЧЕВИДНО ЖЕ */ ''}
    
          (ifnull(Matches1.count, 0) + ifnull(Matches2.count, 0)) * ${coefs.MATCHES_COEF})
          
          as resultCount`,
      ])
      .from('user', 'u')
      /* совпадения аудио по vkId */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.userId AS userId, COUNT(*) count')
            .from(
              (qb) =>
                qb
                  .select(['vkId', 'userId AS user2Id'])
                  .from('user_audio', 'user_audio')
                  .leftJoinAndSelect('audio', 'audio', 'user_audio.audioId = audio.id')
                  .where(`userId = ${user.id}`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) =>
                qb
                  .select(['userId', 'vkId'])
                  .from('user_audio', 'user_audio')
                  .leftJoinAndSelect('audio', 'audio', 'user_audio.audioId = audio.id'),
              'ua2',
              'ua1.vkId = ua2.vkId'
            )
            .where(`userId <> ${user.id}`)
            .groupBy('ua2.userId'),
        'vkIdMatches',
        'vkIdMatches.userId = u.id'
      )
      /* совпадения аудио по songName && groupName */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.userId AS userId, COUNT(*) count')
            .from(
              (qb) =>
                qb /* # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['groupName', 'songName', 'userId AS user2Id'])
                  .from('user_audio', 'user_audio')
                  .leftJoinAndSelect('audio', 'audio', 'user_audio.audioId = audio.id')
                  .where(`userId = ${user.id}`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) =>
                qb
                  .select(['userId', 'songName', 'groupName'])
                  .from('user_audio', 'user_audio')
                  .leftJoinAndSelect('audio', 'audio', 'user_audio.audioId = audio.id'),
              'ua2',
              'ua1.songName = ua2.songName AND ua1.groupName = ua2.groupName'
            )
            .where(`userId <> ${user.id}`)
            .groupBy('ua2.userId'),
        'SNGNMatches',
        'SNGNMatches.userId = u.id'
      )
      /* совпадения аудио по groupName */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.userId AS userId, COUNT(*) count')
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['groupName', 'userId AS user2Id'])
                  .from('user_audio', 'user_audio')
                  .leftJoinAndSelect('audio', 'audio', 'user_audio.audioId = audio.id')
                  .where(`userId = ${user.id}`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) =>
                qb
                  .select(['userId', 'groupName'])
                  .from('user_audio', 'user_audio')
                  .leftJoinAndSelect('audio', 'audio', 'user_audio.audioId = audio.id'),
              'ua2',
              'ua1.groupName = ua2.groupName'
            )
            .where(`userId <> ${user.id}`)
            .groupBy('ua2.userId'),
        'GNMatches',
        'GNMatches.userId = u.id'
      )
      /* матчи */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.user2Id, COUNT(*) count')
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match')
                  .where(`user1Id = ${user.id}`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'),
              'ua2',
              'ua1.id = ua2.id'
            )
            .groupBy('ua2.user2Id'),
        'Matches1',
        'Matches1.user2Id = u.id'
      )
      /* матчи 2 */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.user1Id, COUNT(*) count')
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match')
                  .where(`user2Id = ${user.id}`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'),
              'ua2',
              'ua1.id = ua2.id'
            )
            .groupBy('user1Id'),
        'Matches2',
        'Matches2.user1Id = u.id'
      )
      /* исключим те матчи которые еще не получили ответа */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.user2Id, COUNT(*) count')
            .from(
              (qb) =>
                qb /* получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера */
                  .select(['id', 'user1Id', 'user2Id'])
                  .from('match', 'match')
                  .where(`user1Id = ${user.id} AND user1LikeDate is NULL`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'),
              'ua2',
              'ua1.id = ua2.id'
            )
            .groupBy('user2Id'),
        'ExcludeMatches',
        'ExcludeMatches.user2Id = u.id'
      )
      /* исключим те матчи которые недавно от u1 */
      .leftJoinAndSelect(
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
            .leftJoinAndSelect(
              (qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'),
              'ua2',
              'ua1.id = ua2.id'
            )
            .groupBy('user2Id'),
        'ExcludeMatches2',
        'ExcludeMatches2.user2Id = u.id'
      )
      /* исключим те матчи которые недавно от u2 */
      .leftJoinAndSelect(
        (qb) =>
          qb
            .select('ua2.user2Id')
            .from(
              (qb) =>
                qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match').where(`user2Id = ${user.id} AND 
                  (DATE_SUB(CURDATE(), INTERVAL 1 DAY) < creationDate
                  OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user1LikeDate
                  OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user2LikeDate)`),
              'ua1'
            )
            .leftJoinAndSelect(
              (qb) => qb.select(['id', 'user1Id', 'user2Id']).from('match', 'match'),
              'ua2',
              'ua1.id = ua2.id'
            )
            .groupBy('user1Id'),
        'ExcludeMatches3',
        'ExcludeMatches3.user1Id = u.id'
      )
      /* расстояние */
      .innerJoinAndSelect('city', 'city', 'u.cityId = city.id')
      .innerJoinAndSelect('user_options', 'uO', ' u.userOptionsId = uO.id');

    switch (user.userOptions.searchGenderFilter) {
      case 'all':
        query = query.where([
          { ['uO.searchGenderFilter']: 'all' },
          { ['ExcludeMatches.user2Id IS null']: null },
          { ['ExcludeMatches3.user1Id']: null },
        ]);
      case 'male':
        query = query.where([
          { ['uO.searchGenderFilter']: 'female' },
          { ['ExcludeMatches.user2Id IS null']: null },
          { ['ExcludeMatches3.user1Id']: null },
        ]);
      case 'female':
        query = query.where([
          { ['uO.searchGenderFilter']: 'male' },
          { ['ExcludeMatches.user2Id IS null']: null },
          { ['ExcludeMatches3.user1Id']: null },
        ]);
    }
    query = query.andWhere(`u.id <> ${user.id}`).orderBy('resultCount', 'DESC').limit(20);

    const str = query.getSql();

    console.log(str);

    return str;
  }

  public async findMatch(currentUserId: number): Promise<SuccessErrorDto<MatchUserModel>> {
    const [currentUser] = await UserModel.find({
      where: { id: currentUserId },
      relations: ['city', 'userOptions'],
    });

    if (!currentUser) throw new Error('guy not exist');

    const guys: UserModel[] = await this._dbManager.query(await this.getMatchingQuery(currentUser));

    console.dir(guys);

    if (!guys[0]) return new SuccessErrorDto<MatchUserModel>();

    let match;

    if (guys[0]) {
      match = await MatchModel.findOne({
        where: { user1Id: currentUserId, user2Id: guys[0].id, user1LikeDate: null },
      });
    }

    if (!match) {
      match = await this.createMatch(currentUser, guys[0] as UserModel);
    }

    const matchUserModel = new MatchUserModel();
    const response = new SuccessErrorDto<MatchUserModel>(matchUserModel);

    matchUserModel.match = match;
    const userResp = await this._userService.getUser(guys[0].id);
    if (userResp.errorMessage) {
      response.errorMessage = userResp.errorMessage;
    }
    matchUserModel.user = userResp.data;

    return response;
  }

  public async getActiveMatches(userId: number): Promise<SuccessErrorDto<MatchUserModel[]>> {
    const matches = await MatchModel.find({
      where: [
        { user1Id: userId, user1LikeDate: null },
        { user2Id: userId, user2LikeDate: null },
      ],
      take: 10,
    });

    /* в начало засовываем те которые чел сам не лайкнул */
    matches.sort((a, b) => (a.user1Id === userId && !a.user1Like ? -1 : 1));

    const response = new SuccessErrorDto(
      await Promise.all(
        matches.map(async (m) => {
          const resp = await this._userService.getUser(m.user1Id === userId ? m.user2Id : m.user1Id);

          if (resp.errorMessage) {
            response.errorMessage = resp.errorMessage;
          }
          const matchUserModel = new MatchUserModel();

          matchUserModel.match = m;
          matchUserModel.user = resp.data;

          return matchUserModel;
        })
      )
    );

    return response;
  }

  public async likeMatch(
    userId: number,
    targetUserId: number,
    dislike: boolean
  ): Promise<SuccessErrorDto<LikeResultModel>> {
    const matches = await MatchModel.find({
      where: [
        { user1Id: userId, user2Id: targetUserId, user1LikeDate: null },
        { user2Id: userId, user1Id: targetUserId, user2LikeDate: null },
      ],
      take: 10,
    });

    if (matches.length > 1) {
      console.error(matches);
      throw new Error('несколкьо активных матчей с одним??');
    }

    const [match] = matches;

    if (!match) return new SuccessErrorDto(new LikeResultModel());

    if (match.user1Id === userId && match.user1LikeDate === null) {
      if (!dislike) {
        match.user1Like = true;
      }
      match.user1LikeDate = new Date();
      if (dislike) {
        match.user2LikeDate = new Date();
      }
    }
    if (match.user2Id === userId && match.user2LikeDate === null) {
      if (!dislike) {
        match.user2Like = true;
      }
      match.user2LikeDate = new Date();
      if (dislike) {
        match.user1LikeDate = new Date();
      }
    }

    await match.save();

    const result = new LikeResultModel();

    result.mutually = Boolean(match.user1LikeDate && match.user1Like && match.user2LikeDate && match.user2Like);

    const { likeDate } = match.getLikeStateAndDate(targetUserId);

    if (!dislike) {
      if (result.mutually) {
        this._notifyService.mutuallyMatchNotify(match.user1Id, match.user2Id);
      } else {
        if (!likeDate) {
          this._notifyService.sendUserMsg(targetUserId, `Вы кому-то понравились! Посмотрите анкету`);
        }
      }
    }

    return new SuccessErrorDto(result);
  }

  /* создает пустое совпадение двух челов */
  private async createMatch(user1: UserModel, user2: UserModel) {
    const match = new MatchModel();

    match.user1Id = user1.id;
    match.user2Id = user2.id;
    match.creationDate = new Date();

    await match.save();

    return match;
  }
}

const matchingService = new MatchingService();

export default matchingService;
