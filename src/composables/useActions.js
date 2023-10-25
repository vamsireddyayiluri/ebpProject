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
export default () => ({
  bookingsActions,
  draftsActions,
  truckersListActions,
})
