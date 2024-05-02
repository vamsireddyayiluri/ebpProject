export const getBookingLoad = (booked, amount) => {
  if (!amount || booked>amount) return 0

  return Number(((booked * 100) / amount).toFixed(2))
}
export const getYardBookingLoad = items => {
  const obj = {
    amount: 0,
    booked: 0,
  }
  items.forEach(i => {
    obj.amount += i.containers
    obj.booked += i.committed
  })

  return {
    ...obj,
    rate: Number(((obj.booked * 100) / obj.amount).toFixed(2)) || 0,
  }
}

export const totalFulfilledBookings = bookings => {
  const { fulfilled, total } = bookings.reduce(
    (acc, item) => {
      if (item.carriers) {
        const { fulfilled, total } = item.carriers.reduce(
          (carrierAcc, carrier) => ({
            fulfilled: carrierAcc.fulfilled + (carrier.fulfilled || 0),
            total: carrierAcc.total + (carrier.total || 0),
          }),
          { fulfilled: 0, total: 0 },
        )

        acc.fulfilled += fulfilled
        acc.total += total
      } else {
        acc.fulfilled += item.fulfilled || 0
        acc.total += item.total || 0
      }

      return acc
    },
    { fulfilled: 0, total: 0 },
  )

  return total !== 0 ? ((fulfilled / total) * 100).toFixed(2) : 0
}
