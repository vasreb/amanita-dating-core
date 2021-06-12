import { In } from 'typeorm';
import { AudioModel } from "../db/models/AudioModel";
import Audio from "../models/Audio";

class AudioService {
  public async addAudios(audios: Audio[]): Promise<AudioModel[]> {
    const existAudios = await AudioModel.find({
      where: [{ vkId: In(audios.map(a => a.vkId)) }, { id: In(audios.map(a => a.id)) }],
    });

    const notExistAudios = audios.filter(
      a =>
        !(
          existAudios.map(ad => ad.vkId).includes(a.vkId) ||
          existAudios.map(ad => ad.id).includes(a.id)
        )
    );

    const addedAudios = notExistAudios.map(async n => {
      const audio = new AudioModel();
      audio.vkId = n.vkId;
      audio.groupName = n.groupName;
      audio.songName = n.songName;

      await audio.save();

      return audio;
    });

    const savedAudios = await Promise.all(addedAudios);

    const sorted = audios.map(
      a =>
        existAudios.find(
          e => e.songName === a.songName && e.groupName === a.groupName
        ) ||
        savedAudios.find(
          e => e.songName === a.songName && e.groupName === a.groupName
        )
    );

    return sorted;
  }
}

const audioService = new AudioService();

export default audioService;
