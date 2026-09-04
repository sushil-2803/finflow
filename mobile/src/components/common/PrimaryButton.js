import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  icon: Icon,
  tone = 'primary',
  style,
}) {
  const { colors } = useTheme();

  const palette =
    tone === 'danger'
      ? { bg: colors.danger, text: '#ffffff' }
      : tone === 'secondary'
      ? { bg: colors.surfaceMuted, text: colors.text }
      : { bg: colors.primary, text: '#ffffff' };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, opacity: pressed || disabled ? 0.72 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.row}>
          {Icon && <Icon color={palette.text} size={18} strokeWidth={2.2} />}
          <Text style={[styles.label, { color: palette.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});
