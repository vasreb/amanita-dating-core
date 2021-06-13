import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { UserModel } from './UserModel';

@Entity()
class Match extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column()
  user1Id: number;

  @Column()
  user2Id: number;

  @Column({ default: false })
  user1Like: boolean = false;

  @Column({ default: false })
  user2Like: boolean = false;

  @Column({ nullable: true })
  user1LikeDate: Date;

  @Column({ nullable: true })
  user2LikeDate: Date;

  @Column({ nullable: true })
  creationDate: Date;

  @ManyToOne((type) => UserModel, (user) => user.matches)
  user1: UserModel;

  @ManyToOne((type) => UserModel, (user) => user.matches)
  user2: UserModel;
}

export { Match as MatchModel };
