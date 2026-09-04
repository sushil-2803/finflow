import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard, MoreHorizontal, PiggyBank } from 'lucide-react-native';
import { useTheme } from '../../store/ThemeContext';
import { money, shortDate } from '../../utils/formatters';

export default function ExpenseRow({ expense, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
        <CreditCard size={18} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
          {expense.title}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.muted }]}>
          {expense.seller || expense.category || 'Uncategorized'} • {shortDate(expense.expenseDate)}
        </Text>
        <View style={styles.tags}>
          {expense.isSpentFromSavings && (
            <View style={styles.tag}>
              <PiggyBank size={11} color={colors.success} />
              <Text style={[styles.tagText, { color: colors.success }]}>Savings</Text>
            </View>
          )}
          {expense.budgetId?.title && (
            <Text style={[styles.smallTag, { color: colors.muted }]} numberOfLines={1}>
              {expense.budgetId.title}
            </Text>
          )}
          {expense.groupId?.title && (
            <Text style={[styles.smallTag, { color: colors.muted }]} numberOfLines={1}>
              {expense.groupId.title}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: colors.text }]}>{money(expense.amount)}</Text>
        <Text style={[styles.method, { color: colors.muted }]}>{expense.paymentMethod}</Text>
        <MoreHorizontal size={18} color={colors.muted} style={styles.more} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    height: 38,
    width: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    marginTop: 3,
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  smallTag: {
    maxWidth: 86,
    fontSize: 11,
  },
  amountWrap: {
    alignItems: 'flex-end',
    maxWidth: 98,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  method: {
    fontSize: 11,
    marginTop: 3,
  },
  more: {
    position: 'absolute',
    right: -6,
    bottom: -4,
  },
});
