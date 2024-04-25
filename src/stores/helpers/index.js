import { groupBy, uniqBy, values } from 'lodash'
import { db } from '~/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
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

export const getRequestLoadFee = async () => {
  const settingsCollection = query(doc(db, 'settings', 'request_loads'))
  const settings = await getDoc(settingsCollection)

  return settings.data()
}

export const getTruckers = async () => {
  const truckersQuery = query(collection(db, 'organizations'), where('org_type', '==', 'asset'))
  const querySnapshot = await getDocs(truckersQuery)

  return querySnapshot.docs.map(doc => {
    const { orgId, scac, email, company } = doc.data()

    return {
      id: orgId,
      scac,
      email,
      company,
    }
  })
}

export const groupBookings = objects => {
  const groupedObject = {}

  objects.forEach(obj => {
    const key = `${obj.ref}-${obj.orgId}-${obj.createdAt}`

    if (groupedObject[key]) {
      groupedObject[key].containers += obj.containers
      groupedObject[key].committed += obj.committed
      groupedObject[key].status = obj.status === 'active' ? obj.status : groupedObject[key].status

      groupedObject[key].details.push({
        loadingDate: obj.loadingDate,
        containers: obj.containers,
        committed: obj.committed || 0,
        scacList: { ...(obj?.scacList || { list: [] }) },
        id: obj.id,
      })
      groupedObject[key].ids.push(obj.id)
      groupedObject[key].scacList = { ...groupedObject[key].scacList, ...obj.scacList }
    } else {
      groupedObject[key] = { ...obj }
      groupedObject[key].details = [
        {
          loadingDate: obj.loadingDate,
          containers: obj.containers,
          committed: obj.committed || 0,
          scacList: { ...(obj?.scacList || { list: [] }) },
          id: obj.id,
        },
      ]
      groupedObject[key].ids = [obj.id]
      groupedObject[key].committed = obj.committed
      delete groupedObject[key].loadingDate

      // groupedObject[key].id = key
    }
  })

  return Object.values(groupedObject)
}
