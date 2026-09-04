import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Lock } from 'lucide-react-native';
import { useTheme } from '../../store/ThemeContext';
import { money, monthName, progress, progressColor, shortDate } from '../../utils/formatters';
import ProgressBar from '../common/ProgressBar';

export default function BudgetCard({ budget, onPress, compact = false }) {
  const { colors, shadow } = useTheme();
  const used = progress(budget.totalExpenses, budget.budgetAmount);
  const color = progressColor(used);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        shadow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
          <CalendarDays size={19} color={colors.primary} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {budget.title}
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {monthName(budget.month)} {budget.year} {budget.isClosed ? '• Closed' : ''}
          </Text>
        </View>
        {budget.isClosed && <Lock size={17} color={colors.muted} />}
      </View>
      {!compact && (
        <Text style={[styles.dates, { color: colors.muted }]}>
          {shortDate(budget.startDate)} - {shortDate(budget.endDate)}
        </Text>
      )}
      <View style={styles.amounts}>
        <View>
          <Text style={[styles.caption, { color: colors.muted }]}>Spent</Text>
          <Text style={[styles.spent, { color: colors.text }]}>{money(budget.totalExpenses)}</Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={[styles.caption, { color: colors.muted }]}>Remaining</Text>
          <Text
            style={[
              styles.remaining,
              { color: budget.remainingAmount >= 0 ? colors.success : colors.danger },
            ]}
          >
            {money(budget.remainingAmount)}
          </Text>
        </View>
      </View>
      <ProgressBar value={used} color={color} />
      <Text style={[styles.percent, { color }]}>
        {used.toFixed(0)}% used of {money(budget.budgetAmount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    gap: 13,
  },
  pressed: {
    opacity: 0.78,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  dates: {
    fontSize: 12,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  caption: {
    fontSize: 12,
  },
  spent: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  remaining: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -5,
  },
});
