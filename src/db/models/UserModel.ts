import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { CityModel } from './CityModel';
import { UserAudioModel } from './UserAudioModel';
import { MatchModel } from './MatchModel';
import { UserOptionsModel } from './UserOptionsModel';

@Entity()
class User extends BaseEntity {
  @AutoMap()
  @PrimaryGeneratedColumn()
  id: number;

  @AutoMap()
  @Column({ length: 100, nullable: true })
  name: string;

  @AutoMap()
  @Column({ length: 1500, nullable: true })
  description: string;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  age: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  activityDate: Date;

  @Column({ nullable: true })
  activity: number;

  @AutoMap()
  @Column({ length: 1000, nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  cityId: number;

  @Column({ nullable: true })
  userOptionsId: number;

  @OneToMany((type) => UserAudioModel, (userAudio) => userAudio.user)
  userAudios: UserAudioModel[];

  @ManyToOne((type) => CityModel, (city) => city.users)
  city: CityModel;

  @OneToOne(type => UserOptionsModel, userOpt => userOpt.user)
  @JoinColumn()
  userOptions: UserOptionsModel;

  @OneToMany((type) => MatchModel, (match) => [match.user1, match.user2])
  matches: MatchModel[];
}

export { User as UserModel };
/*  */
