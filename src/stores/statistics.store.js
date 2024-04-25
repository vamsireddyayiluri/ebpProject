import { defineStore } from 'pinia'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from './auth.store'
import {
  calculateMonthlyAverage,
  calculateTruckerStats,
  getMonthsArray,
  groupBookingsByMonth,
  groupBookingsByYard,
  groupBySSL,
} from './helpers/statistics'

export const useStatisticsStore = defineStore('statistics', () => {
  const authStore = useAuthStore()

  const isLoading = ref(false)

  const getBookingsQuery = async () => {
    try {
      const orgData = await authStore.orgData
      const queryValue = query(collection(db, 'bookings'), where('orgId', '==', orgData.orgId))
      const querySnapshot = await getDocs(queryValue)

      return querySnapshot.docs.map(doc => doc.data())
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      throw error
    }
  }

  const getCommitmentsQuery = async () => {
    try {
      const queryValue = query(collection(db, 'commitments'))
      const querySnapshot = await getDocs(queryValue)

      return querySnapshot.docs.map(doc => doc.data())
    } catch (error) {
      console.error('Failed to fetch commitments:', error)
      throw error
    }
  }

  const statisticsOverall = async () => {
    isLoading.value = true
    const bookings = await getBookingsQuery()
    const totalBookings = bookings.length
    const totalSuccessful = bookings.filter(({ status }) => status === 'completed').length
    const data = {
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
    isLoading.value = false

    return data
  }

  const statisticsBySSL = async () => {
    isLoading.value = true
    const bookings = await getBookingsQuery()
    const groupedBySSL = groupBySSL(bookings)
    const data = {
      bySSL: groupedBySSL,
      fulfillmentRate: {
        categories: groupedBySSL.map(({ line }) => line.label),
        series: [
          {
            data: groupedBySSL.map(({ jointBookings }) => jointBookings),
          },
        ],
      },
    }
    isLoading.value = false

    return data
  }

  const statisticsByTrucker = async () => {
    isLoading.value = true
    const bookings = await getBookingsQuery()
    const commitments = await getCommitmentsQuery()
    const truckerStats = calculateTruckerStats(bookings, commitments)
    isLoading.value = false

    return truckerStats
  }

  const statisticsByYard = async () => {
    isLoading.value = true
    const locations = await authStore.orgData.locations
    const bookings = await getBookingsQuery()
    const groupedByYard = groupBookingsByYard(bookings, locations)
    isLoading.value = false

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
