import React, { useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react-native';
import { closeBudget, deleteBudget, getBudget } from '../../api/budgets';
import { deleteExpense, getExpenses } from '../../api/expenses';
import AppScreen from '../../components/common/AppScreen';
import EmptyState from '../../components/common/EmptyState';
import ExpenseRow from '../../components/expenses/ExpenseRow';
import LoadingState from '../../components/common/LoadingState';
import PrimaryButton from '../../components/common/PrimaryButton';
import ProgressBar from '../../components/common/ProgressBar';
import { useExpenseSheet } from '../../store/ExpenseSheetContext';
import { useTheme } from '../../store/ThemeContext';
import { money, progress, progressColor, shortDate } from '../../utils/formatters';
import { userMessage } from '../../utils/errors';

export default function BudgetDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const { openExpenseSheet } = useExpenseSheet();
  const { colors, shadow } = useTheme();
  const [category, setCategory] = useState('');

  const budgetQuery = useQuery({ queryKey: ['budget', id], queryFn: () => getBudget(id) });
  const expenses = useInfiniteQuery({
    queryKey: ['expenses', 'budget', id, category],
    queryFn: ({ pageParam = 1 }) => getExpenses({ page: pageParam, limit: 15, budgetId: id, category: category || undefined }),
    getNextPageParam: (last) => last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
  const close = useMutation({ mutationFn: closeBudget });

  const budget = budgetQuery.data;
  const items = expenses.data?.pages.flatMap((page) => page.data) || [];
  const totals = expenses.data?.pages[0]?.categoryTotals || [];

  const remove = (expense) =>
    Alert.alert('Delete expense?', `Delete "${expense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(expense._id);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['expenses'] }),
              queryClient.invalidateQueries({ queryKey: ['budget', id] }),
              queryClient.invalidateQueries({ queryKey: ['budgets'] }),
              queryClient.invalidateQueries({ queryKey: ['savings'] }),
            ]);
          } catch (error) {
            Alert.alert('Could not delete expense', userMessage(error));
          }
        },
      },
    ]);

  const closeBudgetConfirm = () =>
    Alert.alert(
      'Close & save budget?',
      'Positive remaining funds will be transferred to Overall Savings and this budget will lock.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close & Save',
          onPress: async () => {
            try {
              await close.mutateAsync(id);
              await queryClient.invalidateQueries({ queryKey: ['budget', id] });
              await queryClient.invalidateQueries({ queryKey: ['budgets'] });
              await queryClient.invalidateQueries({ queryKey: ['savings'] });
            } catch (error) {
              Alert.alert('Could not close budget', userMessage(error));
            }
          },
        },
      ],
    );

  const removeBudget = () =>
    Alert.alert(
      'Delete budget?',
      'The current backend deletes expenses linked to a budget. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete budget',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(id);
              await queryClient.invalidateQueries({ queryKey: ['budgets'] });
              await queryClient.invalidateQueries({ queryKey: ['expenses'] });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Could not delete budget', userMessage(error));
            }
          },
        },
      ],
    );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={removeBudget} hitSlop={10}>
          <Trash2 size={20} color={colors.danger} />
        </Pressable>
      ),
    });
  });

  if (budgetQuery.isLoading) return <LoadingState />;
  if (budgetQuery.isError || !budget)
    return (
      <AppScreen>
        <EmptyState title="Budget unavailable" detail="It may have been deleted or you no longer have access." />
      </AppScreen>
    );

  const pct = progress(budget.totalExpenses, budget.budgetAmount);

  return (
    <AppScreen>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={budgetQuery.isRefetching || expenses.isRefetching}
            onRefresh={() => { budgetQuery.refetch(); expenses.refetch(); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={[styles.overview, { backgroundColor: colors.surface, borderColor: colors.border, ...shadow }]}>
              <Text style={[styles.period, { color: colors.muted }]}>{shortDate(budget.startDate)} - {shortDate(budget.endDate)}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{budget.title}</Text>
              <View style={styles.amounts}>
                <View>
                  <Text style={[styles.caption, { color: colors.muted }]}>Budget limit</Text>
                  <Text style={[styles.big, { color: colors.text }]}>{money(budget.budgetAmount)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.caption, { color: colors.muted }]}>Remaining</Text>
                  <Text style={[styles.big, { color: budget.remainingAmount >= 0 ? colors.success : colors.danger }]}>
                    {money(budget.remainingAmount)}
                  </Text>
                </View>
              </View>
              <ProgressBar value={pct} color={progressColor(pct)} />
              <Text style={[styles.used, { color: progressColor(pct) }]}>{pct.toFixed(0)}% used • {money(budget.totalExpenses)} spent</Text>
              {budget.isClosed ? (
                <View style={[styles.locked, { backgroundColor: colors.warningLight }]}>
                  <Text style={[styles.lockedText, { color: colors.warning }]}>This budget is closed and locked.</Text>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <PrimaryButton title="Record expense" icon={Plus} onPress={() => openExpenseSheet({ defaults: { budgetId: id } })} style={{ flex: 1 }} />
                  <PrimaryButton title="Close & save" tone="secondary" onPress={closeBudgetConfirm} style={{ flex: 1 }} />
                </View>
              )}
            </View>
            <Text style={[styles.section, { color: colors.muted }]}>CATEGORY TOTALS</Text>
            {totals.length ? (
              <View style={styles.totals}>
                {totals.map((item) => (
                  <Pressable
                    key={item.category}
                    onPress={() => setCategory(category === item.category ? '' : item.category)}
                    style={[
                      styles.totalItem,
                      { backgroundColor: colors.surfaceMuted },
                      category === item.category && { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.totalName, { color: colors.muted }]}>{item.category}</Text>
                    <Text style={[styles.totalAmount, { color: colors.text }]}>{money(item.total)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text style={[styles.section, { color: colors.muted }]}>TRANSACTIONS</Text>
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
        ListEmptyComponent={!expenses.isLoading && <EmptyState title="No expenses in this budget" detail="Record an expense to keep this month up to date." />}
        ListFooterComponent={
          expenses.hasNextPage
            ? <PrimaryButton title="Load more" onPress={expenses.fetchNextPage} loading={expenses.isFetchingNextPage} tone="secondary" />
            : <View style={{ height: 30 }} />
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  overview: { padding: 18, borderRadius: 8, borderWidth: 1, gap: 14 },
  period: { fontSize: 12 },
  title: { fontSize: 22, fontWeight: '800', marginTop: -7 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { fontSize: 12 },
  big: { fontSize: 19, fontWeight: '800', marginTop: 4 },
  used: { fontSize: 12, fontWeight: '700', marginTop: -6 },
  buttonRow: { flexDirection: 'row', gap: 9, marginTop: 4 },
  locked: { borderRadius: 8, padding: 12 },
  lockedText: { fontSize: 13, fontWeight: '700' },
  section: { fontSize: 11, letterSpacing: 0.8, fontWeight: '800', marginTop: 10 },
  totals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  totalItem: { padding: 10, borderRadius: 8, minWidth: '30%' },
  totalName: { fontSize: 11 },
  totalAmount: { fontWeight: '700', fontSize: 13, marginTop: 2 },
});
