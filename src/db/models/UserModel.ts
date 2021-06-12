import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { UserAudioModel } from "./UserAudioModel";

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 1000 })
  description: string;

  @OneToMany(type => UserAudioModel, userAudio => userAudio.user)
  userAudios: UserAudioModel[];
}

export { User as UserModel };
