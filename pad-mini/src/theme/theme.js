import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#e91e63', // Soft pink
    secondary: '#9c27b0', // Lavender
    accent: '#4dd0e1', // Teal
    background: '#fce4ec', // Very light pink
    surface: '#ffffff',
    text: '#2d2d2d',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: '#2d2d2d',
    notification: '#ff5722',
    // Custom colors for the app
    safeGreen: '#4caf50',
    warningOrange: '#ff9800',
    errorRed: '#f44336',
    lightPink: '#f8bbd9',
    softLavender: '#e1bee7',
    mintGreen: '#b2dfdb'
  },
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};