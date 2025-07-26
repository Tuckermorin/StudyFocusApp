// src/components/FloatingActionButton.js
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  label = null,
  size = 'normal', // 'normal' | 'small' | 'large'
  position = 'bottom-right', // 'bottom-right' | 'bottom-left' | 'bottom-center'
  style = {},
  disabled = false,
}) {
  const { theme } = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      width: 40,
      height: 40,
      iconSize: 20,
      fontSize: 12,
    },
    normal: {
      width: 56,
      height: 56,
      iconSize: 24,
      fontSize: 14,
    },
    large: {
      width: 64,
      height: 64,
      iconSize: 28,
      fontSize: 16,
    },
  };

  // Position configurations
  const positionConfig = {
    'bottom-right': {
      position: 'absolute',
      bottom: 16,
      right: 16,
    },
    'bottom-left': {
      position: 'absolute',
      bottom: 16,
      left: 16,
    },
    'bottom-center': {
      position: 'absolute',
      bottom: 16,
      alignSelf: 'center',
    },
  };

  const currentSize = sizeConfig[size];
  const currentPosition = positionConfig[position];

  return (
    <View style={[currentPosition, style]}>
      {/* Extended FAB with label */}
      {label && (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
              borderRadius: 28,
              paddingHorizontal: 16,
              paddingVertical: 12,
              minHeight: currentSize.height,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              opacity: pressed ? 0.8 : 1,
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={currentSize.iconSize}
            color={disabled ? theme.colors.textTertiary : '#FFFFFF'}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: disabled ? theme.colors.textTertiary : '#FFFFFF',
              fontSize: currentSize.fontSize,
              fontWeight: '600',
            }}
          >
            {label}
          </Text>
        </Pressable>
      )}

      {/* Regular circular FAB */}
      {!label && (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            {
              width: currentSize.width,
              height: currentSize.height,
              borderRadius: currentSize.width / 2,
              backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              opacity: pressed ? 0.8 : 1,
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={currentSize.iconSize}
            color={disabled ? theme.colors.textTertiary : '#FFFFFF'}
          />
        </Pressable>
      )}
    </View>
  );
}