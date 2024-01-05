import { getColor } from '~/helpers/colors'

export default () => ({
  checked: {
    icon: 'mdi-check-circle',
    color: getColor('functionalSuccess'),
  },
  waiting: {
    icon: 'mdi-alert',
    color: getColor('functionalGraph-3'),
  },
  pending: {
    icon: 'mdi-timer',
    color: getColor('functionalWarning'),
  },
})
