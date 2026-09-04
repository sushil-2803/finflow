import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FolderKanban } from 'lucide-react-native';
import { useTheme } from '../../store/ThemeContext';
import { money, progress, progressColor, shortDate } from '../../utils/formatters';
import ProgressBar from '../common/ProgressBar';

export default function GroupCard({ group, onPress }) {
  const { colors, shadow } = useTheme();
  const pct =
    group.isBudgetEnabled && group.budgetLimit ? progress(group.totalSpent, group.budgetLimit) : 0;
  const color = progressColor(pct);
  const remaining = group.budgetLimit - group.totalSpent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
        shadow,
        pressed && { opacity: 0.78 },
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.purpleLight }]}>
          <FolderKanban color={colors.purple} size={19} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {group.title}
          </Text>
          <Text style={[styles.status, { color: colors.purple }]}>{group.status}</Text>
        </View>
      </View>
      {group.description ? (
        <Text numberOfLines={2} style={[styles.description, { color: colors.muted }]}>
          {group.description}
        </Text>
      ) : null}
      <Text style={[styles.dates, { color: colors.muted }]}>
        {shortDate(group.startDate)} {group.endDate ? `- ${shortDate(group.endDate)}` : ''}
      </Text>
      <View style={styles.amountRow}>
        <Text style={[styles.spent, { color: colors.text }]}>{money(group.totalSpent)} spent</Text>
        {group.isBudgetEnabled && group.budgetLimit ? (
          <Text style={[styles.remaining, { color: colors.muted }]}>{money(remaining)} left</Text>
        ) : (
          <Text style={[styles.remaining, { color: colors.muted }]}>No limit</Text>
        )}
      </View>
      {group.isBudgetEnabled && group.budgetLimit ? (
        <>
          <ProgressBar value={pct} color={color} />
          <Text style={[styles.pct, { color }]}>
            {pct.toFixed(0)}% of {money(group.budgetLimit)}
          </Text>
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 10,
    borderRadius: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    textTransform: 'capitalize',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  dates: {
    fontSize: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spent: {
    fontSize: 14,
    fontWeight: '700',
  },
  remaining: {
    fontSize: 13,
  },
  pct: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -3,
  },
});
