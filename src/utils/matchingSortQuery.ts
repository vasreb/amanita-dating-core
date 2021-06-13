import * as coefs from '../constants/matchingCoefs';
import { UserModel } from 'db/models/UserModel';

const getMatchingSortQuery = (user: UserModel) => {
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
    u.activity * ${coefs.ACTIVITY_COEF})
    
    as resultCount
    
    FROM user AS u 
    
    # совпадения аудио по vkId
    RIGHT JOIN 
    (
        # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера
        SELECT ua1.userId AS userId, COUNT(*) count
        FROM (SELECT userId, vkId FROM user_audio JOIN audio ON user_audio.audioId = audio.id) ua1
        RIGHT JOIN
        (
            SELECT vkId, userId  AS user2Id FROM user_audio JOIN audio ON user_audio.audioId = audio.id WHERE userId = ${user.id}
        ) ua2 ON ua1.vkId = ua2.vkId
        WHERE userId <> ${user.id}
        GROUP BY ua1.userId
    
    ) vkIdMatches ON vkIdMatches.userId = u.id 
    
    # совпадения аудио по songName && groupName
    RIGHT JOIN 
    (
        # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера
        SELECT ua1.userId AS userId, COUNT(*) count
        FROM (SELECT userId, songName, groupName FROM user_audio JOIN audio ON user_audio.audioId = audio.id) ua1
        RIGHT JOIN
        (
            SELECT groupName, songName, userId  AS user2Id FROM user_audio JOIN audio ON user_audio.audioId = audio.id WHERE userId = ${user.id}
        ) ua2 ON ua1.songName = ua2.songName AND ua1.groupName = ua2.groupName
        WHERE userId <> ${user.id}
        GROUP BY ua1.userId
    
    ) SNGNMatches ON SNGNMatches.userId = u.id 
    
    # совпадения аудио по groupName
    RIGHT JOIN 
    (
        # получаем список тех юзер-аудио которые соответствуют по иду аудио нашего искомого юзера
        SELECT ua1.userId AS userId, COUNT(*) count
        FROM (SELECT userId, groupName FROM user_audio JOIN audio ON user_audio.audioId = audio.id) ua1
        RIGHT JOIN
        (
            SELECT groupName, userId  AS user2Id FROM user_audio JOIN audio ON user_audio.audioId = audio.id WHERE userId = ${user.id}
        ) ua2 ON ua1.groupName = ua2.groupName
        WHERE userId <> ${user.id}
        GROUP BY ua1.userId
    ) GNMatches ON GNMatches.userId = u.id 
    
    # расстояние
    JOIN city ON u.cityId = city.id

    ORDER BY resultCount DESC

    LIMIT 20
    `;
};

export default getMatchingSortQuery;
