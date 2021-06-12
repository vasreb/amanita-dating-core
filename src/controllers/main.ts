import { app } from "../app";
import userService from "../services/UserService";
import EditUserModel from '../models/EditUserModel';

app.get("/user/:id", async function(req, res) {
  const userId = req.params.id as string;

  const result = await userService.getUser(parseInt(userId));

  res.status(200).json(result);
});

app.post("/user", async function(req, res) {
  const user = req.body as EditUserModel;

  const result = await userService.addUser(user);

  res.status(200).json(result);
});

app.put("/user", async function(req, res) {
  const user = req.body as EditUserModel;

  const result = await userService.updateUser(user);

  res.status(200).json(result);
});

app.patch("/user", async function(req, res) {
  const user = req.body as EditUserModel;

  const result = await userService.patchUser(user);

  res.status(200).json(result);
});

app.get("/user/next", async function(req, res) {
  const userId = req?.query?.id;

  if (typeof userId !== 'string') {
    throw Error('err');
  }

  await userService.getNextUser(parseInt(userId));

  res.sendStatus(200);
});
