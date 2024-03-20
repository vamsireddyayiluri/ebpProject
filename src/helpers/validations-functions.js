import moment from 'moment-timezone'
import { useAlertStore } from '~/stores/alert.store'
import { isNull } from 'lodash'
import { useWorkDetailsStore } from '~/stores/workDetails.store'

const alertStore = useAlertStore()

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
    alertStore.warning({
      content:
        'Booking expiry date with booking number already exists. Update booking expiry date to new date.',
    })

    return false
  } else {
    return true
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
    })
}
