import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
} from "typeorm";
import { AudioModel } from "./AudioModel";
import { UserModel } from "./UserModel";

@Entity()
class UserAudio extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column() audioId: number;

  @Column() userId: number;

  @ManyToOne(type => UserModel, user => user.userAudios)
  user: UserModel;
  @ManyToOne(type => AudioModel, audio => audio.userAudios)
  audio: UserModel;
}

export { UserAudio as UserAudioModel };
