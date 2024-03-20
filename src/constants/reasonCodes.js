export const onboardingCodes = {
  onboarded: 'All loads were successfully moved',
  onboardMovedLoad: 'Trucker moved a different number of loads',
  inComplete: 'Trucker did not move the shipments',
}
export const declineCodes = {
  bookingCanceled: 'Booking canceled',
  bookingRolled: 'Booking rolled',
  tenderedElsewhere: 'Tendered elsewhere',
  other: 'Other',
}
export const canceledCodes = {
  capacityNotAvailable: 'Capacity not available',
  equipmentNotAvailable: 'Equipment not available',
  other: 'Other',
}
export default () => ({
  onboardingCodes,
  declineCodes,
  canceledCodes,
})
