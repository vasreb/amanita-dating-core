import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { UserModel } from './UserModel';

@Entity()
class UserOptions extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({ length: 100, nullable: true })
  searchGenderFilter: string;

  @OneToOne((type) => UserModel, (user) => user.userOptions)
  user: UserModel[];
}

export { UserOptions as UserOptionsModel };
