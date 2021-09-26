import { DEBUG_SEARCHING } from './../constants/constants';
import { getManager } from 'typeorm';

import { MatchModel } from '../db/models/MatchModel';
import SuccessErrorDto from '../models/SuccessErrorDto';
import { UserModel } from '../db/models/UserModel';
import userService from './UserService';
import LikeResultModel from '../models/LikeResultModel';
import MatchUserModel from '../models/MatchUserModel';
import notifyService from './NotifyService';
import matchingQueryService from './MatchingQueryService';
import configurationService from './ConfigurationService';
import { SystemOptionModel } from 'db/models/SystemOptionModel';

class MatchingService {
  private _userService = userService;
  private _notifyService = notifyService;
  private _matchingQueryService = matchingQueryService;
  private _configurationService = configurationService;

  private get _dbManager() {
    return getManager();
  }

  public async findMatch(currentUserId: number): Promise<SuccessErrorDto<MatchUserModel>> {
    const [currentUser] = await UserModel.find({
      where: { id: currentUserId },
      relations: ['city', 'userOptions'],
    });

    if (!currentUser) throw new Error('guy not exist');

    let guys: UserModel[] = await this._dbManager.query(
      await this._matchingQueryService.getAudioMatchingQuery(currentUser)
    );

    console.dir('audio match:');
    console.dir(guys);

    const audioMatchingGuys = [...guys];

    let minorMatchingGuys = [];

    if (!guys[0]) {
      guys = await this._dbManager.query(await this._matchingQueryService.getMinorQuery(currentUser));
      console.dir('minor match:');
      console.dir(guys);
      minorMatchingGuys = [...guys];
    }

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

    if (DEBUG_SEARCHING) {
      matchUserModel.user.description = `${matchUserModel.user.description}
      \n\n\naudio:\n${JSON.stringify(audioMatchingGuys, null, 2)}\n\nminor:\n${JSON.stringify(
        minorMatchingGuys,
        null,
        2
      )}`;
    }

    return response;
  }

  public async debugMatch(currentUserId: number, minor: boolean, options: SystemOptionModel[]) {
    const [currentUser] = await UserModel.find({
      where: { id: currentUserId },
      relations: ['city', 'userOptions'],
    });

    if (!currentUser) throw new Error('guy not exist');

    let guys: UserModel[];

    if (minor) {
      guys = await this._dbManager.query(await this._matchingQueryService.getMinorQuery(currentUser));
    } else {
      guys = await this._dbManager.query(await this._matchingQueryService.getAudioMatchingQuery(currentUser));
    }

    if (options) {
      await this._configurationService.setNumberOptions(options);
    }

    const response = { list: guys, coefs: await this._configurationService.loadNumberOptions() };

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
