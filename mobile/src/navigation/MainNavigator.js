import React from 'react';
import { Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, WalletCards, FolderKanban, PiggyBank, UserRound, Plus } from 'lucide-react-native';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MonthlyBudgetScreen from '../screens/budgets/MonthlyBudgetScreen';
import BudgetDetailsScreen from '../screens/budgets/BudgetDetailsScreen';
import ExpenseGroupsScreen from '../screens/groups/ExpenseGroupsScreen';
import GroupDetailsScreen from '../screens/groups/GroupDetailsScreen';
import SavingsScreen from '../screens/savings/SavingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useTheme } from '../store/ThemeContext';
import { useExpenseSheet } from '../store/ExpenseSheetContext';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icons = {
  Home,
  Budgets: WalletCards,
  Groups: FolderKanban,
  Savings: PiggyBank,
  Profile: UserRound,
};

function TabNavigator() {
  const { colors } = useTheme();
  const { openExpenseSheet } = useExpenseSheet();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const Icon = icons[route.name];
          return <Icon color={color} size={size} strokeWidth={2.2} />;
        },
        headerRight: () => (
          <Pressable onPress={() => openExpenseSheet()} style={{ marginRight: 16 }}>
            <Plus color={colors.primary} size={23} />
          </Pressable>
        ),
      })}
    >
      <Tabs.Screen name="Home" component={DashboardScreen} />
      <Tabs.Screen name="Budgets" component={MonthlyBudgetScreen} />
      <Tabs.Screen name="Groups" component={ExpenseGroupsScreen} />
      <Tabs.Screen name="Savings" component={SavingsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function MainNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="BudgetDetails"
        component={BudgetDetailsScreen}
        options={{ title: 'Budget details' }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={{ title: 'Group details' }}
      />
    </Stack.Navigator>
  );
}
