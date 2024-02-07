import { statuses } from '~/constants/statuses'

export const bookingsActions = status => {
  const actions = [
    {
      icon: 'mdi-pencil',
      label: 'Edit booking',
      action: 'edit-booking',
    },
    {
      icon: 'mdi-delete',
      label: 'Remove booking',
      action: 'remove-booking',
      color: 'functionalError',
    },
  ]
  if (status !== statuses.paused) {
    const pauseAction = {
      icon: 'mdi-pause',
      label: 'Pause booking',
      action: 'pause-booking',
    }
    const secondToLastIndex = actions.length - 1
    actions.splice(secondToLastIndex, 0, pauseAction)
  }
  if (status === statuses.paused) {
    return [
      {
        icon: 'mdi-reload',
        label: 'Re-activate booking',
        action: 'reactive-booking',
      },
      ...actions,
    ]
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
}
export const commitmentsActions = (status, bstatus) => {
  const viewDetailsAction = [
    {
      icon: 'mdi-information',
      label: 'View trucker details',
      action: 'view-trucker-details',
    },
  ]

  if (status === statuses.pending && bstatus !== statuses.paused) {
    return [
      {
        icon: 'mdi-check',
        label: 'Approve',
        action: 'approve-commitment',
      },
      ...viewDetailsAction,
      {
        icon: 'mdi-cancel',
        label: 'Decline',
        action: 'decline-commitment',
        color: 'functionalError',
      },
    ]
  }
  if (status === statuses.approved && bstatus !== statuses.paused) {
    return [
      {
        icon: 'mdi-check-underline',
        label: 'Complete commitment',
        action: 'complete-commitment',
      },
      ...viewDetailsAction,
    ]
  }

  return viewDetailsAction
}
export default () => ({
  bookingsActions,
  draftsActions,
  truckersListActions,
  bookingHistoryActions,
  commitmentsActions,
})
