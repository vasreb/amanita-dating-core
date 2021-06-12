import { UserAudioModel } from "./../db/models/UserAudioModel";
import { UserModel } from "../db/models/UserModel";
import EditUserModel from "../models/EditUserModel";
import audioService from "./AudioService";

class UserService {
  private _audioService = audioService;

  public async addUser(userModel: EditUserModel): Promise<UserModel> {
    const exist = await UserModel.findOne({ where: { id: userModel.id } });

    if (exist) throw new Error("already exist");

    const user = new UserModel();

    user.description = userModel.description;
    user.name = userModel.name;

    await user.save();

    await this.addUserAudios(user, userModel);

    return user;
  }

  public async updateUser(userModel: EditUserModel): Promise<UserModel> {
    const user = await UserModel.findOne({ where: { id: userModel.id } });

    if (!user) throw new Error('guy not exist');

    user.description = userModel.description;
    user.name = userModel.name;

    await this.clearUserAudios(user.id);
    console.log('test');
    const p1 = this.addUserAudios(user, userModel);
    console.log('test2');
    const p2 = user.save();
    console.log('test3');

    await Promise.all([p1, p2]);

    return user;
  }

  public async getNextUser(currentUserId: number): Promise<void> {
    const currentUser = await UserModel.findOne({ where: { id: currentUserId }});

    if (!currentUser) throw new Error('guy not exist');

    
  }

  private async clearUserAudios(userId: number) {
    await UserAudioModel.delete({ userId });
  }

  private async addUserAudios(user: UserModel, model: EditUserModel) {
    const savedAudios = await this._audioService.addAudios(model.audios);

    await Promise.all(
      savedAudios.map(async (a) => {
        const userAudio = new UserAudioModel();

        userAudio.userId = user.id;
        userAudio.audioId = a.id;

        await userAudio.save();

        return userAudio;
      })
    );

    console.log('added some shit');
  }
}

const userService = new UserService();

export default userService;
