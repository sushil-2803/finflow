import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingState from '../components/common/LoadingState';

export default function RootNavigator() {
  const { isRestoring, isAuthenticated } = useAuth();
  const { navigationTheme } = useTheme();

  if (isRestoring) {
    return <LoadingState label="Restoring your FinFlow session..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
