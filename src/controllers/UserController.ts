import { app } from '../app';
import userService from '../services/UserService';
import EditUserModel from '../models/EditUserModel';
import { withErrorHandling } from './../utils/errorMiddleware';

app.get(
  '/user/:id',
  withErrorHandling(async function (req, res, next) {
    const userId = req.params.id as string;

    const result = await userService.getUser(parseInt(userId));

    res.status(200).json(result);
  })
);

app.post(
  '/user',
  withErrorHandling(async function (req, res) {
    const user = req.body as EditUserModel;

    const result = await userService.addUser(user);

    res.status(200).json(result);
  })
);

app.put(
  '/user',
  withErrorHandling(async function (req, res) {
    const user = req.body as EditUserModel;

    const result = await userService.updateUser(user);

    res.status(200).json(result);
  })
);

app.patch(
  '/user',
  withErrorHandling(async function (req, res) {
    const user = req.body as EditUserModel;

    const result = await userService.patchUser(user);

    res.status(200).json(result);
  })
);
