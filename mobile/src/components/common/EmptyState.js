import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useTheme } from '../../store/ThemeContext';
import PrimaryButton from './PrimaryButton';

export default function EmptyState({ title, detail, actionLabel, onAction, icon: Icon = Inbox }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
        <Icon color={colors.primary} size={26} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {detail && <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text>}
      {actionLabel && <PrimaryButton title={actionLabel} onPress={onAction} style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  icon: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
  },
  detail: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
  },
});
