import * as functions from 'firebase-functions'
import express from 'express'
import cors from 'cors'
import router from './routes'
import { statusCodeErrorHandler, exceptionErrorHandler } from '~/middleware/error'

const API_VERSION = 'v1'

const app = express()

const errorMiddleware = [statusCodeErrorHandler, exceptionErrorHandler]

app.use(cors({ origin: true }))
app.use(express.json({ strict: false }))
app.use(express.urlencoded({ extended: false }))

app.use(`/api/${API_VERSION}`, router)

app.use(errorMiddleware)

export default functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 60,
  })
  .https.onRequest(app)
