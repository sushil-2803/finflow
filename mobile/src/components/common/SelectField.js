import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../store/ThemeContext';

export default function SelectField({ label, value, placeholder = 'Select', onPress, disabled, error }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.field,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
          },
          error && styles.error,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.value,
            { color: value ? colors.text : colors.muted },
          ]}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  field: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 15,
    flex: 1,
  },
  error: {},
  errorText: {
    fontSize: 12,
  },
});
