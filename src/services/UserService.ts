import { UserAudioModel } from './../db/models/UserAudioModel';
import { UserModel } from '../db/models/UserModel';
import EditUserModel from '../models/EditUserModel';
import audioService from './AudioService';
import cityService from './CityService';
import SuccessErrorDto from '../models/SuccessErrorDto';
import UserIdResponse from '../models/UserIdResponse';
import userOptionsService from './UserOptionsService';

class UserService {
  private static readonly BadCityError = 'Город с таким названием не найден, попробуйте уточнить';

  private _audioService = audioService;
  private _cityService = cityService;
  private _userOptionsService = userOptionsService

  public async addUser(userModel: EditUserModel): Promise<SuccessErrorDto<UserIdResponse>> {
    const exist = await UserModel.findOne({ where: { id: userModel.id } });

    if (exist) throw new Error('already exist');

    const user = new UserModel();

    user.description = userModel.description;
    user.age = userModel.age;
    user.gender = userModel.gender;
    user.name = userModel.name;
    user.photoUrl = userModel.photoUrl;
    user.disabled = userModel.disabled;

    await user.save();

    let userAudios;

    if (userModel?.audios?.length) {
      userAudios = await this.addUserAudios(user, userModel);
    }

    const response = new SuccessErrorDto<UserIdResponse>();

    let cityName;
    if (userModel.cityName) {
      cityName = await this.addUserCity(user, userModel.cityName);
    }

    await this.createUserOptions(user);

    if (userModel.cityName && !cityName) {
      if (userAudios) {
        await UserAudioModel.remove(userAudios);
      }
      await UserModel.remove(user);

      response.errorMessage = UserService.BadCityError;

      return response;
    }

    response.data = new UserIdResponse(user.id);

    return response;
  }

  public async updateUser(userModel: EditUserModel): Promise<SuccessErrorDto<void>> {
    const user = await UserModel.findOne({ where: { id: userModel.id } });

    if (!user) throw new Error('guy not exist');

    user.description = userModel.description;
    user.name = userModel.name;
    user.photoUrl = userModel.photoUrl;
    user.age = userModel.age;
    user.gender = userModel.gender;
    user.disabled = userModel.disabled;

    await this.clearUserAudios(user.id);
    await user.save();
    await this.addUserAudios(user, userModel);

    const response = new SuccessErrorDto<void>();

    const cityName = await this.addUserCity(user, userModel.cityName);

    if (!cityName) {
      response.errorMessage = UserService.BadCityError;
    }

    return response;
  }

  public async patchUser(userModel: EditUserModel): Promise<SuccessErrorDto<void>> {
    const user = await UserModel.findOne({ where: { id: userModel.id } });

    if (!user) throw new Error('guy not exist');

    for (const key in userModel) {
      const val = userModel[key];
      if (user.hasOwnProperty(key)) {
        user[key] = val;
      }
    }

    if (userModel.audios) {
      await this.clearUserAudios(user.id);
      await this.addUserAudios(user, userModel);
    }

    const response = new SuccessErrorDto<void>();

    if (userModel.cityName) {
      const cityName = await this.addUserCity(user, userModel.cityName);

      if (!cityName) {
        response.errorMessage = UserService.BadCityError;
      }
    }

    await user.save();

    return response;
  }

  public async getUser(userId: number): Promise<SuccessErrorDto<EditUserModel>> {
    const exist = await UserModel.findOne({
      where: { id: userId },
      relations: ['city'],
    });

    const response = new SuccessErrorDto<EditUserModel>();

    if (!exist) {
      response.errorMessage = 'Не найден';

      return response;
    }

    const userModel = new EditUserModel();

    userModel.id = exist.id;
    userModel.description = exist.description;
    userModel.name = exist.name;
    userModel.age = exist.age;
    userModel.gender = exist.gender;
    userModel.photoUrl = exist.photoUrl;
    userModel.disabled = exist.disabled;
    userModel.audios = (await this.getUserAudios(userId)).map((a) => ({
      id: a.id,
      vkId: a.vkId,
      vkOwnerId: a.vkOwnerId,
      songName: a.songName,
      groupName: a.groupName,
    }));

    userModel.cityName = exist.city.name;

    response.data = userModel;

    return response;
  }

  private async createUserOptions(user: UserModel) {
    const options = await this._userOptionsService.createUserOptions(user);

    user.userOptionsId = options.id;

    await user.save();
  }

  private async getUserAudios(userId: number) {
    const userAudios = await UserAudioModel.find({
      where: { userId },
      relations: ['audio'],
    });

    return userAudios.map((uA) => uA.audio);
  }

  private async clearUserAudios(userId: number) {
    await UserAudioModel.delete({ userId });
  }

  private async addUserAudios(user: UserModel, model: EditUserModel) {
    const savedAudios = await this._audioService.addAudios(model.audios);

    const userAudios = savedAudios.map((a) => {
      const userAudio = new UserAudioModel();

      userAudio.userId = user.id;
      userAudio.audioId = a.id;

      return userAudio;
    });

    await UserAudioModel.save(userAudios);

    return userAudios;
  }

  private async addUserCity(user: UserModel, cityName: string): Promise<string> {
    const city = await this._cityService.addCity(cityName);

    if (!city) return null;

    user.cityId = city.id;

    await user.save();

    return city.name;
  }
}

const userService = new UserService();

export default userService;
