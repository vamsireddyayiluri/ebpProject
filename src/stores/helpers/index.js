import { groupBy, uniqBy, values } from 'lodash'
import { db } from '~/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { uid } from 'uid'

export const groupedBookingLocations = bookings =>
  values(groupBy(bookings, ({ location: { geohash } }) => geohash)).map(group => ({
    id: group[0].location.geohash,
    location: group[0].location,
    entities: group,
    lines: uniqBy(
      group.map(val => val.line),
      ({ id }) => id,
    ),
  }))

export const getOrgId = async (email = '') => {
  const invitations = query(collection(db, 'invitations'), where('email', '==', email))
  const invitationsCollection = await getDocs(invitations)

  const inviteDoc = invitationsCollection.docs[0]

  const orgQuery = query(collection(db, 'organizations'), where('email', '==', email))

  const organizationsCollection = await getDocs(orgQuery)

  const organizationDoc = organizationsCollection.docs[0]

  if (organizationDoc) {
    const { orgId } = organizationDoc.data()

    return orgId
  } else if (inviteDoc) {
    const { orgId } = inviteDoc.data()

    return orgId
  } else {
    return uid(28)
  }
}

export const getUserIdByEmail = async email => {
  const userCollection = query(collection(db, 'users'), where('email', '==', email))
  const users = await getDocs(userCollection)

  return users.docs[0].id
}
