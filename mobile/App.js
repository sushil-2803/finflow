import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/AuthContext';
import { ThemeProvider, useTheme } from './src/store/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ExpenseSheetProvider } from './src/store/ExpenseSheetContext';
import { queryClient } from './src/api/queryClient';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ExpenseSheetProvider>
                <AppContent />
              </ExpenseSheetProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
