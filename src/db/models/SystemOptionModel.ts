import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class SystemOption extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  value: string;

  @Column('decimal', { precision: 10, scale: 5 , nullable: true})
  numValue: number;
}

export { SystemOption as SystemOptionModel };
