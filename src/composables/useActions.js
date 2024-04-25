import { statuses } from '~/constants/statuses'

const deleteAction = {
  icon: 'mdi-delete',
  label: 'Remove booking',
  action: 'remove-booking',
  color: 'functionalError',
}
const editAction = {
  icon: 'mdi-pencil',
  label: 'Edit booking',
  action: 'edit-booking',
}
const pauseAction = {
  icon: 'mdi-pause',
  label: 'Pause booking',
  action: 'pause-booking',
}
const duplicateAction = {
  icon: 'mdi-content-copy',
  label: 'Duplicate booking',
  action: 'duplicate-booking',
}
const cancelAction = {
  icon: 'mdi-cancel',
  label: 'Cancel booking',
  action: 'cancel-booking',
  color: 'functionalError',
}

export const bookingsActions = item => {
  const actions = []
  if (item.status === statuses.active) {
    actions.unshift(editAction, pauseAction, duplicateAction, deleteAction)
  }
  if (item.status === statuses.paused) {
    actions.push(
      {
        icon: 'mdi-reload',
        label: 'Re-activate booking',
        action: 'reactive-booking',
      },
      editAction,
      duplicateAction,
      cancelAction,
    )
  }
  if (item.status === statuses.pending) {
    actions.push(editAction, duplicateAction, cancelAction)
  }

  return actions
}
export const draftsActions = () => [
  {
    icon: 'mdi-pencil',
    label: 'Edit',
    action: 'edit-draft',
  },
  {
    icon: 'mdi-delete',
    label: 'Delete',
    action: 'delete-draft',
    color: 'functionalError',
  },
]
export const truckersListActions = () => [
  {
    icon: 'mdi-message-text',
    label: 'Message',
    action: 'to-message',
  },
  {
    icon: 'mdi-delete',
    label: 'Delete trucker',
    action: 'delete-trucker',
    color: 'functionalError',
  },
]
export const bookingHistoryActions = item => {
  const defaultAction = [
    {
      icon: 'mdi-delete',
      label: 'Delete',
      action: 'delete-booking',
      color: 'functionalError',
    },
  ]
  if (item.status === statuses.expired) {
    return [
      {
        icon: 'mdi-replay',
        label: 'Re-activate',
        action: 're-activate',
      },
      ...defaultAction,
    ]
  }
  return []
}
export const commitmentsActions = (status, bstatus,fromHistory=false) => {
  const viewDetailsAction = [
    {
      icon: 'mdi-information',
      label: 'View trucker details',
      action: 'view-trucker-details',
    },
  ]
  if(fromHistory){
    return viewDetailsAction
  }
  const actions = []

  if (status === statuses.pending && bstatus !== statuses.paused) {
    actions.push(
      {
        icon: 'mdi-check',
        label: 'Approve commitment',
        action: 'approve-commitment',
      },
      ...viewDetailsAction,
      {
        icon: 'mdi-cancel',
        label: 'Decline commitment',
        action: 'decline-commitment',
        color: 'functionalError',
      },
    )
  }
  if (status === statuses.pending && bstatus === statuses.paused) {
    actions.push(
      {
        icon: 'mdi-check',
        label: 'Approve commitment',
        action: 'approve-commitment',
      },
      ...viewDetailsAction,
      {
        icon: 'mdi-cancel',
        label: 'Decline commitment',
        action: 'decline-commitment',
        color: 'functionalError',
      },
    )
  }
  if (status === statuses.approved && bstatus !== statuses.paused) {
    actions.push(
      {
        icon: 'mdi-check-underline',
        label: 'Complete commitment',
        action: 'complete-commitment',
      },
      {
        icon: 'mdi-calendar',
        label: 'Edit loading date',
        action: 'update-loadingdate',
      },
      ...viewDetailsAction,
    )
  }
  if (
    status === statuses.approved &&
    (bstatus === statuses.active || bstatus === statuses.pending)
  ) {
    actions.push({
      icon: 'mdi-cancel',
      label: 'Cancel commitment',
      action: 'cancel-commitment',
      color: 'functionalError',
    })
  }

  return actions.length > 0 ? actions : viewDetailsAction
}
export default () => ({
  bookingsActions,
  draftsActions,
  truckersListActions,
  bookingHistoryActions,
  commitmentsActions,
})
