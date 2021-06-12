import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { UserModel } from "./UserModel";

@Entity()
class City extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({ length: 100 })
  name: string;

  @Column("decimal", { precision: 9, scale: 6 })
  geoLat: number;

  @Column("decimal", { precision: 9, scale: 6 })
  geoLon: number;
  
  @OneToMany(type => UserModel, user => user.city)
  users: UserModel[];
}

export { City as CityModel };
