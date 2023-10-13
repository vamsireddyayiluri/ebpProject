import { groupBy, uniqBy, values } from 'lodash'
import { db } from '~/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { uid } from 'uid'

export const markersParser = entities => {
  return entities.map(i => {
    return {
      name: i.container,
      location: {
        lat: i.location?.lat,
        lng: i.location?.lng,
      },
      type: i.location.details?.isFlipYard ? 'flipLocation' : 'containersLocation',
      count: i.containers?.length,
      containers: i.containers,
    }
  })
}

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
