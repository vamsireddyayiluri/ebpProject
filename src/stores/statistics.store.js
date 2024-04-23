import { defineStore } from 'pinia'
import { collection, query, where, getDocs, doc } from 'firebase/firestore'
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
  const orgId = computed(() => authStore.getOrgData().orgId)

  const getBookingsQuery = computed(() =>
    query(collection(db, 'bookings'), where('orgId', '==', orgId.value)),
  )

  async function fetchBookings() {
    isLoading.value = true

    try {
      const snapshot = await getDocs(getBookingsQuery.value)
      const bookings = snapshot.docs.map(doc => doc.data())
      isLoading.value = false

      return bookings
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      isLoading.value = false
      throw error
    }
  }

  const statisticsOverall = async () => {
    const bookings = await fetchBookings()
    const totalBookings = bookings.length
    const totalSuccessful = bookings.filter(({ status }) => status === 'completed').length

    return {
      totalBookings: totalBookings,
      totalBookingsAvg: calculateMonthlyAverage(bookings, 'all'),
      totalSuccessful: totalSuccessful,
      totalSuccessfulAvg: calculateMonthlyAverage(bookings, 'completed'),
      removedFromNetwork: 0,
      removedFromNetworkAvg: 0,
      activityStatistic: {
        categories: getMonthsArray(),
        series: [{ data: groupBookingsByMonth(bookings) }],
      },
    }
  }

  const statisticsBySSL = async () => {
    const bookings = await fetchBookings()
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
    const bookings = await fetchBookings()
    const truckerStats = calculateTruckerStats(bookings)

    return truckerStats
  }

  const statisticsByYard = async () => {
    const locations = authStore.getOrgData().locations
    const bookings = await fetchBookings()
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
