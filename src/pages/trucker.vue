<script setup>
import { getColor } from '~/helpers/colors'
import { useBookingsStore } from '~/stores/bookings.store'
import { storeToRefs } from 'pinia'
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '~/firebase'
import { useAlertStore } from '~/stores/alert.store'
import { getLocalTime } from '@qualle-admin/qutil/dist/date'
import { Main } from '@layouts'
import { useAuthStore } from '~/stores/auth.store'
import { uid } from 'uid'
import { statuses } from '~/constants/statuses'
const alertStore = useAlertStore()
const authStore = useAuthStore()
const bookingStore = useBookingsStore()
const { bookings } = storeToRefs(bookingStore)
const commitments = ref(null)
const trucker = ref({
  truckerId: '123',
  orgId: 'testTest',
  scac: 'ABCD',
  company: 'company 1',
  email: 'email@.gmail.com',
})
const cancelCommitDialog = ref(null)
const commitBooking = async booking => {
  const id = uid(16)
  const commitmentDate = getLocalTime().format()
  const commit = {
    id,
    bookingId: booking.id,
    orgId: trucker.value.orgId,
    ref: booking.ref,
    committed: booking.committed,
    company: trucker.value.company,
    email: trucker.value.email,
    truckerId: trucker.value.truckerId,
    scac: trucker.value.scac,
    commitmentDate: commitmentDate,
    bookingOrgId: booking.orgId,
    status: statuses.pending,
    timeline: [
      {
        title: `${trucker.value.scac} committed ${booking.committed} containers`,
        data: commitmentDate,
      },
      {
        title: 'Commitment is pending',
        data: commitmentDate,
      },
    ],
  }
  try {
    await setDoc(doc(db, 'commitments', id), commit)
  } catch ({ message }) {
    alertStore.warning({ content: message })
  }
}
const openCancelDialog = async commit => {
  cancelCommitDialog.value.show(true)
  cancelCommitDialog.value.data = commit
}
const cancelCommit = async () => {
  await updateDoc(doc(db, 'commitments', cancelCommitDialog.value.data.id), {
    status: statuses.canceled,
    cancelReason: 'Capacity not available',
  })
}
onMounted(async () => {
  await bookingStore.getBookings({ draft: false })
  const q = await query(
    collection(db, 'commitments'),
    where('bookingOrgId', '==', authStore.userData.orgId),
  )
  const docData = await onSnapshot(q, snapshot => {
    const list = snapshot.docs
    const arr = []
    list.forEach(i => {
      arr.push(i.data())
    })
    commitments.value = arr
  })
})
</script>
<template>
  <Main>
    <div class="mt-10 mx-8 mb-8">
      <Typography
        type="text-h3 mb-5"
        :color="getColor('textPrimary')"
      >
        Trucker data
      </Typography>
      <div class="grid sm:grid-cols-4 grid-cols-2 gap-5">
        <Textfield
          v-model="trucker.truckerId"
          label="Id"
          required
        />
        <Textfield
          v-model="trucker.scac"
          label="Scac"
          required
        />
        <Textfield
          v-model="trucker.company"
          label="Company"
          required
        />
        <Textfield
          v-model="trucker.email"
          label="Email"
          required
        />
      </div>
      <div class="my-5">
        <Typography
          type="text-h3"
          class="mb-5"
        >
          Bookings
        </Typography>
        <Card
          v-for="b in bookings"
          :key="b.id"
          class="grid sm:grid-cols-4 grid-cols-2 gap-x-5 px-2 py-1.5 my-2"
        >
          <Typography class="leading-10"> <b>Ref</b> {{ b.ref }} </Typography>
          <Textfield
            v-model="b.committed"
            label="Committed"
            required
          />
          <Button @click="commitBooking(b)"> commit </Button>
        </Card>
      </div>
      <div class="w-5/6">
        <Typography
          type="text-h3"
          class="mb-5"
        >
          Commitments
        </Typography>
        <Card
          v-for="c in commitments"
          :key="c.id"
          class="grid grid-cols-4 gap-x-5 px-2 py-1.5 my-2"
        >
          <Typography class="leading-10"> <b>trucker id</b> {{ c.id }} </Typography>
          <Typography class="leading-10"> <b>status</b>: {{ c.status }} </Typography>
          <Typography class="leading-10"> <b>ref</b>: {{ c.ref }} </Typography>
          <Button @click="openCancelDialog(c)"> cancel </Button>
        </Card>
      </div>
    </div>
  </Main>
  <Dialog
    ref="cancelCommitDialog"
    max-width="480"
  >
    <template #text>
      <ReportIssueCancelDialog
        title="Cancel commitment"
        sub-title="Choose the reason why you want to cancel reservation for container "
        select-label="Cancellation reason *"
        btn-name="Cancel"
        :reason-list="['Capacity not available', 'Equipment not available', 'Other']"
        @close="cancelCommit"
      />
    </template>
  </Dialog>
</template>
<route lang="yaml">
meta:
requiresAuth: true
</route>
