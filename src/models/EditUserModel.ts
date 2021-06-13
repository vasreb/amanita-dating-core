import Audio from './Audio';

export default class EditUserModel {
  id: number;
  description: string;
  name: string;
  photoUrl: string;
  gender: string;
  age: number;
  cityName: string;
  audios: Audio[];
}
