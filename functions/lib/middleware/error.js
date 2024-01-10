import * as functions from 'firebase-functions'

const preparedMessage = message => JSON.stringify(message)

export const createError = ({ code = 500, message }) => {
  const error = new Error(message)

  error.code = code

  return error
}

export const statusCodeErrorHandler = (err, req, res, next) => {
  const { message } = err

  if (err.code === 500) {
    next(err)
  } else {
    functions.logger.warn(`Error in ${req.route.path}: ${preparedMessage(message)}`)

    return res.status(err.code).send({ status: 'error', message: message })
  }
}

export const exceptionErrorHandler = (error, req, res, next) => {
  const { code = 500, message } = error

  res.code = code

  functions.logger.error(`Error in ${req.route.path}: ${preparedMessage(message)}`)

  return res.status(res.code).send({ status: 'error', message })
}
