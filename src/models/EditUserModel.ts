import Audio from './Audio';

export default interface UserModel {
    id: number;
    description: string;
    name: string;
    audios: Audio[];
}