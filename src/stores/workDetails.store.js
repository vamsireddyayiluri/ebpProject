import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAuthStore } from '~/stores/auth.store'
import { useAlertStore } from '~/stores/alert.store'
import { useBookingRulesStore } from '~/stores/bookingRules.store'

export const useWorkDetailsStore = defineStore('workDetails', () => {
  const alertStore = useAlertStore()
  const authStore = useAuthStore()
  const yards = ref([])
  const vendorDetails = ref(authStore.orgData?.vendorDetails || {
    primaryContact: null,
    primaryContactName: null,
    primaryContactEmail: null,
    secondaryContact: null,
    secondaryContactName: null,
    secondaryContactEmail: null,
    pickupInstructions: null,
    hoursOfOperation: null,
  })

  const getYards = () => {
    yards.value = authStore.orgData?.locations?.map(i => {
      return {
        ...i,
        text: `Commodity: ${i.commodity} ${i.details?.customizedDetails? '- (customized details)': ''}`,
      }
    })
  }
  const addYard = yard => {
    yards.value.push(yard)
  }
  const removeYard = yardId => {
    const index = yards.value.findIndex(q => q.id === yardId)
    yards.value.splice(index, 1)
  }
  const saveYards = async yards => {
    const { orgData } = useAuthStore()
    const { rules } = useBookingRulesStore()

    let data = {
      locations: yards,
    }
    if (!yards.find(val => val.label === rules?.yard?.label)) {
      delete rules?.yard
      data.bookingRules = rules
    }
    try {
      await updateDoc(doc(db, 'organizations', orgData.orgId), data)
      alertStore.info({ content: 'Yard details saved!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const saveVendorDetails = async vendorDetails => {
    try {
      await updateDoc(doc(db, 'organizations', authStore.orgData.orgId), {
        vendorDetails: vendorDetails,
      })
      alertStore.info({ content: 'Default details saved!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }
  const saveYardDetails = async location => {
    const updatedDetails = yards.value.map(i => {
      if (i.id === location.id) {
        return {
          ...i, details: {...i.details, ...location.details, customizedDetails: true},
        }
      } else return i
    })

    try {
      await updateDoc(doc(db, 'organizations', authStore.orgData.orgId), {
        locations: updatedDetails,
      })
      await getYards()
      await authStore.getOrgData(authStore.orgData.orgId)
      alertStore.info({ content: 'Yard details saved!' })
    } catch ({ message }) {
      alertStore.warning({ content: message })
    }
  }

  return {
    yards,
    vendorDetails,
    getYards,
    addYard,
    removeYard,
    saveYards,
    saveVendorDetails,
    saveYardDetails,
  }
})
