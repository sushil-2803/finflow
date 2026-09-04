import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';
import { money } from '../../utils/formatters';

const palette = ['#176B87', '#147A5B', '#B54708', '#175CD3', '#6941C6', '#C11574', '#667085'];

export default function PaymentDonut({ expenses = [] }) {
  const { colors } = useTheme();

  const entries = useMemo(
    () =>
      Object.entries(
        expenses.reduce(
          (acc, item) => ({
            ...acc,
            [item.paymentMethod]: (acc[item.paymentMethod] || 0) + Number(item.amount),
          }),
          {}
        )
      ).map(([name, amount], index) => ({
        name,
        amount,
        color: palette[index % palette.length],
        legendFontColor: colors.muted,
        legendFontSize: 11,
      })),
    [expenses, colors.muted]
  );

  const total = entries.reduce((sum, item) => sum + item.amount, 0);

  if (!entries.length) {
    return (
      <Text style={[styles.empty, { color: colors.muted }]}>
        Payment insights appear after you record expenses.
      </Text>
    );
  }

  return (
    <View>
      <View style={styles.chart}>
        <PieChart
          data={entries}
          width={Dimensions.get('window').width - 48}
          height={185}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="12"
          hasLegend={false}
          chartConfig={{
            color: () => colors.primary,
          }}
        />
      </View>
      <Text style={[styles.total, { color: colors.text }]}>{money(total)} total</Text>
      <View style={styles.legend}>
        {entries.map((item) => (
          <View key={item.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendName, { color: colors.muted }]}>{item.name}</Text>
            <Text style={[styles.legendAmount, { color: colors.text }]}>
              {((item.amount / total) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    alignItems: 'center',
    marginTop: -6,
  },
  total: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    marginTop: -24,
    marginBottom: 14,
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },
  legendName: {
    fontSize: 13,
    flex: 1,
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 34,
    fontSize: 14,
  },
});
