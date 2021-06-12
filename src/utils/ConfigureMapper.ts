import { UserModel } from '../db/models/UserModel'
import EditUserModel from '../models/EditUserModel'
import mapper from './Mapper'

mapper.createMap(UserModel, EditUserModel)
