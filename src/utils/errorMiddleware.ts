import { ErrorRequestHandler } from 'express'

import SuccessErrorDto from '../models/SuccessErrorDto'

const errorMiddleware: ErrorRequestHandler = (err: Error, req, res, next) => {
  const dto = new SuccessErrorDto()
  dto.errorMessage = err.message
  res.status(500).json(dto)
}

export default errorMiddleware

export const withErrorHandling = (fn) => {
  return function asyncUtilWrap(...args) {
    const fnReturn = fn(...args)
    const next = args[args.length - 1]
    return Promise.resolve(fnReturn).catch(next)
  }
}
