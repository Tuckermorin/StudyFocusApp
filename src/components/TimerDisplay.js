// src/components/TimerDisplay.js
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useStudy, SESSION_STATES } from '../context/StudyContext';

export default function TimerDisplay({ 
  size = 'large', 
  showControls = true, 
  onTimeUpdate = null 
}) {
  const { theme, globalStyles } = useTheme();
  const {
    sessionState,
    timeRemaining,
    sessionDuration,
    breakDuration,
    progressPercentage,
    currentSubject,
    isSessionActive,
    isSessionPaused,
    isOnBreak,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    startBreak,
    endBreak,
    updateTimer,
  } = useStudy();

  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);

  // Timer effect
  useEffect(() => {
    let interval = null;

    if (isSessionActive || isOnBreak) {
      interval = setInterval(() => {
        const newTimeRemaining = Math.max(0, localTimeRemaining - 1);
        setLocalTimeRemaining(newTimeRemaining);
        updateTimer(newTimeRemaining);
        
        if (onTimeUpdate) {
          onTimeUpdate(newTimeRemaining);
        }

        // Auto-transition when timer reaches 0
        if (newTimeRemaining === 0) {
          if (isSessionActive) {
            // Session completed, start break
            endSession();
            if (breakDuration > 0) {
              startBreak();
            }
          } else if (isOnBreak) {
            // Break completed
            endBreak();
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSessionActive, isOnBreak, localTimeRemaining]);

  // Sync with context when timeRemaining changes
  useEffect(() => {
    setLocalTimeRemaining(timeRemaining);
  }, [timeRemaining]);

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on state and remaining time
  const getTimerColor = () => {
    if (isOnBreak) return theme.colors.break;
    if (isSessionPaused) return theme.colors.textSecondary;
    
    const percentage = (localTimeRemaining / sessionDuration) * 100;
    if (percentage <= 10) return theme.colors.error;
    if (percentage <= 25) return theme.colors.warning;
    return theme.colors.focus;
  };

  // Get session status text
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

  // Get appropriate icon
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

  // Handle control button press
  const handleControlPress = () => {
    if (isSessionActive) {
      pauseSession();
    } else if (isSessionPaused) {
      resumeSession();
    } else if (isOnBreak) {
      endBreak();
    } else {
      startSession(currentSubject);
    }
  };

  // Component styles based on size
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
      controlButton: {
        backgroundColor: getTimerColor(),
        borderRadius: 50,
        padding: size === 'large' ? 16 : 12,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size === 'large' ? 80 : 60,
        minHeight: size === 'large' ? 80 : 60,
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

    // Size-specific text styles
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
      {/* Status Icon and Text */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons 
          name={getStatusIcon()} 
          size={size === 'large' ? 24 : 20} 
          color={theme.colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.statusText}>
          {getStatusText()}
        </Text>
      </View>

      {/* Subject Display */}
      {currentSubject && (
        <Text style={styles.subjectText}>
          {currentSubject}
        </Text>
      )}

      {/* Timer Display */}
      <Text style={styles.timerText}>
        {formatTime(localTimeRemaining)}
      </Text>

      {/* Progress Bar */}
      {(isSessionActive || isSessionPaused || isOnBreak) && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: isOnBreak 
                  ? `${((breakDuration - localTimeRemaining) / breakDuration) * 100}%`
                  : `${progressPercentage}%`
              }
            ]} 
          />
        </View>
      )}

      {/* Session Info */}
      {(isSessionActive || isSessionPaused) && (
        <Text style={[globalStyles.textTertiary, { marginTop: 8, textAlign: 'center' }]}>
          Session {Math.floor(((sessionDuration - localTimeRemaining) / sessionDuration) * 100)}% complete
        </Text>
      )}

      {/* Control Buttons */}
      {showControls && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          {/* Main Control Button */}
          <Pressable
            onPress={handleControlPress}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Ionicons 
              name={
                isSessionActive ? 'pause' :
                isSessionPaused ? 'play' :
                isOnBreak ? 'stop' : 'play'
              }
              size={size === 'large' ? 32 : 24}
              color="#FFFFFF"
            />
          </Pressable>

          {/* End Session Button (when active or paused) */}
          {(isSessionActive || isSessionPaused) && (
            <Pressable
              onPress={endSession}
              style={({ pressed }) => [
                {
                  backgroundColor: theme.colors.error,
                  borderRadius: 30,
                  padding: size === 'large' ? 12 : 10,
                  marginLeft: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: size === 'large' ? 60 : 50,
                  minHeight: size === 'large' ? 60 : 50,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
              ]}
            >
              <Ionicons 
                name="stop" 
                size={size === 'large' ? 24 : 20} 
                color="#FFFFFF" 
              />
            </Pressable>
          )}
        </View>
      )}

      {/* Quick Session Info */}
      {sessionState === SESSION_STATES.IDLE && size === 'large' && (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={[globalStyles.textSecondary, { textAlign: 'center', marginBottom: 8 }]}>
            Ready for a {Math.floor(sessionDuration / 60)} minute focus session
          </Text>
          {!currentSubject && (
            <Text style={[globalStyles.textTertiary, { textAlign: 'center' }]}>
              Select a subject in settings to get started
            </Text>
          )}
        </View>
      )}
    </View>
  );
}