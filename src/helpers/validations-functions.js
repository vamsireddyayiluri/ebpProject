import moment from 'moment-timezone'
import { useAlertStore } from '~/stores/alert.store'
import { isNull } from 'lodash'
import { useWorkDetailsStore } from '~/stores/workDetails.store'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '~/firebase'
import { useBookingsStore } from '~/stores/bookings.store'
import { defaultOverWeight, maximumOverWeight, minimumLegalWeight } from '~/constants/settings'

const alertStore = useAlertStore()
const bookingsStore = useBookingsStore()

export const checkCommittedValue = (value, booking) => {
  if (value < booking?.committed) {
    return `Value should not be less than ${booking?.committed}`
  } else {
    return checkPositiveInteger(value, booking)
  }
}
export const checkPositiveInteger = value => {
  if (value <= 0 || !Number.isInteger(value) || value === 0) {
    return 'Value should be positive integer'
  } else {
    return true
  }
}

// check empty string
export const isEmptyString = string => {
  return string === ''
}

export const validateDays = value => {
  if (isEmptyString(value) || isNull(value)) {
    return true
  } else return checkPositiveInteger(value)
}

// Checking expiry date with ref is already exists or not
export const validateExpiryDate = (entities, entity) => {
  if (
    entities.find(
      val =>
        moment(val?.loadingDate).endOf('day').isSame(moment(entity?.loadingDate).endOf('day')) &&
        val?.ref?.trim() === entity.ref?.trim() &&
        val.id !== entity.id,
    )
  ) {
    /*alertStore.warning({
      content:
        'Booking expiry date with booking number already exists. Update booking expiry date to new date.',
    })*/

    return 'Booking expiry date with booking number already exists. Update booking expiry date to new date.'
  } else {
    return false
  }
}

export const validateFlexibleSizes = (value, flexiblBooking) => {
  if (flexiblBooking === true) {
    if (value?.length > 2) {
      return 'Cannot select more than 2'
    }
  } else {
    return ''
  }
}
const workDetailsStore = useWorkDetailsStore()
export const checkVendorDetailsCompletion = () => {
  const { vendorDetails } = workDetailsStore
  if (
    vendorDetails?.pickupInstructions &&
    vendorDetails?.primaryContact &&
    vendorDetails?.primaryContactName
  ) {
    return true
  } else
    alertStore.warning({
      content: 'Please add yard details in settings to perform actions',
      button: {
        name: 'Go to yard details',
        callback: async () => await alertStore.routerPush({ name: 'settings' }),
      },
    })
}
export const isExistName = (list, value, key) => {
  return list.some(i => i[key] === value)
}
export const validateAverageWeight = (value, location) => {
  if (location?.details?.overweight) {
    return value < defaultOverWeight || value > maximumOverWeight
      ? `Weight must be b/w ${defaultOverWeight} to ${maximumOverWeight}`
      : true
  } else {
    return value < minimumLegalWeight || value >= defaultOverWeight
      ? `Weight must be b/w ${minimumLegalWeight} to ${defaultOverWeight - 1}`
      : true
  }
}
const checkPendingBookings = () => {
  const currentTimestamp = getLocalTime().format()

  return bookingsStore.bookings.filter(
    b => (b.status === 'active' || b.status === 'pending') && b.loadingDate < currentTimestamp,
  )
}
export const checkPendingCommitments = async () => {
  const pendingBookings = checkPendingBookings()

  return pendingBookings.map(async i => {
    const q = query(
      collection(db, 'commitments'),
      where('bookingId', '==', i.id),
      where('status', 'in', ['approved', 'pending']),
    )
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(doc => doc.data())
  })
}

export const checkUniqueDates = entities => {
  const datesCount = {}

  for (const entity of entities) {
    if (datesCount[entity.loadingDate]) {
      return false
    } else {
      datesCount[entity.loadingDate] = true
    }
  }

  return true
}
