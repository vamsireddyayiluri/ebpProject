import { statuses } from '~/constants/statuses'

export const bookingsActions = () => [
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
export default () => ({
  bookingsActions,
  draftsActions,
  truckersListActions,
  bookingHistoryActions,
})
