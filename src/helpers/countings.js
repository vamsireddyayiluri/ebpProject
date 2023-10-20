export const getBookingLoad = (booked, amount) => {
  return Number(((booked * 100) / amount).toFixed(2))
}
export const getYardBookingLoad = items => {
  const obj = {
    amount: 0,
    booked: 0,
  }
  items.forEach(i => {
    obj.amount += i.amount
    obj.booked += i.booked
  })

  return {
    ...obj,
    rate: Number((obj.booked*100/obj.amount).toFixed(2)),
  }
}
