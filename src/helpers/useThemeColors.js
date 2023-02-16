import { useTheme } from 'vuetify'

export const useThemeColors = () => {
  const {
    current: {
      value: { colors },
    },
  } = useTheme()

  return colors
}
