import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQueries } from '@tanstack/react-query';
import {
  Check,
  Copy,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  UserRound,
} from 'lucide-react-native';
import { getBudgets } from '../../api/budgets';
import { getGroups } from '../../api/groups';
import { getExpenses } from '../../api/expenses';
import AppScreen from '../../components/common/AppScreen';
import LoadingState from '../../components/common/LoadingState';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, shadow, themeMode, setThemeMode } = useTheme();

  const [budgets, groups, expenses] = useQueries({
    queries: [
      { queryKey: ['budgets'], queryFn: getBudgets },
      { queryKey: ['groups'], queryFn: getGroups },
      { queryKey: ['expenses', 'profile'], queryFn: () => getExpenses({ limit: 1 }) },
    ],
  });

  if (!user) return <LoadingState />;

  const copy = async () => {
    await Clipboard.setStringAsync(user.id);
    Alert.alert('Copied', 'Account ID copied to the clipboard.');
  };

  const logout = () =>
    Alert.alert('Log out?', 'You will need to sign in with Google again to access FinFlow.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  const themeOptions = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.page}>
        {/* Profile Card */}
        <View
          style={[
            styles.profile,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            shadow,
          ]}
        >
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.fallback, { backgroundColor: colors.primaryLight }]}>
              <UserRound color={colors.primary} size={34} />
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          <View style={styles.email}>
            <Mail size={15} color={colors.muted} />
            <Text style={[styles.emailText, { color: colors.muted }]}>{user.email}</Text>
          </View>
          <View style={styles.badges}>
            <Badge icon={ShieldCheck} text="Authorized account" tone="primary" />
            <Badge icon={KeyRound} text="Google identity" tone="success" />
          </View>
        </View>

        {/* Appearance / Theme Selector */}
        <Text style={[styles.section, { color: colors.muted }]}>APPEARANCE / THEME</Text>
        <View
          style={[
            styles.themeContainer,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            shadow,
          ]}
        >
          <Text style={[styles.themeSubtitle, { color: colors.muted }]}>
            Choose your preferred color theme. Your choice is saved automatically.
          </Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setThemeMode(opt.mode)}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surfaceMuted,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Icon size={18} color={isSelected ? colors.primary : colors.muted} />
                  <Text
                    style={[
                      styles.themeButtonText,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={14} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Statistics */}
        <Text style={[styles.section, { color: colors.muted }]}>STATISTICS</Text>
        <View
          style={[
            styles.stats,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            shadow,
          ]}
        >
          <Stat value={budgets.data?.length} label="Total budgets" />
          <Stat value={groups.data?.length} label="Expense groups" />
          <Stat value={expenses.data?.pagination?.total} label="Expenses" />
        </View>

        {/* System Information */}
        <Text style={[styles.section, { color: colors.muted }]}>SYSTEM INFORMATION</Text>
        <View
          style={[
            styles.system,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            shadow,
          ]}
        >
          <System label="Account ID" value={user.id} action={copy} />
          <System label="Authentication" value="Google identity token" />
          <System label="Default currency" value="INR ₹" />
        </View>

        <PrimaryButton
          title="Log out"
          tone="danger"
          icon={LogOut}
          onPress={logout}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </AppScreen>
  );
}

function Badge({ icon: Icon, text, tone }) {
  const { colors } = useTheme();
  const map =
    tone === 'success'
      ? [colors.successLight, colors.success]
      : [colors.primaryLight, colors.primary];

  return (
    <View style={[styles.badge, { backgroundColor: map[0] }]}>
      <Icon size={14} color={map[1]} />
      <Text style={[styles.badgeText, { color: map[1] }]}>{text}</Text>
    </View>
  );
}

function Stat({ value, label }) {
  const { colors } = useTheme();

  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {Number.isFinite(value) ? value : '—'}
      </Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function System({ label, value, action }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.systemRow, { borderBottomColor: colors.border }]}>
      <View>
        <Text style={[styles.systemLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.systemValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {action && (
        <Pressable
          onPress={action}
          style={[styles.copy, { backgroundColor: colors.primaryLight }]}
        >
          <Copy size={17} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 80,
    gap: 12,
  },
  profile: {
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 9,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  fallback: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 21,
    fontWeight: '800',
    marginTop: 4,
  },
  email: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  emailText: {
    fontSize: 13,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
  },
  badge: {
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  section: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '800',
    marginTop: 12,
  },
  themeContainer: {
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  themeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 13,
  },
  stats: {
    flexDirection: 'row',
    borderRadius: 8,
  },
  stat: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 21,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  system: {
    borderRadius: 8,
  },
  systemRow: {
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  systemLabel: {
    fontSize: 12,
  },
  systemValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
    maxWidth: 260,
  },
  copy: {
    height: 38,
    width: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
