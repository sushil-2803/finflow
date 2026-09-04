import { Platform } from 'react-native';

export const lightColors = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F7',
  text: '#182230',
  muted: '#667085',
  border: '#E4E7EC',
  primary: '#176B87',
  primaryLight: '#E6F4F6',
  success: '#147A5B',
  successLight: '#E7F6F0',
  warning: '#B54708',
  warningLight: '#FFF4E5',
  danger: '#B42318',
  dangerLight: '#FDECEA',
  blue: '#175CD3',
  blueLight: '#EEF4FF',
  purple: '#6941C6',
  purpleLight: '#F4F3FF',
};

export const darkColors = {
  background: '#0B0F19',
  surface: '#151D2F',
  surfaceMuted: '#1E293B',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#27354A',
  primary: '#38BDF8',
  primaryLight: '#0E3A52',
  success: '#34D399',
  successLight: '#083B2C',
  warning: '#FBBF24',
  warningLight: '#452205',
  danger: '#F87171',
  dangerLight: '#451214',
  blue: '#60A5FA',
  blueLight: '#172C5A',
  purple: '#A78BFA',
  purpleLight: '#32195E',
};

export const getShadow = (isDark) =>
  Platform.select({
    ios: {
      shadowColor: isDark ? '#000000' : '#101828',
      shadowOpacity: isDark ? 0.35 : 0.07,
      shadowRadius: isDark ? 8 : 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: isDark ? 3 : 2 },
  });
