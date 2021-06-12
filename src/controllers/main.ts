import { app } from "../app";
import userService from "../services/UserService";
import EditUserModel from '../models/EditUserModel';

app.post("/user", async function(req, res) {
  const user = req.body as EditUserModel;

  await userService.addUser(user);

  res.sendStatus(200);
});


app.put("/user", async function(req, res) {
  const user = req.body as EditUserModel;

  await userService.updateUser(user);

  res.sendStatus(200);
});

app.get("/user/next", async function(req, res) {
  const userId = req?.query?.id;

  if (typeof userId !== 'string') {
    throw Error('err');
  }

  await userService.getNextUser(parseInt(userId));

  res.sendStatus(200);
});
