import { defineStore } from 'pinia'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from './auth.store'
import {
  calculateMonthlyAverage,
  getMonthsArray,
  groupBookingsByMonth,
  groupBySSL,
  calculateTruckerStats,
  groupBookingsByYard,
} from './helpers/statistics'

export const useStatisticsStore = defineStore('statistics', () => {
  const isLoading = ref(false)

  const authStore = useAuthStore()

  const getBookingsQuery = async () => {
    isLoading.value = true

    try {
      const orgData = await authStore.orgData
      const queryValue = query(collection(db, 'bookings'), where('orgId', '==', orgData.orgId))
      const querySnapshot = await getDocs(queryValue)

      isLoading.value = false

      return querySnapshot.docs.map(doc => doc.data())
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      isLoading.value = false
      throw error
    }
  }

  const statisticsOverall = async () => {
    const bookings = await getBookingsQuery()
    const totalBookings = bookings.length
    const totalSuccessful = bookings.filter(({ status }) => status === 'completed').length

    return {
      totalNumberOfBookings: totalBookings,
      bookingsMonthVolatility: calculateMonthlyAverage(bookings, 'all'),
      successfullyBookings: totalSuccessful,
      successfullyBookingsMonthVolatility: calculateMonthlyAverage(bookings, 'completed'),
      removedBookings: 0,
      removedBookingsMonthVolatility: calculateMonthlyAverage(bookings, 'canceled'),
      activityStatistic: {
        categories: getMonthsArray(),
        series: groupBookingsByMonth(bookings),
      },
    }
  }

  const statisticsBySSL = async () => {
    const bookings = await getBookingsQuery()
    const groupedBySSL = groupBySSL(bookings)

    return {
      bySSL: groupedBySSL,
      fulfillmentRate: {
        categories: groupedBySSL.map(({ line }) => line),
        series: [
          {
            data: groupedBySSL.map(({ jointBookings }) => jointBookings),
          },
        ],
      },
    }
  }

  const statisticsByTrucker = async () => {
    const bookings = await getBookingsQuery()
    const truckerStats = calculateTruckerStats(bookings)

    return truckerStats
  }

  const statisticsByYard = async () => {
    const locations = await authStore.orgData.locations
    const bookings = await getBookingsQuery()
    const groupedByYard = groupBookingsByYard(bookings, locations)

    return groupedByYard
  }

  return {
    isLoading,
    statisticsOverall,
    statisticsBySSL,
    statisticsByTrucker,
    statisticsByYard,
  }
})
