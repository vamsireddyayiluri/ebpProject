import { defineStore } from 'pinia'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from './auth.store'
import {
  calculateMonthlyAverage,
  calculateTruckerStats,
  getDaysInMonth,
  getMonthsArray,
  groupBookingsByDays,
  groupBookingsByMonth,
  groupBookingsByYard,
  groupBySSL,
} from './helpers/statistics'

export const useStatisticsStore = defineStore('statistics', () => {
  const authStore = useAuthStore()
  const allBookings = ref(null)
  const isLoading = ref(false)

  const getBookingsQuery = async () => {
    isLoading.value = true
    try {
      const orgData = await authStore.orgData
      const queryValue = query(collection(db, 'bookings'), where('orgId', '==', orgData.orgId))
      const querySnapshot = await getDocs(queryValue)

      allBookings.value = querySnapshot.docs.map(doc => doc.data())
      isLoading.value = false

      return querySnapshot.docs.map(doc => doc.data())
    } catch (error) {
      isLoading.value = false
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
    const bookings = allBookings.value || (await getBookingsQuery())
    const totalBookings = bookings.length
    const totalSuccessful = bookings.filter(({ status }) => status === 'completed').length
    const totalCanceled = bookings.filter(({ status }) => status === 'canceled').length
    const data = {
      totalNumberOfBookings: totalBookings,
      bookingsMonthVolatility: calculateMonthlyAverage(bookings, 'all'),
      successfullyBookings: totalSuccessful,
      successfullyBookingsMonthVolatility: calculateMonthlyAverage(bookings, 'completed'),
      totalCanceled,
      canceledBookingsMonthVolatility: calculateMonthlyAverage(bookings, 'canceled'),
    }
    isLoading.value = false

    return data
  }

  const activityStatistic = async ({ year = null, month = null }) => {
    return {
      categories: month ? getDaysInMonth(year, month) : getMonthsArray(),
      series: month
        ? groupBookingsByDays(allBookings.value, year, month)
        : groupBookingsByMonth(allBookings.value, year),
    }
  }

  const statisticsBySSL = async () => {
    isLoading.value = true
    const bookings = allBookings.value || (await getBookingsQuery())
    const groupedBySSL = groupBySSL(bookings)
    const data = {
      bySSL: groupedBySSL,
      fulfillmentRate: {
        categories: groupedBySSL.map(({ line }) => line.label),
        series: [
          {
            name: 'Rate',
            data: groupedBySSL.map(({ fulfillmentRates }) => fulfillmentRates),
          },
        ],
      },
    }
    isLoading.value = false

    return data
  }

  const statisticsByTrucker = async () => {
    isLoading.value = true
    const bookings = allBookings.value || (await getBookingsQuery())
    const commitments = await getCommitmentsQuery()
    const truckerStats = calculateTruckerStats(bookings, commitments)
    isLoading.value = false

    return truckerStats
  }

  const statisticsByYard = async () => {
    isLoading.value = true
    const locations = await authStore.orgData.locations
    const bookings = allBookings.value || (await getBookingsQuery())
    const groupedByYard = groupBookingsByYard(bookings, locations)
    isLoading.value = false

    return groupedByYard
  }

  return {
    isLoading,
    getBookingsQuery,
    statisticsOverall,
    activityStatistic,
    statisticsBySSL,
    statisticsByTrucker,
    statisticsByYard,
  }
})
