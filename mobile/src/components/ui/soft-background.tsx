import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCSSVariable } from 'uniwind';

interface SoftBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export function SoftBackground({ children, className, style, ...props }: SoftBackgroundProps) {
  const [primary, foreground, background] = useCSSVariable([
    '--color-primary',
    '--color-primary-foreground',
    '--color-card',
  ]) as (string)[];

  return (
    <View
      className={`flex-1 bg-background ${className ?? ''}`}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      <LinearGradient
        colors={[primary, background]}
        locations={[0, 0.8]}
        start={{ x: -1.8, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.1 }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
