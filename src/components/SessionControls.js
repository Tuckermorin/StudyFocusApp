// src/components/SessionControls.js
import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Modal, TextInput, Slider } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useStudy, SESSION_STATES } from '../context/StudyContext';

export default function SessionControls({
  style = {},
  layout = 'horizontal', // 'horizontal' | 'vertical' | 'compact'
  showSettingsButton = true,  // Changed from showSettings to showSettingsButton
  showReset = true,
  onSessionEnd = null,
}) {
  const { theme, globalStyles } = useTheme();
  const {
    sessionState,
    isSessionActive,
    isSessionPaused,
    isOnBreak,
    currentSubject,
    sessionDuration,
    breakDuration,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    startBreak,
    endBreak,
    resetSession,
    savePreferences,
  } = useStudy();

  const [showSettings, setShowSettings] = useState(false);
  const [tempSessionLength, setTempSessionLength] = useState(Math.floor(sessionDuration / 60));
  const [tempBreakLength, setTempBreakLength] = useState(Math.floor(breakDuration / 60));
  const [focusScore, setFocusScore] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);

  // Handle primary action (play/pause/stop)
  const handlePrimaryAction = () => {
    if (!currentSubject && !isSessionActive && !isSessionPaused) {
      Alert.alert(
        'No Subject Selected',
        'Please select a subject before starting your study session.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  // Handle session end with feedback
  const handleEndSession = () => {
    if (isSessionActive || isSessionPaused) {
      setShowEndSessionModal(true);
    } else {
      endSession();
      if (onSessionEnd) {
        onSessionEnd();
      }
    }
  };

  // Confirm end session with productivity feedback
  const confirmEndSession = () => {
    // Here you could save the focus score and notes to the session
    // For now, we'll just end the session
    endSession();
    setShowEndSessionModal(false);
    setFocusScore(5);
    setSessionNotes('');
    
    if (onSessionEnd) {
      onSessionEnd({
        focusScore,
        notes: sessionNotes,
      });
    }
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      await savePreferences({
        defaultSessionLength: tempSessionLength,
        defaultBreakLength: tempBreakLength,
      });
      setShowSettings(false);
      Alert.alert('Settings Saved', 'Your session preferences have been updated.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  // Handle reset session
  const handleResetSession = () => {
    if (isSessionActive || isSessionPaused || isOnBreak) {
      Alert.alert(
        'Reset Session',
        'Are you sure you want to reset the current session? All progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => {
              resetSession();
            },
          },
        ]
      );
    } else {
      resetSession();
    }
  };

  // Get primary button text and icon
  const getPrimaryButtonInfo = () => {
    if (isSessionActive) {
      return { icon: 'pause', text: 'Pause', color: theme.colors.warning };
    } else if (isSessionPaused) {
      return { icon: 'play', text: 'Resume', color: theme.colors.focus };
    } else if (isOnBreak) {
      return { icon: 'stop', text: 'End Break', color: theme.colors.break };
    } else {
      return { icon: 'play', text: 'Start', color: theme.colors.focus };
    }
  };

  // Get session status text
  const getStatusText = () => {
    switch (sessionState) {
      case SESSION_STATES.ACTIVE:
        return 'Session Active';
      case SESSION_STATES.PAUSED:
        return 'Session Paused';
      case SESSION_STATES.BREAK:
        return 'Break Time';
      case SESSION_STATES.COMPLETED:
        return 'Session Complete';
      default:
        return 'Ready to Study';
    }
  };

  const primaryButtonInfo = getPrimaryButtonInfo();

  // Render compact layout
  if (layout === 'compact') {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
        {/* Primary Action Button */}
        <Pressable
          onPress={handlePrimaryAction}
          style={({ pressed }) => [
            {
              backgroundColor: primaryButtonInfo.color,
              borderRadius: 25,
              padding: 12,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 50,
              minHeight: 50,
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons 
            name={primaryButtonInfo.icon} 
            size={20} 
            color="#FFFFFF" 
          />
        </Pressable>

        {/* End Session Button (if active) */}
        {(isSessionActive || isSessionPaused) && (
          <Pressable
            onPress={handleEndSession}
            style={({ pressed }) => [
              {
                backgroundColor: theme.colors.error,
                borderRadius: 25,
                padding: 12,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 50,
                minHeight: 50,
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
          >
            <Ionicons 
              name="stop" 
              size={20} 
              color="#FFFFFF" 
            />
          </Pressable>
        )}
      </View>
    );
  }

  // Render full layout
  return (
    <View style={[{ gap: 16 }, style]}>
      {/* Status Display */}
      <View style={{
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
      }}>
        <Text style={[globalStyles.textSecondary, { marginBottom: 4 }]}>
          {getStatusText()}
        </Text>
        {currentSubject && (
          <Text style={[globalStyles.text, { fontWeight: '600' }]}>
            {currentSubject}
          </Text>
        )}
      </View>

      {/* Main Controls */}
      <View style={{
        flexDirection: layout === 'horizontal' ? 'row' : 'column',
        gap: 12,
        alignItems: 'center',
      }}>
        {/* Primary Action Button */}
        <Pressable
          onPress={handlePrimaryAction}
          style={({ pressed }) => [
            {
              backgroundColor: primaryButtonInfo.color,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flex: layout === 'horizontal' ? 1 : 0,
              minHeight: 60,
              flexDirection: 'row',
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons 
            name={primaryButtonInfo.icon} 
            size={24} 
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={[globalStyles.buttonText, { fontSize: 18 }]}>
            {primaryButtonInfo.text}
          </Text>
        </Pressable>

        {/* End Session Button (if active) */}
        {(isSessionActive || isSessionPaused) && (
          <Pressable
            onPress={handleEndSession}
            style={({ pressed }) => [
              {
                backgroundColor: theme.colors.error,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flex: layout === 'horizontal' ? 1 : 0,
                minHeight: 60,
                flexDirection: 'row',
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons 
              name="stop" 
              size={24} 
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={[globalStyles.buttonText, { fontSize: 18 }]}>
              End Session
            </Text>
          </Pressable>
        )}
      </View>

      {/* Secondary Controls */}
      <View style={{
        flexDirection: 'row',
        gap: 12,
      }}>
        {/* Start Break Button (if session active) */}
        {isSessionActive && (
          <Pressable
            onPress={startBreak}
            style={({ pressed }) => [
              globalStyles.buttonSecondary,
              { flex: 1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="cafe" 
                size={18} 
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={globalStyles.buttonTextSecondary}>Break</Text>
            </View>
          </Pressable>
        )}

        {/* Settings Button */}
        {showSettingsButton && (
          <Pressable
            onPress={() => setShowSettings(true)}
            style={({ pressed }) => [
              globalStyles.buttonSecondary,
              { flex: 1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="settings" 
                size={18} 
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={globalStyles.buttonTextSecondary}>Settings</Text>
            </View>
          </Pressable>
        )}

        {/* Reset Button */}
        {showReset && (
          <Pressable
            onPress={handleResetSession}
            style={({ pressed }) => [
              globalStyles.buttonSecondary,
              { flex: 1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="refresh" 
                size={18} 
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={globalStyles.buttonTextSecondary}>Reset</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={[globalStyles.container, { padding: 20 }]}>
          <Text style={[globalStyles.heading4, { marginBottom: 24 }]}>
            Session Settings
          </Text>

          {/* Session Length */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>
              Session Length: {tempSessionLength} minutes
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={5}
              maximumValue={120}
              step={5}
              value={tempSessionLength}
              onValueChange={setTempSessionLength}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbStyle={{ backgroundColor: theme.colors.primary }}
            />
          </View>

          {/* Break Length */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>
              Break Length: {tempBreakLength} minutes
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={30}
              step={1}
              value={tempBreakLength}
              onValueChange={setTempBreakLength}
              minimumTrackTintColor={theme.colors.break}
              maximumTrackTintColor={theme.colors.border}
              thumbStyle={{ backgroundColor: theme.colors.break }}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setShowSettings(false)}
              style={({ pressed }) => [
                globalStyles.buttonSecondary,
                { flex: 1 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveSettings}
              style={({ pressed }) => [
                globalStyles.button,
                { flex: 1 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* End Session Feedback Modal */}
      <Modal
        visible={showEndSessionModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowEndSessionModal(false)}
      >
        <View style={[globalStyles.container, { padding: 20 }]}>
          <Text style={[globalStyles.heading4, { marginBottom: 24 }]}>
            How was your session?
          </Text>

          {/* Focus Score */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.text, { marginBottom: 12 }]}>
              Focus Score: {focusScore}/10
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={focusScore}
              onValueChange={setFocusScore}
              minimumTrackTintColor={theme.colors.focus}
              maximumTrackTintColor={theme.colors.border}
              thumbStyle={{ backgroundColor: theme.colors.focus }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={globalStyles.textTertiary}>Poor Focus</Text>
              <Text style={globalStyles.textTertiary}>Excellent Focus</Text>
            </View>
          </View>

          {/* Session Notes */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>
              Session Notes (Optional)
            </Text>
            <TextInput
              style={[
                globalStyles.input,
                { 
                  height: 80,
                  textAlignVertical: 'top',
                  paddingTop: 12,
                }
              ]}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="How did this session go? Any insights?"
              placeholderTextColor={theme.colors.placeholder}
              multiline
              maxLength={200}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setShowEndSessionModal(false)}
              style={({ pressed }) => [
                globalStyles.buttonSecondary,
                { flex: 1 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={confirmEndSession}
              style={({ pressed }) => [
                globalStyles.button,
                { flex: 1 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonText}>End Session</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}