import express from 'express'
import cors from 'cors'
import routes from './routes'
import { statusCodeErrorHandler, exceptionErrorHandler } from '@/middleware/error'

const router = express.Router()

router.use(cors({ origin: true }))
router.use(express.json({ strict: false }))
router.use(express.urlencoded({ extended: false }))

router.use('/api/v1', router)

router.use(statusCodeErrorHandler)
router.use(exceptionErrorHandler)

export default routes(router)
