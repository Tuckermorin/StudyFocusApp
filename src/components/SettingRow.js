// src/components/SettingRow.js
import React, { memo } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function SettingRow({
  title,
  subtitle,
  onPress,
  rightComponent,
  icon,
  switchValue,
  onSwitchChange,
  disabled = false,
}) {
  const { theme, globalStyles } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={24}
          color={theme.colors.primary}
          style={{ marginRight: 12 }}
        />
      )}

      <Pressable
        onPress={onPress}
        disabled={disabled || switchValue !== undefined}
        style={{ flex: 1 }}
      >
        <Text style={[globalStyles.text, { fontWeight: '500' }]}>{title}</Text>
        {subtitle && (
          <Text style={[globalStyles.textSecondary, { marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </Pressable>

      {switchValue !== undefined ? (
        <Switch
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={theme.colors.card}
          ios_backgroundColor="#767577"
          onValueChange={onSwitchChange}
          value={switchValue}
        />
      ) : (
        rightComponent || (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textTertiary}
          />
        )
      )}
    </View>
  );
}

export default memo(SettingRow);
