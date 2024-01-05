import moment from "moment-timezone"
import {useAlertStore} from "~/stores/alert.store"

const alertStore = useAlertStore()
export const checkPositiveInteger = value => {
  if (value && (value < 0 || !Number.isInteger(value))) {
    return 'Value should be positive integer'
  } else {
    return true
  }
}

// Checking expiry date with ref is already exists or not
export const validateExpiryDate = (entities, entity) => {
  if (
    entities.find(
      val =>
        moment(val?.bookingExpiry).startOf('day').isSame(entity.bookingExpiry) &&
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
