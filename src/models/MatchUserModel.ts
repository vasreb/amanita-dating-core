import { MatchModel } from 'db/models/MatchModel';
import EditUserModel from './EditUserModel';

export default class MatchUserModel {
  user: EditUserModel;
  match: MatchModel;
}
