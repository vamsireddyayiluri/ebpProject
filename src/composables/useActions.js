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
export default () => ({
  bookingsActions,
})
