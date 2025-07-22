// src/components/MetricCard.js
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function MetricCard({
  title,
  value,
  unit = '',
  subtitle = '',
  icon,
  color = null,
  trend = null, // 'up', 'down', 'stable'
  trendValue = null,
  size = 'medium',
  onPress = null,
  style = {},
  showProgress = false,
  progressValue = 0,
  progressMax = 100,
  layout = 'vertical', // 'vertical', 'horizontal'
}) {
  const { theme, globalStyles } = useTheme();

  // Get trend color
  const getTrendColor = (trendDirection) => {
    switch (trendDirection) {
      case 'up': return theme.colors.success;
      case 'down': return theme.colors.error;
      case 'stable': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  // Get trend icon
  const getTrendIcon = (trendDirection) => {
    switch (trendDirection) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return null;
    }
  };

  // Format value for display
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      } else if (val % 1 === 0) {
        return val.toString();
      } else {
        return val.toFixed(1);
      }
    }
    return val?.toString() || '--';
  };

  // Calculate progress percentage
  const progressPercentage = showProgress ? Math.min((progressValue / progressMax) * 100, 100) : 0;

  // Component styles based on size and layout
  const getStyles = () => {
    const baseStyles = {
      container: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: size === 'large' ? 20 : size === 'medium' ? 16 : 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...globalStyles.card,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: layout === 'vertical' ? 12 : 0,
      },
      iconContainer: {
        width: size === 'large' ? 40 : size === 'medium' ? 36 : 32,
        height: size === 'large' ? 40 : size === 'medium' ? 36 : 32,
        borderRadius: size === 'large' ? 20 : size === 'medium' ? 18 : 16,
        backgroundColor: color ? `${color}20` : `${theme.colors.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      },
      titleText: {
        flex: 1,
        color: theme.colors.textSecondary,
        fontWeight: '500',
      },
      contentContainer: {
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        alignItems: layout === 'horizontal' ? 'center' : 'flex-start',
        flex: 1,
      },
      valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: layout === 'vertical' ? 8 : 0,
        flex: layout === 'horizontal' ? 1 : 0,
      },
      valueText: {
        fontWeight: 'bold',
        color: color || theme.colors.text,
      },
      unitText: {
        color: theme.colors.textSecondary,
        marginLeft: 4,
      },
      subtitleText: {
        color: theme.colors.textSecondary,
        marginBottom: showProgress ? 8 : 0,
      },
      trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: layout === 'horizontal' ? 12 : 0,
        marginTop: layout === 'vertical' ? 4 : 0,
      },
      trendText: {
        marginLeft: 4,
        fontWeight: '500',
      },
      progressContainer: {
        width: '100%',
        height: 6,
        backgroundColor: theme.colors.surface,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 8,
      },
      progressBar: {
        height: '100%',
        backgroundColor: color || theme.colors.primary,
        borderRadius: 3,
      },
      progressText: {
        fontSize: 10,
        color: theme.colors.textTertiary,
        textAlign: 'right',
        marginTop: 4,
      },
    };

    // Size-specific text styles
    if (size === 'large') {
      baseStyles.titleText.fontSize = 16;
      baseStyles.valueText.fontSize = 32;
      baseStyles.unitText.fontSize = 16;
      baseStyles.subtitleText.fontSize = 14;
      baseStyles.trendText.fontSize = 14;
    } else if (size === 'medium') {
      baseStyles.titleText.fontSize = 14;
      baseStyles.valueText.fontSize = 24;
      baseStyles.unitText.fontSize = 14;
      baseStyles.subtitleText.fontSize = 13;
      baseStyles.trendText.fontSize = 13;
    } else {
      baseStyles.titleText.fontSize = 12;
      baseStyles.valueText.fontSize = 18;
      baseStyles.unitText.fontSize = 12;
      baseStyles.subtitleText.fontSize = 11;
      baseStyles.trendText.fontSize = 11;
    }

    return baseStyles;
  };

  const styles = getStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && onPress && { 
          opacity: 0.8, 
          transform: [{ scale: 0.98 }] 
        },
      ]}
      disabled={!onPress}
    >
      {/* Header with Icon and Title */}
      <View style={styles.header}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon} 
              size={size === 'large' ? 20 : size === 'medium' ? 18 : 16} 
              color={color || theme.colors.primary}
            />
          </View>
        )}
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
        
        {/* Quick Trend Indicator in Header */}
        {trend && layout === 'vertical' && (
          <Ionicons 
            name={getTrendIcon(trend)} 
            size={16} 
            color={getTrendColor(trend)}
          />
        )}
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {/* Value Display */}
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {formatValue(value)}
          </Text>
          {unit && (
            <Text style={styles.unitText}>
              {unit}
            </Text>
          )}
        </View>

        {/* Trend Information */}
        {trend && (layout === 'horizontal' || trendValue) && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={getTrendIcon(trend)} 
              size={size === 'large' ? 16 : 14} 
              color={getTrendColor(trend)}
            />
            {trendValue && (
              <Text style={[styles.trendText, { color: getTrendColor(trend) }]}>
                {formatValue(trendValue)}
                {unit && ` ${unit}`}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Subtitle */}
      {subtitle && (
        <Text style={styles.subtitleText} numberOfLines={2}>
          {subtitle}
        </Text>
      )}

      {/* Progress Bar */}
      {showProgress && (
        <View>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {formatValue(progressValue)} / {formatValue(progressMax)} {unit}
          </Text>
        </View>
      )}

      {/* Tap Indicator */}
      {onPress && (
        <View style={{
          position: 'absolute',
          top: 12,
          right: 12,
        }}>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme.colors.textTertiary}
          />
        </View>
      )}
    </Pressable>
  );
}