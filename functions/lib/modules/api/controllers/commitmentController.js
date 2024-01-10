import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { createError } from '~/middleware/error'

export const createCommitments = async (req, res, next) => {
  const {
    bookingId,
    committed,
    commodity,
    containers,
    created,
    details,
    email,
    id,
    line,
    loadingDate,
    location,
    name,
    orgId,
    originalOwner,
    owner,
    ref,
    scac,
    size,
    status,
    timeLine,
    truckerCompany,
    truckerEmail,
    truckerOrgId,
    updated,
  } = req.body

  try {
    functions.logger.log(
      bookingId,
      committed,
      commodity,
      containers,
      created,
      details,
      email,
      id,
      line,
      loadingDate,
      location,
      name,
      orgId,
      originalOwner,
      owner,
      ref,
      scac,
      size,
      status,
      timeLine,
      truckerCompany,
      truckerEmail,
      truckerOrgId,
      updated,
    )
  } catch (error) {
    next(createError({ code: 500, message: error }))
  }
}
