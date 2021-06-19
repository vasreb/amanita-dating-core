import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserAudioModel } from './UserAudioModel';

@Entity()
class Audio extends BaseEntity {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'bigint' }) vkId: number;

  @Column({ type: 'bigint' }) vkOwnerId: number;

  @Column() groupName: string;

  @Column() songName: string;

  @OneToMany((type) => UserAudioModel, (userAudio) => userAudio.user)
  userAudios: UserAudioModel[];
}

export { Audio as AudioModel };
