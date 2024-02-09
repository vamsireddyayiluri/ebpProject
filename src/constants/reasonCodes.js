export const onboardingCodes = {
  onboarded: 'Onboarded',
  onboardMovedLoad: 'Onboard and moved load',
  neverOnboarded: 'Never onboarded',
  other: 'Other',
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
