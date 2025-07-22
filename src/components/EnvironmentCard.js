// src/components/EnvironmentCard.js
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useStudy } from '../context/StudyContext';
import SensorService from '../services/sensorService';
import EnvironmentService from '../services/environmentService';

export default function EnvironmentCard({ 
  size = 'medium', 
  showRecommendations = true,
  onPress = null,
  style = {} 
}) {
  const { theme, globalStyles } = useTheme();
  const { environment, updateEnvironment } = useStudy();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Initialize sensors and start monitoring
    initializeSensors();
    
    return () => {
      SensorService.stopMonitoring();
    };
  }, []);

  const initializeSensors = async () => {
    try {
      const initialized = await SensorService.initialize();
      if (initialized) {
        // Add listener for sensor updates
        const unsubscribe = SensorService.addListener((data) => {
          setSensorData(data);
          
          // Analyze environment conditions
          const envAnalysis = EnvironmentService.analyzeEnvironment(data);
          setAnalysis(envAnalysis);
          
          // Update study context
          updateEnvironment({
            lightLevel: data.lightLevel,
            motionLevel: data.motionLevel,
            status: envAnalysis.status,
            recommendations: envAnalysis.recommendations,
            score: envAnalysis.score,
            lastChecked: Date.now(),
          });
        });
        
        // Start monitoring
        SensorService.startMonitoring();
        setIsMonitoring(true);
        
        // Cleanup function
        return unsubscribe;
      } else {
        console.warn('Could not initialize sensors');
      }
    } catch (error) {
      console.error('Error initializing sensors:', error);
      Alert.alert(
        'Sensor Error',
        'Unable to initialize environment sensors. Some features may not work properly.',
        [{ text: 'OK' }]
      );
    }
  };

  // Get status color based on environment condition
  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return theme.colors.optimal;
      case 'good': return theme.colors.good;
      case 'poor': return theme.colors.poor;
      case 'critical': return theme.colors.critical;
      default: return theme.colors.textSecondary;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal': return 'checkmark-circle';
      case 'good': return 'checkmark';
      case 'poor': return 'warning';
      case 'critical': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'optimal': return '✓ Optimal Environment';
      case 'good': return '✓ Good Conditions';
      case 'poor': return '⚠ Could Be Better';
      case 'critical': return '⚠ Poor Conditions';
      default: return 'Checking Environment...';
    }
  };

  // Get motion level display text
  const getMotionText = (motionLevel) => {
    switch (motionLevel) {
      case 'low': return 'Minimal';
      case 'medium': return 'Some Movement';
      case 'high': return 'High Activity';
      default: return 'Unknown';
    }
  };

  // Handle card press
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  // Component styles based on size
  const getStyles = () => {
    const baseStyles = {
      container: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: size === 'large' ? 20 : 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...globalStyles.card,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: size === 'large' ? 16 : 12,
      },
      headerIcon: {
        marginRight: 12,
      },
      headerTitle: {
        flex: 1,
        fontWeight: '600',
        color: theme.colors.text,
      },
      statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
      },
      statusIcon: {
        marginRight: 8,
      },
      statusText: {
        flex: 1,
        fontWeight: '500',
      },
      metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: showRecommendations ? 16 : 0,
      },
      metricItem: {
        alignItems: 'center',
        flex: 1,
      },
      metricValue: {
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
      },
      metricLabel: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
      },
      recommendationsContainer: {
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(analysis?.status),
      },
      recommendationText: {
        color: theme.colors.textSecondary,
        lineHeight: 18,
        marginBottom: 4,
      },
      scoreContainer: {
        position: 'absolute',
        top: size === 'large' ? 20 : 16,
        right: size === 'large' ? 20 : 16,
        alignItems: 'center',
      },
      scoreValue: {
        fontWeight: 'bold',
        color: getStatusColor(analysis?.status),
      },
      scoreLabel: {
        fontSize: 10,
        color: theme.colors.textTertiary,
      },
    };

    // Size-specific text styles
    if (size === 'large') {
      baseStyles.headerTitle.fontSize = 18;
      baseStyles.statusText.fontSize = 16;
      baseStyles.metricValue.fontSize = 20;
      baseStyles.metricLabel.fontSize = 12;
      baseStyles.recommendationText.fontSize = 14;
      baseStyles.scoreValue.fontSize = 18;
    } else if (size === 'medium') {
      baseStyles.headerTitle.fontSize = 16;
      baseStyles.statusText.fontSize = 14;
      baseStyles.metricValue.fontSize = 18;
      baseStyles.metricLabel.fontSize = 11;
      baseStyles.recommendationText.fontSize = 13;
      baseStyles.scoreValue.fontSize = 16;
    } else {
      baseStyles.headerTitle.fontSize = 14;
      baseStyles.statusText.fontSize = 12;
      baseStyles.metricValue.fontSize = 16;
      baseStyles.metricLabel.fontSize = 10;
      baseStyles.recommendationText.fontSize = 12;
      baseStyles.scoreValue.fontSize = 14;
    }

    return baseStyles;
  };

  const styles = getStyles();

  // Use current data or fallback to stored environment data
  const currentLightLevel = sensorData?.lightLevel ?? environment.lightLevel;
  const currentMotionLevel = sensorData?.motionLevel ?? environment.motionLevel;
  const currentStatus = analysis?.status ?? environment.status;
  const currentRecommendations = analysis?.recommendations ?? environment.recommendations;
  const currentScore = analysis?.score ?? environment.score;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && onPress && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Score Display */}
      {currentScore && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>
            {currentScore}
          </Text>
          <Text style={styles.scoreLabel}>
            SCORE
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Ionicons 
          name="bulb" 
          size={size === 'large' ? 24 : 20} 
          color={theme.colors.primary}
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>
          Environment Status
        </Text>
        {isMonitoring && (
          <Ionicons 
            name="radio-button-on" 
            size={12} 
            color={theme.colors.success}
          />
        )}
      </View>

      {/* Overall Status */}
      <View style={styles.statusContainer}>
        <Ionicons 
          name={getStatusIcon(currentStatus)} 
          size={20} 
          color={getStatusColor(currentStatus)}
          style={styles.statusIcon}
        />
        <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
          {getStatusText(currentStatus)}
        </Text>
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {currentLightLevel !== null ? `${currentLightLevel}%` : '--'}
          </Text>
          <Text style={styles.metricLabel}>Light Level</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {getMotionText(currentMotionLevel)}
          </Text>
          <Text style={styles.metricLabel}>Movement</Text>
        </View>
        
        {environment.lastChecked && (
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {Math.floor((Date.now() - environment.lastChecked) / 1000)}s
            </Text>
            <Text style={styles.metricLabel}>Last Check</Text>
          </View>
        )}
      </View>

      {/* Recommendations */}
      {showRecommendations && currentRecommendations && currentRecommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={[styles.recommendationText, { fontWeight: '500', marginBottom: 8 }]}>
            💡 Recommendations:
          </Text>
          {currentRecommendations.slice(0, 3).map((recommendation, index) => (
            <Text key={index} style={styles.recommendationText}>
              • {recommendation}
            </Text>
          ))}
          {currentRecommendations.length > 3 && (
            <Text style={[styles.recommendationText, { fontStyle: 'italic' }]}>
              + {currentRecommendations.length - 3} more suggestions
            </Text>
          )}
        </View>
      )}

      {/* Monitoring Status */}
      {size === 'large' && (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.divider,
        }}>
          <Ionicons 
            name={isMonitoring ? "checkmark-circle" : "alert-circle"} 
            size={16} 
            color={isMonitoring ? theme.colors.success : theme.colors.warning}
            style={{ marginRight: 6 }}
          />
          <Text style={[globalStyles.textTertiary, { fontSize: 12 }]}>
            {isMonitoring ? 'Real-time monitoring active' : 'Monitoring unavailable'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}