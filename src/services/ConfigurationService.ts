import { In } from 'typeorm';
import { SystemOptionModel } from '../db/models/SystemOptionModel';

type OptionName =
  | 'DISTANCE_COEF'
  | 'AUDIO_VKID_COEF'
  | 'AUDIO_GROUPSONG_COEF'
  | 'AUDIO_GROUP_COEF'
  | 'AGE_COEF'
  | 'ACTIVITY_COEF'
  | 'MATCHES_COEF';

class ConfigurationService {
  public async loadNumberOptions(object: Object) {
    const res = await SystemOptionModel.find({ where: { name: In(Object.keys(object)) } });

    for (let key in object) {
      const val = res.find((r) => r.name === key);
      object[key] = val.numValue;
    }

    return object;
  }

  public async getNumberOption(name: OptionName) {
    const res = await SystemOptionModel.findOne({ where: { name } });

    return res.numValue;
  }

  public async getOption(name: OptionName) {
    const res = await SystemOptionModel.findOne({ where: { name } });

    return res.value;
  }
}

const configurationService = new ConfigurationService();

export default configurationService;
