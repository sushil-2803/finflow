import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

export default function ProgressBar({ value, color }) {
  const { colors } = useTheme();
  const fillColor = color || colors.primary;

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.max(0, Math.min(100, value || 0))}%`, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
