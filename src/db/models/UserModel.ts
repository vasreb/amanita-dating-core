import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { AutoMap } from '@automapper/classes';
import { CityModel } from "./CityModel";
import { UserAudioModel } from "./UserAudioModel";

@Entity()
class User extends BaseEntity {
  @AutoMap()
  @PrimaryGeneratedColumn() id: number;

  @AutoMap()
  @Column({ length: 100 })
  name: string;

  @AutoMap()
  @Column({ length: 1000 })
  description: string;

  @AutoMap()
  @Column({ length: 1000 })
  photoUrl: string;

  @Column({ nullable: true })
  cityId: number;

  @OneToMany(type => UserAudioModel, userAudio => userAudio.user)
  userAudios: UserAudioModel[];

  @ManyToOne(type => CityModel, city => city.users)
  city: CityModel;
}

export { User as UserModel };
/*  */