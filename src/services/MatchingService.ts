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
    console.log('biba2');
    const [currentUser] = await UserModel.find({
      where: { id: currentUserId },
      relations: ['city', 'userOptions'],
    });

    console.log('biba');

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
    const [match] = await MatchModel.find({
      where: [
        { user1Id: userId, user2Id: targetUserId, user1LikeDate: null },
        { user2Id: userId, user1Id: targetUserId, user2LikeDate: null },
      ],
      take: 1,
    });

  }

  /* создает пустое совпадение двух челов */
  private async createMatch(user1: UserModel, user2: UserModel) {
    /* проверим если их матч уже есть и он активен 
    TODO в запросе */
    const matches = await this.getActiveMatches(user1.id);

    if (
      matches.find(
        (m) => (m.user1Id === user1.id && m.user2Id === user2.id) || (m.user2Id === user1.id && m.user1Id === user2.id)
      )
    ) {
      return null;
    }

    const match = new MatchModel();

    match.user1Id = user1.id;
    match.user2Id = user2.id;
    match.creationDate = new Date();

    await match.save();
  }
}

const matchingService = new MatchingService();

export default matchingService;
