import { UserModel } from '../db/models/UserModel';
import SuccessErrorDto from '../models/SuccessErrorDto';
import { UserOptionsModel } from '../db/models/UserOptionsModel';

class UserOptionsService {
  public async createUserOptions(user: UserModel): Promise<UserOptionsModel> {
    const options = new UserOptionsModel();

    options.id = user.id;

    await options.save();

    return options;
  }

  public async patchUserOptions(newOptions: UserOptionsModel): Promise<SuccessErrorDto<UserOptionsModel>> {
    let options = await UserOptionsModel.findOne(newOptions.id);

    if (!options) {
      throw new Error('not exist');
    }

    for (const key in newOptions) {
      const val = newOptions[key];
      if (options.hasOwnProperty(key)) {
        options[key] = val;
      }
    }

    await options.save();

    return new SuccessErrorDto(options);
  }

  public async getUserOptions(id: number) {
    const options = UserOptionsModel.findOne(id);

    return options;
  }
}

const userOptionsService = new UserOptionsService();

export default userOptionsService;
