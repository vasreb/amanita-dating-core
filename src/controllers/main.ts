import { app } from '../app'
import userService from '../services/UserService'
import EditUserModel from '../models/EditUserModel'
import { withErrorHandling } from './../utils/errorMiddleware'

app.get(
  '/user/:id',
  withErrorHandling(async function (req, res, next) {
    try {
      const userId = req.params.id as string

      const result = await userService.getUser(parseInt(userId))

      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  })
)

app.post(
  '/user',
  withErrorHandling(async function (req, res) {
    const user = req.body as EditUserModel

    const result = await userService.addUser(user)

    res.status(200).json(result)
  })
)

app.put(
  '/user',
  withErrorHandling(async function (req, res) {
    const user = req.body as EditUserModel

    const result = await userService.updateUser(user)

    res.status(200).json(result)
  })
)

app.patch(
  '/user',
  withErrorHandling(async function (req, res) {
    const user = req.body as EditUserModel

    const result = await userService.patchUser(user)

    res.status(200).json(result)
  })
)

app.get(
  '/user/next',
  withErrorHandling(async function (req, res) {
    const userId = req?.query?.id

    if (typeof userId !== 'string') {
      throw Error('err')
    }

    await userService.getNextUser(parseInt(userId))

    res.sendStatus(200)
  })
)
