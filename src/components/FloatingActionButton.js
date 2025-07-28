// src/components/FloatingActionButton.js
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  label = null,
  size = 'normal', // 'small' | 'normal' | 'large'
  position = 'bottom-right', // 'bottom-right' | 'bottom-left' | 'bottom-center'
  style = {},
  disabled = false,
  color = null, // Custom color override
}) {
  const { theme } = useTheme();

  // Size configurations following Material Design FAB specs
  const sizeConfig = {
    small: {
      width: 40,
      height: 40,
      iconSize: 18,
      fontSize: 12,
      elevation: 6,
    },
    normal: {
      width: 56,
      height: 56,
      iconSize: 24,
      fontSize: 14,
      elevation: 6,
    },
    large: {
      width: 96, // Extended FAB width for label
      height: 56,
      iconSize: 24,
      fontSize: 14,
      elevation: 6,
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
      left: 0,
      right: 0,
      alignItems: 'center',
    },
  };

  const currentSize = sizeConfig[size];
  const currentPosition = positionConfig[position];
  const fabColor = color || theme.colors.primary;

  // Material Design FAB elevation shadow
  const fabShadow = {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: currentSize.elevation / 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: currentSize.elevation * 0.8,
    elevation: currentSize.elevation,
  };

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
              justifyContent: 'center',
              backgroundColor: disabled ? theme.colors.border : fabColor,
              borderRadius: 28,
              paddingHorizontal: 16,
              paddingVertical: 16,
              minHeight: currentSize.height,
              minWidth: currentSize.width,
              ...fabShadow,
              opacity: pressed ? 0.9 : 1,
              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={currentSize.iconSize}
            color={disabled ? theme.colors.textTertiary : '#FFFFFF'}
            style={label ? { marginRight: 8 } : {}}
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
              backgroundColor: disabled ? theme.colors.border : fabColor,
              alignItems: 'center',
              justifyContent: 'center',
              ...fabShadow,
              opacity: pressed ? 0.9 : 1,
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