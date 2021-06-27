import { UserModel } from 'db/models/UserModel';
import { UserOptionsModel } from '../db/models/UserOptionsModel';
import configurationService from '../services/ConfigurationService';

/* TODO на куерибилдер */
const getWhereGenderExpression = (options: UserOptionsModel) => {
  switch (options.searchGenderFilter) {
    case 'all':
      return "WHERE uO.searchGenderFilter = 'all' AND ExcludeMatches.user2Id IS null AND ExcludeMatches2.user2Id IS null AND ExcludeMatches3.user2Id IS null";
    case 'male':
      return "WHERE uO.searchGenderFilter = 'female' AND ExcludeMatches.user2Id IS null AND ExcludeMatches2.user2Id IS null AND ExcludeMatches3.user2Id IS null";
    case 'female':
      return "WHERE uO.searchGenderFilter = 'male' AND ExcludeMatches.user2Id IS null AND ExcludeMatches2.user2Id IS null AND ExcludeMatches3.user2Id IS null";
  }

  throw new Error('have no gender filter!!!!');
};

/* TODO на куерибилдер */
const getMatchingSortQuery = async (user: UserModel) => {
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

  return `SELECT u.*, 

    city.geoLat,
    city.geoLon,
    vkIdMatches.count AS VkIdAudioMatches, 
    SNGNMatches.count AS SongGroupAudioMatches, 
    GNMatches.count AS GroupAudioMatches,
    
    # совпадения по аудио 
    (vkIdMatches.count * ${coefs.AUDIO_VKID_COEF} + 
    SNGNMatches.count * ${coefs.AUDIO_GROUPSONG_COEF} + 
    GNMatches.count * ${coefs.AUDIO_GROUP_COEF} + 
    
    # расстояние
    (1 / ((city.geoLat - ${user.city.geoLat})*(city.geoLat - ${user.city.geoLat}) + 
    (city.geoLon - ${user.city.geoLon})*(city.geoLon - ${user.city.geoLon}) + 0.1 )) * ${coefs.DISTANCE_COEF} +
    
    # возраст
    ABS(1 / (cast(u.age as signed) - ${user.age} + 0.1)) * ${coefs.AGE_COEF} +
    
    # активность
    u.activity * ${coefs.ACTIVITY_COEF} -

    # существующие матчи

    (Matches1.count + Matches2.count) * ${coefs.MATCHES_COEF})
    
    as resultCount
    
    FROM user AS u 
    
    # совпадения аудио по vkId
    LEFT JOIN 
    (
        SELECT ua1.userId AS userId, COUNT(*) count
        FROM (SELECT userId, vkId FROM user_audio JOIN audio ON user_audio.audioId = audio.id) ua1
        RIGHT JOIN
        (
            # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера
            SELECT vkId, userId  AS user2Id FROM user_audio JOIN audio ON user_audio.audioId = audio.id WHERE userId = ${
              user.id
            }
        ) ua2 ON ua1.vkId = ua2.vkId
        WHERE userId <> ${user.id}
        GROUP BY ua1.userId
    
    ) vkIdMatches ON vkIdMatches.userId = u.id 
    
    # совпадения аудио по songName && groupName
    LEFT JOIN 
    (
        SELECT ua1.userId AS userId, COUNT(*) count
        FROM (SELECT userId, songName, groupName FROM user_audio JOIN audio ON user_audio.audioId = audio.id) ua1
        RIGHT JOIN
        (
            # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера
            SELECT groupName, songName, userId  AS user2Id FROM user_audio JOIN audio ON user_audio.audioId = audio.id WHERE userId = ${
              user.id
            }
        ) ua2 ON ua1.songName = ua2.songName AND ua1.groupName = ua2.groupName
        WHERE userId <> ${user.id}
        GROUP BY ua1.userId
    
    ) SNGNMatches ON SNGNMatches.userId = u.id 
    
    # совпадения аудио по groupName
    LEFT JOIN 
    (
        SELECT ua1.userId AS userId, COUNT(*) count
        FROM (SELECT userId, groupName FROM user_audio JOIN audio ON user_audio.audioId = audio.id) ua1
        RIGHT JOIN
        (
            # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера
            SELECT groupName, userId  AS user2Id FROM user_audio JOIN audio ON user_audio.audioId = audio.id WHERE userId = ${
              user.id
            }
        ) ua2 ON ua1.groupName = ua2.groupName
        WHERE userId <> ${user.id}
        GROUP BY ua1.userId
    ) GNMatches ON GNMatches.userId = u.id 

    # матчи
    LEFT JOIN
    (
        SELECT ua1.user2Id, COUNT(*) count
        FROM (SELECT id, user1Id, user2Id FROM \`match\`) ua1
        RIGHT JOIN
        (
            SELECT id, user1Id, user2Id FROM \`match\` WHERE user1Id = ${user.id}
        ) ua2 ON ua1.id = ua2.id
        GROUP BY user2Id
    ) Matches1 ON u.id = Matches1.user2Id

    # матчи 2
    LEFT JOIN
    (
        SELECT ua1.user1Id, COUNT(*) count
        FROM (SELECT id, user1Id, user2Id FROM \`match\`) ua1
        RIGHT JOIN
        (
            SELECT id, user1Id, user2Id FROM \`match\` WHERE user2Id = ${user.id}
        ) ua2 ON ua1.id = ua2.id
        GROUP BY user1Id
    ) Matches2 ON u.id = Matches2.user1Id

  
    # исключим те матчи которые еще не получили ответа
    LEFT JOIN
    (
      SELECT ua1.user2Id
      FROM (SELECT id, user1Id, user2Id FROM \`match\`) ua1
      RIGHT JOIN
      (
          SELECT id, user1Id, user2Id FROM \`match\` 
        WHERE user1Id = ${user.id} 
        AND user1LikeDate is NULL
      ) ua2 ON ua1.id = ua2.id
      GROUP BY user2Id
    ) ExcludeMatches ON u.id = ExcludeMatches.user2Id

    # исключим те матчи которые недавно от u1
    LEFT JOIN
    (
      SELECT ua1.user2Id
      FROM (SELECT id, user1Id, user2Id FROM \`match\`) ua1
      RIGHT JOIN
      (
          SELECT id, user1Id, user2Id FROM \`match\` 
        WHERE user1Id = ${user.id} AND
        (DATE_SUB(CURDATE(), INTERVAL 1 DAY) < creationDate
          OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user1LikeDate
          OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user2LikeDate)
      ) ua2 ON ua1.id = ua2.id
      GROUP BY user2Id
    ) ExcludeMatches2 ON u.id = ExcludeMatches2.user2Id
          

    # исключим те матчи которые недавно от u2
    LEFT JOIN
    (
      SELECT ua1.user1Id
      FROM (SELECT id, user1Id, user2Id FROM \`match\`) ua1
      RIGHT JOIN
      (
          SELECT id, user1Id, user2Id FROM \`match\` 
        WHERE user2Id = ${user.id} AND
        (DATE_SUB(CURDATE(), INTERVAL 1 DAY) < creationDate
          OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user1LikeDate
          OR DATE_SUB(CURDATE(), INTERVAL 1 DAY) < user2LikeDate)
      ) ua2 ON ua1.id = ua2.id
      GROUP BY user1Id
    ) ExcludeMatches3 ON u.id = ExcludeMatches3.user1Id

    # расстояние
    JOIN city ON u.cityId = city.id
    # опции
    JOIN user_options uO ON u.userOptionsId = uO.id

    ${getWhereGenderExpression(user.userOptions)} AND u.id <> ${user.id}

    ORDER BY resultCount DESC

    LIMIT 20
    `;
};

export default getMatchingSortQuery;
