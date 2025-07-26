import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const SESSION_STATES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  BREAK: 'break',
  COMPLETED: 'completed',
};

export default function TimerDisplay({
  size = 'large',
  timeRemaining = 0,
  sessionDuration = 0,
  breakDuration = 0,
  sessionState = SESSION_STATES.IDLE,
  progressPercentage = 0,
  currentSubject = '',
}) {
  const { theme, globalStyles } = useTheme();

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (sessionState === SESSION_STATES.BREAK) return theme.colors.break;
    if (sessionState === SESSION_STATES.PAUSED)
      return theme.colors.textSecondary;

    const percentage = (timeRemaining / sessionDuration) * 100;
    if (percentage <= 10) return theme.colors.error;
    if (percentage <= 25) return theme.colors.warning;
    return theme.colors.focus;
  };

  const getStatusText = () => {
    switch (sessionState) {
      case SESSION_STATES.ACTIVE:
        return 'Focus Time';
      case SESSION_STATES.PAUSED:
        return 'Paused';
      case SESSION_STATES.BREAK:
        return 'Break Time';
      case SESSION_STATES.COMPLETED:
        return 'Session Complete';
      default:
        return 'Ready to Study';
    }
  };

  const getStatusIcon = () => {
    switch (sessionState) {
      case SESSION_STATES.ACTIVE:
        return 'timer';
      case SESSION_STATES.PAUSED:
        return 'pause';
      case SESSION_STATES.BREAK:
        return 'cafe';
      case SESSION_STATES.COMPLETED:
        return 'checkmark-circle';
      default:
        return 'play-circle';
    }
  };

  const getStyles = () => {
    const baseStyles = {
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'large' ? 32 : 20,
      },
      timerText: {
        fontWeight: 'bold',
        color: getTimerColor(),
        textAlign: 'center',
      },
      statusText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
      },
      subjectText: {
        color: theme.colors.text,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 16,
      },
      progressContainer: {
        width: size === 'large' ? 200 : 150,
        height: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 4,
        marginTop: 16,
        overflow: 'hidden',
      },
      progressBar: {
        height: '100%',
        backgroundColor: getTimerColor(),
        borderRadius: 4,
      },
    };

    if (size === 'large') {
      baseStyles.timerText.fontSize = 56;
      baseStyles.statusText.fontSize = 18;
      baseStyles.subjectText.fontSize = 20;
    } else if (size === 'medium') {
      baseStyles.timerText.fontSize = 36;
      baseStyles.statusText.fontSize = 16;
      baseStyles.subjectText.fontSize = 18;
    } else {
      baseStyles.timerText.fontSize = 24;
      baseStyles.statusText.fontSize = 14;
      baseStyles.subjectText.fontSize = 16;
    }

    return baseStyles;
  };

  const styles = getStyles();

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons
          name={getStatusIcon()}
          size={size === 'large' ? 24 : 20}
          color={theme.colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {currentSubject && <Text style={styles.subjectText}>{currentSubject}</Text>}

      <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>

      {(sessionState === SESSION_STATES.ACTIVE ||
        sessionState === SESSION_STATES.PAUSED ||
        sessionState === SESSION_STATES.BREAK) && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width:
                  sessionState === SESSION_STATES.BREAK
                    ? `${((breakDuration - timeRemaining) / breakDuration) * 100}%`
                    : `${progressPercentage}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}
