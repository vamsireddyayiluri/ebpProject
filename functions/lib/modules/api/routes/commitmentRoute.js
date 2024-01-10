import express from 'express'
import { createCommitments } from '../controllers/commitmentController'

const router = express.Router()

router.get('/', createCommitments)

export default router
