import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  FolderKanban,
  Moon,
  Plus,
  Search,
  Sun,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import AppScreen from '../../components/common/AppScreen';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import PrimaryButton from '../../components/common/PrimaryButton';
import ProgressBar from '../../components/common/ProgressBar';
import ExpenseRow from '../../components/expenses/ExpenseRow';
import GroupCard from '../../components/cards/GroupCard';
import PaymentDonut from '../../components/charts/PaymentDonut';
import { getBudgets } from '../../api/budgets';
import { getGroups } from '../../api/groups';
import { getExpenses, deleteExpense } from '../../api/expenses';
import { getCategories } from '../../api/categories';
import { useAuth } from '../../store/AuthContext';
import { useExpenseSheet } from '../../store/ExpenseSheetContext';
import { useTheme } from '../../store/ThemeContext';
import { money, progress, progressColor } from '../../utils/formatters';
import { userMessage } from '../../utils/errors';

export default function DashboardScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const { openExpenseSheet } = useExpenseSheet();
  const { colors, shadow, isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const budgets = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
  const groups = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const expenses = useInfiniteQuery({
    queryKey: ['expenses', 'dashboard', search, category],
    queryFn: ({ pageParam = 1 }) =>
      getExpenses({
        page: pageParam,
        limit: 12,
        search,
        category: category || undefined,
      }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const flatExpenses = expenses.data?.pages.flatMap((page) => page.data) || [];
  const today = new Date();
  const activeBudget =
    (budgets.data || []).find(
      (item) =>
        item.month === today.getMonth() + 1 && item.year === today.getFullYear() && !item.isClosed
    ) || (budgets.data || []).find((item) => !item.isClosed);
  const activeGroups = (groups.data || []).filter((item) => item.status === 'active');
  const used = activeBudget ? progress(activeBudget.totalExpenses, activeBudget.budgetAmount) : 0;

  const refresh = async () => {
    await Promise.all([budgets.refetch(), groups.refetch(), expenses.refetch(), refreshUser()]);
  };

  const remove = (expense) =>
    Alert.alert(
      'Delete expense?',
      `Delete “${expense.title}”? Savings-funded expenses will be refunded by the server.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense._id);
              await queryClient.invalidateQueries({ queryKey: ['expenses'] });
              await queryClient.invalidateQueries({ queryKey: ['budgets'] });
              await queryClient.invalidateQueries({ queryKey: ['groups'] });
              await queryClient.invalidateQueries({ queryKey: ['savings'] });
              await refreshUser();
            } catch (error) {
              Alert.alert('Could not delete expense', userMessage(error));
            }
          },
        },
      ]
    );

  if (budgets.isLoading || groups.isLoading) return <LoadingState />;

  return (
    <AppScreen edges={['top']}>
      <FlatList
        data={flatExpenses}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={budgets.isRefetching || expenses.isRefetching}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.greeting}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>FINFLOW</Text>
                <Text style={[styles.headline, { color: colors.text }]}>
                  Hello, {user?.name?.split(' ')[0] || 'there'}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <Pressable
                  onPress={toggleTheme}
                  style={[styles.themeToggle, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
                  accessibilityLabel="Toggle Dark Mode"
                  hitSlop={6}
                >
                  {isDark ? <Sun size={20} color={colors.warning} /> : <Moon size={20} color={colors.primary} />}
                </Pressable>
                <Pressable
                  onPress={() => openExpenseSheet()}
                  style={[styles.quickAdd, { backgroundColor: colors.primary }, shadow]}
                >
                  <Plus size={22} color="#ffffff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <Summary
                label="Overall savings"
                value={money(user?.overallSavings)}
                icon={TrendingUp}
                tone="success"
              />
              <Summary
                label="Month remaining"
                value={money(activeBudget?.remainingAmount)}
                icon={Wallet}
                tone="primary"
              />
              <Summary
                label="Active groups"
                value={String(activeGroups.length)}
                icon={FolderKanban}
                tone="purple"
              />
            </View>

            <Section
              title="Current month"
              action={activeBudget ? 'View budget' : 'Go to budgets'}
              onAction={() =>
                activeBudget
                  ? navigation.navigate('BudgetDetails', { id: activeBudget._id })
                  : navigation.navigate('Budgets')
              }
            >
              {activeBudget ? (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                    shadow,
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {activeBudget.title}
                      </Text>
                      <Text style={[styles.cardMeta, { color: colors.muted }]}>
                        {money(activeBudget.budgetAmount)} budget
                      </Text>
                    </View>
                    <Text style={[styles.percent, { color: progressColor(used) }]}>
                      {used.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.moneyRow}>
                    <View>
                      <Text style={[styles.caption, { color: colors.muted }]}>Spent</Text>
                      <Text style={[styles.amount, { color: colors.text }]}>
                        {money(activeBudget.totalExpenses)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.caption, { color: colors.muted }]}>Remaining</Text>
                      <Text
                        style={[
                          styles.amount,
                          {
                            color:
                              activeBudget.remainingAmount >= 0 ? colors.success : colors.danger,
                          },
                        ]}
                      >
                        {money(activeBudget.remainingAmount)}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar value={used} color={progressColor(used)} />
                  <PrimaryButton
                    title="Add expense"
                    icon={Plus}
                    onPress={() =>
                      openExpenseSheet({ defaults: { budgetId: activeBudget._id } })
                    }
                    style={{ marginTop: 4 }}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                    shadow,
                  ]}
                >
                  <EmptyState
                    title="No active budget"
                    detail="Create a monthly budget to see spending progress here."
                    actionLabel="Create budget"
                    onAction={() => navigation.navigate('Budgets')}
                  />
                </View>
              )}
            </Section>

            <Section title="Payment breakdown">
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  shadow,
                ]}
              >
                <PaymentDonut expenses={flatExpenses} />
              </View>
            </Section>

            <Section
              title="Active groups"
              action={activeGroups.length ? 'See all' : null}
              onAction={() => navigation.navigate('Groups')}
            >
              {activeGroups.length ? (
                <View style={{ gap: 12 }}>
                  {activeGroups.slice(0, 2).map((item) => (
                    <GroupCard
                      key={item._id}
                      group={item}
                      onPress={() => navigation.navigate('GroupDetails', { id: item._id })}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                    shadow,
                  ]}
                >
                  <EmptyState
                    title="No active expense groups"
                    detail="Track a trip, wedding, project, or any special event."
                    actionLabel="Create group"
                    onAction={() => navigation.navigate('Groups')}
                  />
                </View>
              )}
            </Section>

            <Section title="Recent expenses">
              <View
                style={[
                  styles.search,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Search size={18} color={colors.muted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search title or seller"
                  placeholderTextColor={colors.muted}
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>
              {categories.data?.length ? (
                <FlatList
                  horizontal
                  data={['', ...categories.data]}
                  keyExtractor={(item) => item || 'all'}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => setCategory(item)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            category === item ? colors.primary : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: category === item ? '#ffffff' : colors.muted,
                            fontWeight: category === item ? '700' : '600',
                          },
                        ]}
                      >
                        {item || 'All'}
                      </Text>
                    </Pressable>
                  )}
                />
              ) : null}
            </Section>
          </>
        }
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            onPress={() =>
              Alert.alert(item.title, `${money(item.amount)} • ${item.paymentMethod}`, [
                { text: 'Edit', onPress: () => openExpenseSheet({ expense: item }) },
                { text: 'Delete', style: 'destructive', onPress: () => remove(item) },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
        )}
        ListEmptyComponent={
          expenses.isLoading ? (
            <LoadingState label="Loading expenses..." />
          ) : (
            <EmptyState
              title="No expenses found"
              detail="Record an expense to start building your history."
            />
          )
        }
        ListFooterComponent={
          expenses.hasNextPage ? (
            <PrimaryButton
              title={expenses.isFetchingNextPage ? 'Loading...' : 'Load more'}
              onPress={() => expenses.fetchNextPage()}
              loading={expenses.isFetchingNextPage}
              tone="secondary"
              style={{ marginTop: 12 }}
            />
          ) : null
        }
      />
    </AppScreen>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const { colors, shadow } = useTheme();
  const toneMap = {
    success: [colors.successLight, colors.success],
    primary: [colors.primaryLight, colors.primary],
    purple: [colors.purpleLight, colors.purple],
  };

  return (
    <View
      style={[
        styles.summary,
        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        shadow,
      ]}
    >
      <View style={[styles.summaryIcon, { backgroundColor: toneMap[tone][0] }]}>
        <Icon size={18} color={toneMap[tone][1]} />
      </View>
      <Text numberOfLines={1} style={[styles.summaryValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text numberOfLines={1} style={[styles.summaryLabel, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

function Section({ title, action, onAction, children }) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {action && (
          <Pressable onPress={onAction} style={styles.action}>
            <Text style={[styles.actionText, { color: colors.primary }]}>{action}</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 3,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAdd: {
    width: 46,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summary: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minHeight: 112,
  },
  summaryIcon: {
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 11,
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    gap: 10,
    marginTop: 9,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    fontSize: 13,
    marginTop: 3,
  },
  percent: {
    fontSize: 17,
    fontWeight: '800',
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  search: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  chips: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 13,
  },
});
