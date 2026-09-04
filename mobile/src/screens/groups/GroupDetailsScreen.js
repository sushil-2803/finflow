import React, { useLayoutEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react-native';
import { deleteGroup, getGroup, updateGroup } from '../../api/groups';
import { deleteExpense } from '../../api/expenses';
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

export default function GroupDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const { openExpenseSheet } = useExpenseSheet();
  const { colors, shadow } = useTheme();

  const groupQuery = useQuery({ queryKey: ['group', id], queryFn: () => getGroup(id) });
  const update = useMutation({ mutationFn: ({ status }) => updateGroup(id, { status }) });

  const removeGroup = () =>
    Alert.alert(
      'Delete group?',
      'Linked expenses will remain in your history, but will be unlinked from this group.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete group',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(id);
              await queryClient.invalidateQueries({ queryKey: ['groups'] });
              await queryClient.invalidateQueries({ queryKey: ['expenses'] });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Could not delete group', userMessage(error));
            }
          },
        },
      ],
    );

  useLayoutEffect(() =>
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={removeGroup}>
          <Trash2 color={colors.danger} size={20} />
        </Pressable>
      ),
    }),
  );

  if (groupQuery.isLoading) return <LoadingState />;
  const data = groupQuery.data;
  if (!data) return <AppScreen><EmptyState title="Group unavailable" /></AppScreen>;

  const { group, expenses } = data;
  const pct = group.isBudgetEnabled && group.budgetLimit ? progress(group.totalSpent, group.budgetLimit) : 0;
  const completed = group.status !== 'active';

  const removeExpense = (item) =>
    Alert.alert('Delete expense?', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(item._id);
            queryClient.invalidateQueries({ queryKey: ['group', id] });
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
          } catch (error) {
            Alert.alert('Could not delete expense', userMessage(error));
          }
        },
      },
    ]);

  return (
    <AppScreen>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border, ...shadow }]}>
              <Text style={[styles.status, { color: colors.purple }]}>{group.status}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{group.title}</Text>
              {group.description ? <Text style={[styles.description, { color: colors.muted }]}>{group.description}</Text> : null}
              <Text style={[styles.dates, { color: colors.muted }]}>
                {shortDate(group.startDate)} {group.endDate ? `- ${shortDate(group.endDate)}` : ''}
              </Text>
              {group.isBudgetEnabled && group.budgetLimit ? (
                <>
                  <View style={styles.amounts}>
                    <View>
                      <Text style={[styles.caption, { color: colors.muted }]}>Spent</Text>
                      <Text style={[styles.amount, { color: colors.text }]}>{money(group.totalSpent)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.caption, { color: colors.muted }]}>Remaining</Text>
                      <Text style={[styles.amount, { color: colors.text }]}>{money(group.budgetLimit - group.totalSpent)}</Text>
                    </View>
                  </View>
                  <ProgressBar value={pct} color={progressColor(pct)} />
                  <Text style={[styles.percent, { color: progressColor(pct) }]}>{pct.toFixed(0)}% of {money(group.budgetLimit)}</Text>
                </>
              ) : (
                <Text style={[styles.noLimit, { color: colors.text }]}>{money(group.totalSpent)} spent • No budget limit</Text>
              )}
              {!completed ? (
                <View style={styles.buttons}>
                  <PrimaryButton
                    title="Record expense"
                    icon={Plus}
                    onPress={() => openExpenseSheet({ defaults: { groupId: id } })}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    title="Close group"
                    tone="secondary"
                    onPress={() =>
                      Alert.alert('Close group?', 'Completed groups cannot receive new expenses.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Close',
                          onPress: async () => {
                            try {
                              await update.mutateAsync({ status: 'completed' });
                              queryClient.invalidateQueries({ queryKey: ['group', id] });
                              queryClient.invalidateQueries({ queryKey: ['groups'] });
                            } catch (error) {
                              Alert.alert('Could not close group', userMessage(error));
                            }
                          },
                        },
                      ])
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <Text style={[styles.closed, { backgroundColor: colors.warningLight, color: colors.warning }]}>
                  This group is {group.status}; new expenses are disabled.
                </Text>
              )}
            </View>
            <Text style={[styles.section, { color: colors.muted }]}>TRANSACTION LEDGER</Text>
          </>
        }
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            onPress={() =>
              Alert.alert(item.title, `${money(item.amount)} • ${item.paymentMethod}`, [
                { text: 'Edit', onPress: () => openExpenseSheet({ expense: item }) },
                { text: 'Delete', style: 'destructive', onPress: () => removeExpense(item) },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          />
        )}
        ListEmptyComponent={<EmptyState title="No group expenses yet" detail="Record a purchase to start this group ledger." />}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  hero: { borderRadius: 8, borderWidth: 1, padding: 18, gap: 12 },
  status: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: 23, fontWeight: '800', marginTop: -5 },
  description: { fontSize: 14, lineHeight: 20 },
  dates: { fontSize: 12 },
  amounts: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { fontSize: 12 },
  amount: { fontSize: 19, fontWeight: '800', marginTop: 3 },
  percent: { fontWeight: '700', fontSize: 12, marginTop: -5 },
  noLimit: { fontSize: 15, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 9, marginTop: 3 },
  closed: { borderRadius: 8, padding: 12, fontSize: 13, fontWeight: '700' },
  section: { fontSize: 11, letterSpacing: 0.8, fontWeight: '800', marginTop: 8 },
});
