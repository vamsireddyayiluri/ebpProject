import express from 'express'
import { createCommitments } from '../controllers/commitmentController'

const router = express.Router()

router.post('/', createCommitments)

export default router
