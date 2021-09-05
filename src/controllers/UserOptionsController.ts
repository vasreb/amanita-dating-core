import { app } from '../app';
import { withErrorHandling } from './../utils/errorMiddleware';
import { UserOptionsModel } from 'db/models/UserOptionsModel';
import userOptionsService from '../services/UserOptionsService';

app.get(
  '/userOptions/:id',
  withErrorHandling(async function (req, res) {
    const id = req.params.id as string;

    const result = await userOptionsService.getUserOptions(parseInt(id));

    res.status(200).json(result);
  })
);

app.patch(
  '/userOptions',
  withErrorHandling(async function (req, res) {
    const options = req.body as UserOptionsModel;

    const result = await userOptionsService.patchUserOptions(options);

    res.status(200).json(result);
  })
);
