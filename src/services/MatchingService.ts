import { getManager } from 'typeorm';

import { MatchModel } from '../db/models/MatchModel';
import EditUserModel from '../models/EditUserModel';
import SuccessErrorDto from '../models/SuccessErrorDto';
import { UserModel } from '../db/models/UserModel';
import getMatchingSortQuery from '../utils/matchingSortQuery';
import userService from './UserService';

class MatchingService {
  private _userService = userService;

  private get _dbManager() {
    return getManager();
  }

  public async findMatch(currentUserId: number): Promise<SuccessErrorDto<EditUserModel>> {
    const [currentUser] = await UserModel.find({
      where: { id: currentUserId },
      relations: ['city', 'userOptions'],
    });

    if (!currentUser) throw new Error('guy not exist');

    const guys = await this._dbManager.query(await getMatchingSortQuery(currentUser));

    if (!guys[0]) return null;

    await this.createMatch(currentUser, guys[0] as UserModel);

    return this._userService.getUser(guys[0].id);
  }

  public async getActiveMatches(userId: number) {
    const matches = await MatchModel.find({
      where: [
        { user1Id: userId, user1LikeDate: null },
        { user2Id: userId, user2LikeDate: null },
      ],
    });

    return matches;
  }

  public async likeMatch(userId: number, targetUserId: number) {
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

    if (match.user1Id === userId && match.user1LikeDate === null) {
      match.user1Like = true;
      match.user1LikeDate = new Date();
    }
    if (match.user2Id === userId && match.user2LikeDate === null) {
      match.user2Like = true;
      match.user2LikeDate = new Date();
    }

    await match.save();
    /* todo уведомлять лайкнутого */
  }

  /* создает пустое совпадение двух челов */
  private async createMatch(user1: UserModel, user2: UserModel) {
    const match = new MatchModel();

    match.user1Id = user1.id;
    match.user2Id = user2.id;
    match.creationDate = new Date();

    await match.save();
  }
}

const matchingService = new MatchingService();

export default matchingService;
