import { groupBy, uniqBy, values } from 'lodash'
import { db } from '~/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { uid } from 'uid'
import moment from 'moment'
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

  const truckers = querySnapshot.docs
    .map(doc => {
      const { orgId, scac, email, company, accountType = null } = doc.data()
      if (accountType !== 'Maersk') {
        return { id: orgId, scac, email, company }
      }
    })
    .filter(Boolean)

  return truckers
}

export const groupBookings = objects => {
  const groupedObject = {}

  objects.forEach(obj => {
    const key = `${obj.ref}-${obj.orgId}-${obj.createdAt}`

    if (groupedObject[key]) {
      groupedObject[key].containers += obj.containers
      groupedObject[key].committed += obj.committed
      groupedObject[key].status = obj.status === 'active' ? obj.status : groupedObject[key].status
      if (obj.newScacs) {
        obj.newScacs.map(scacObj => {
          if (scacObj.flexibleLoadingDate) {
            scacObj.loadingDate = null
          } else {
            scacObj.loadingDateRange = {
              startDate: moment().format('YYYY-MM-DD'),
              endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
            }
          }
        })
      }
      groupedObject[key].details.push({
        flexibleLoadingDate: obj.flexibleLoadingDate ? obj.flexibleLoadingDate : false,
        loadingDate: obj.loadingDate ? obj.loadingDate : null,
        loadingDateRange: obj.loadingDateRange
          ? obj.loadingDateRange
          : {
              startDate: moment().format('YYYY-MM-DD'),
              endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
            },
        containers: obj.containers,
        committed: obj.committed || 0,
        scacList: { ...(obj?.scacList || { list: [] }) },
        id: obj.id,
        newScacs: obj.newScacs,
      })
      groupedObject[key].ids.push(obj.id)
      groupedObject[key].scacList = { ...groupedObject[key].scacList, ...obj.scacList }
    } else {
      groupedObject[key] = { ...obj }
      obj.newScacs.map(obj => {
        if (obj.flexibleLoadingDate) {
          obj.loadingDate = null
        } else {
          obj.loadingDateRange = {
            startDate: moment().format('YYYY-MM-DD'),
            endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
          }
        }
      })

      groupedObject[key].details = [
        {
          loadingDate: obj.loadingDate ? obj.loadingDate : obj.loadingDateRange.endDate,
          flexibleLoadingDate: obj.flexibleLoadingDate ? obj.flexibleLoadingDate : false,
          loadingDateRange: obj.loadingDateRange
            ? obj.loadingDateRange
            : {
                startDate: moment().format('YYYY-MM-DD'),
                endDate: moment().add(3, 'days').format('YYYY-MM-DD'),
              },
          containers: obj.containers,
          committed: obj.committed || 0,
          scacList: { ...(obj?.scacList || { list: [] }) },
          id: obj.id,
          newScacs: obj.newScacs,
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
