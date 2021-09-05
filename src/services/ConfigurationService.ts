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

const coefs = {
  DISTANCE_COEF: null,
  AUDIO_VKID_COEF: null,
  AUDIO_GROUPSONG_COEF: null,
  AUDIO_GROUP_COEF: null,
  AGE_COEF: null,
  ACTIVITY_COEF: null,
  MATCHES_COEF: null,
};

class ConfigurationService {
  private coefs = coefs;

  constructor() {
    /* seeding */
    Object.values(this.coefs).forEach(async (key) => {
      const option = await SystemOptionModel.findOne({ where: { name: key } });
      if (!option.value && !option.numValue) {
        option.value = '1';
        option.numValue = 1;
        option.save();
      }
    });
  }

  public async loadNumberOptions(object: Partial<typeof coefs> = this.coefs) {
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
