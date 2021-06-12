import { DADATA_SUGGEST_CONTROLLER, DADATA_TOKEN } from './../constants/constants';
import { CityModel } from '../db/models/CityModel';
import City from '../models/City';
import request from '../utils/request';
import DadataSuggestions from '../models/DadataSuggestions';

class CityService {
  public async addCity(name: string): Promise<CityModel> {
    const exist = await CityModel.findOne({ where: { name: name.trim() } });

    if (exist) {
      return exist;
    }

    const cities = await request<DadataSuggestions>(DADATA_SUGGEST_CONTROLLER, {
      method: 'POST',
      authorization: `Token ${DADATA_TOKEN}`,
      data: { query: name.trim() },
    });

    if (!cities.suggestions.length) {
      return null;
    }

    const city = cities.suggestions.find((c) => c.data.geo_lat);

    if (!city) {
      return null;
    }

    const cityModel = new CityModel();

    cityModel.name = name.trim();
    cityModel.geoLat = parseFloat(city.data.geo_lat);
    cityModel.geoLon = parseFloat(city.data.geo_lon);

    await cityModel.save();

    return cityModel;
  }
}

const cityService = new CityService();

export default cityService;
