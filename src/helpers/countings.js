export const getBookingLoad = (booked, amount) => {
  return Number((booked * 100) / amount).toFixed(2)
}
