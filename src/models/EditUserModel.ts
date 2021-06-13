import Audio from './Audio';
import { AutoMap } from '@automapper/classes';

export default class EditUserModel {
  @AutoMap() id: number;
  @AutoMap() description: string;
  @AutoMap() name: string;
  @AutoMap() photoUrl: string;
  gender: string;
  age: number;
  cityName: string;
  audios: Audio[];
}
