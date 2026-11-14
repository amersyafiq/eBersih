import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SoftBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export function SoftBackground({ children, className, style, ...props }: SoftBackgroundProps) {
  return (
    <View
      className={`flex-1 ${className ?? ''}`}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      <LinearGradient
        colors={['#5750f1', '#EDEFFE', '#FFFFFF']}
        locations={[0, 0.5, 1]}
        start={{ x: -1.5, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
