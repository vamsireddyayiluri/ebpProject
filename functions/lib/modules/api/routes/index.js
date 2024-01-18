import express from 'express'

const router = express.Router()

import commitmentRoutes from './commitmentRoute'

router.use('/commitments', commitmentRoutes)

export default router
