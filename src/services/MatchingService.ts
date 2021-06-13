import { getManager } from 'typeorm';
import { UserModel } from '../db/models/UserModel';
import getMatchingSortQuery from '../utils/matchingSortQuery';

class MatchingService {
  private get _dbManager() {
    return getManager();
  }

  async findMatch(user: UserModel) {
    const guys = await this._dbManager.query(getMatchingSortQuery(user));

    console.dir(guys);

    return guys[0] as UserModel;
  }
}

const matchingService = new MatchingService();

export default matchingService;
