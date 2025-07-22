// app/settings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  Slider,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy } from '../src/context/StudyContext';
import SubjectPicker from '../src/components/SubjectPicker';
import MetricCard from '../src/components/MetricCard';
import StudyStorage from '../src/storage/studyStorage';
import DocumentStorage from '../src/storage/documentStorage';

export default function SettingsScreen() {
  const { theme, globalStyles, themeName, themes, changeTheme } = useTheme();
  const { 
    preferences, 
    savePreferences, 
    currentSubject, 
    setSubject,
    dailyGoal,
    setDailyGoal,
    resetSession,
  } = useStudy();

  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [tempDailyGoal, setTempDailyGoal] = useState(4); // hours
  const [storageInfo, setStorageInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    loadStorageInfo();
    loadSubjects();
    setTempDailyGoal(Math.floor(dailyGoal / 3600)); // Convert seconds to hours
  }, [dailyGoal]);

  const loadStorageInfo = async () => {
    try {
      const studyInfo = await StudyStorage.getStorageInfo();
      const documentInfo = await DocumentStorage.getStorageUsage();
      
      setStorageInfo({
        ...studyInfo,
        ...documentInfo,
      });
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const allSubjects = await StudyStorage.getAllSubjects();
      setSubjects(allSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    try {
      await savePreferences({ [key]: value });
    } catch (error) {
      console.error('Error saving preference:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const handleGoalSave = async () => {
    try {
      const newGoalInSeconds = tempDailyGoal * 3600;
      setDailyGoal(newGoalInSeconds);
      setShowGoalModal(false);
      Alert.alert('Goal Updated', `Daily study goal set to ${tempDailyGoal} hours`);
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    }
  };

  const handleDataExport = async () => {
    try {
      const studyData = await StudyStorage.exportAllData();
      const documentData = await DocumentStorage.exportDocumentData();
      
      if (studyData && documentData) {
        Alert.alert(
          'Data Export Ready',
          'Your study data and documents have been prepared for export. In a full app, this would save to your device or cloud storage.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleDataClear = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your study sessions, subjects, and documents. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await StudyStorage.clearAllData();
              await DocumentStorage.clearAllDocuments();
              resetSession();
              setSubject('');
              Alert.alert('Data Cleared', 'All data has been successfully removed.');
              loadStorageInfo();
              loadSubjects();
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    icon 
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: pressed ? theme.colors.surface : theme.colors.card,
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={24} 
          color={theme.colors.primary}
          style={{ marginRight: 12 }}
        />
      )}
      
      <View style={{ flex: 1 }}>
        <Text style={[globalStyles.text, { fontWeight: '500' }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[globalStyles.textSecondary, { marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightComponent || (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.colors.textTertiary}
        />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading3, { marginBottom: 8 }]}>
            Settings
          </Text>
          <Text style={globalStyles.textSecondary}>
            Customize your study experience and manage your data
          </Text>
        </View>

        {/* Current Subject */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Study Setup
          </Text>
          
          <SettingRow
            title="Current Subject"
            subtitle={currentSubject || 'No subject selected'}
            icon="book"
            onPress={() => setShowSubjectManager(true)}
          />

          <SettingRow
            title="Daily Study Goal"
            subtitle={formatTime(dailyGoal)}
            icon="target"
            onPress={() => setShowGoalModal(true)}
          />

          <SettingRow
            title="Manage Subjects"
            subtitle={`${subjects.length} subjects created`}
            icon="library"
            onPress={() => setShowSubjectManager(true)}
          />
        </View>

        {/* Session Preferences */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Session Preferences
          </Text>

          <SettingRow
            title="Default Session Length"
            subtitle={`${preferences.defaultSessionLength || 25} minutes`}
            icon="timer"
            rightComponent={
              <Text style={[globalStyles.textSecondary]}>
                {preferences.defaultSessionLength || 25}m
              </Text>
            }
          />

          <SettingRow
            title="Default Break Length"
            subtitle={`${preferences.defaultBreakLength || 5} minutes`}
            icon="cafe"
            rightComponent={
              <Text style={[globalStyles.textSecondary]}>
                {preferences.defaultBreakLength || 5}m
              </Text>
            }
          />

          <SettingRow
            title="Auto-start Breaks"
            subtitle="Automatically start break when session ends"
            icon="play-circle"
            rightComponent={
              <Switch
                value={preferences.autoStartBreaks || false}
                onValueChange={(value) => handlePreferenceChange('autoStartBreaks', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />
        </View>

        {/* Environment & Monitoring */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Environment & Monitoring
          </Text>

          <SettingRow
            title="Environment Alerts"
            subtitle="Get notified about poor study conditions"
            icon="bulb"
            rightComponent={
              <Switch
                value={preferences.enableEnvironmentAlerts || true}
                onValueChange={(value) => handlePreferenceChange('enableEnvironmentAlerts', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />

          <SettingRow
            title="Motion Detection"
            subtitle="Track movement during study sessions"
            icon="body"
            rightComponent={
              <Switch
                value={preferences.enableMotionDetection || true}
                onValueChange={(value) => handlePreferenceChange('enableMotionDetection', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />
        </View>

        {/* Notifications & Sounds */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Notifications & Sounds
          </Text>

          <SettingRow
            title="Sound Alerts"
            subtitle="Play sounds for session start/end"
            icon="volume-high"
            rightComponent={
              <Switch
                value={preferences.soundEnabled || true}
                onValueChange={(value) => handlePreferenceChange('soundEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />

          <SettingRow
            title="Vibration"
            subtitle="Vibrate for important notifications"
            icon="phone-portrait"
            rightComponent={
              <Switch
                value={preferences.vibrationEnabled || true}
                onValueChange={(value) => handlePreferenceChange('vibrationEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.card}
              />
            }
          />
        </View>

        {/* Appearance */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Appearance
          </Text>

          {Object.entries(themes).map(([themeKey, themeData]) => (
            <SettingRow
              key={themeKey}
              title={themeData.name}
              subtitle={`${themeData.type} theme`}
              icon="color-palette"
              onPress={() => changeTheme(themeKey)}
              rightComponent={
                themeName === themeKey ? (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={theme.colors.primary}
                  />
                ) : null
              }
            />
          ))}
        </View>

        {/* Storage & Data */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Storage & Data
          </Text>

          {storageInfo && (
            <View style={{ 
              flexDirection: 'row', 
              gap: 12,
              marginBottom: 16,
            }}>
              <MetricCard
                title="Study Sessions"
                value={storageInfo.sessions || 0}
                icon="calendar"
                color={theme.colors.success}
                style={{ flex: 1 }}
                size="small"
              />
              
              <MetricCard
                title="Documents"
                value={storageInfo.totalDocuments || 0}
                icon="folder"
                color={theme.colors.info}
                style={{ flex: 1 }}
                size="small"
              />
            </View>
          )}

          <SettingRow
            title="Export Data"
            subtitle="Download your study data and documents"
            icon="download"
            onPress={handleDataExport}
          />

          <SettingRow
            title="Clear All Data"
            subtitle="Permanently delete all data"
            icon="trash"
            onPress={handleDataClear}
            rightComponent={
              <Ionicons 
                name="warning" 
                size={20} 
                color={theme.colors.error}
              />
            }
          />
        </View>

        {/* About */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            About
          </Text>

          <SettingRow
            title="About StudyFocus"
            subtitle="Version 1.0.0"
            icon="information-circle"
            onPress={() => setShowAboutModal(true)}
          />

          <SettingRow
            title="Privacy Policy"
            subtitle="How we handle your data"
            icon="shield-checkmark"
            onPress={() => Alert.alert('Privacy Policy', 'All data is stored locally on your device. No personal information is collected or shared.')}
          />
        </View>
      </ScrollView>

      {/* Subject Manager Modal */}
      <SubjectPicker
        visible={showSubjectManager}
        onClose={() => {
          setShowSubjectManager(false);
          loadSubjects();
        }}
        onSubjectSelect={(subject) => {
          // Subject is automatically set via context
        }}
        selectedSubject={currentSubject}
        mode="manage"
      />

      {/* Daily Goal Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <SafeAreaView style={[globalStyles.container, { padding: 20 }]}>
          <Text style={[globalStyles.heading4, { marginBottom: 24 }]}>
            Set Daily Study Goal
          </Text>

          <View style={{ marginBottom: 32 }}>
            <Text style={[globalStyles.text, { marginBottom: 12, textAlign: 'center' }]}>
              Daily Goal: {tempDailyGoal} {tempDailyGoal === 1 ? 'hour' : 'hours'}
            </Text>
            
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={1}
              maximumValue={12}
              step={0.5}
              value={tempDailyGoal}
              onValueChange={setTempDailyGoal}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              thumbStyle={{ backgroundColor: theme.colors.primary }}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={globalStyles.textTertiary}>1 hour</Text>
              <Text style={globalStyles.textTertiary}>12 hours</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setShowGoalModal(false)}
              style={({ pressed }) => [
                globalStyles.buttonSecondary,
                { flex: 1 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleGoalSave}
              style={({ pressed }) => [
                globalStyles.button,
                { flex: 1 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonText}>Save Goal</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <SafeAreaView style={[globalStyles.container, { padding: 20 }]}>
          <View style={[globalStyles.spaceBetween, { marginBottom: 24 }]}>
            <Text style={globalStyles.heading4}>
              About StudyFocus
            </Text>
            
            <Pressable
              onPress={() => setShowAboutModal(false)}
              style={({ pressed }) => [
                {
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: pressed ? theme.colors.surface : 'transparent',
                },
              ]}
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={theme.colors.text}
              />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                backgroundColor: theme.colors.primary,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons 
                  name="book" 
                  size={40} 
                  color="#FFFFFF"
                />
              </View>
              
              <Text style={[globalStyles.heading4, { marginBottom: 8 }]}>
                StudyFocus
              </Text>
              <Text style={globalStyles.textSecondary}>
                Version 1.0.0
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                  🎯 Mission
                </Text>
                <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
                  StudyFocus helps you optimize your study environment and track your progress to achieve better focus and learning outcomes.
                </Text>
              </View>

              <View>
                <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                  ✨ Features
                </Text>
                <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
                  • Environment monitoring with smart recommendations{'\n'}
                  • Study session tracking and analytics{'\n'}
                  • Document scanning and organization{'\n'}
                  • Subject management and progress tracking{'\n'}
                  • Multiple themes and customization options
                </Text>
              </View>

              <View>
                <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                  🛡️ Privacy
                </Text>
                <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
                  All your data is stored locally on your device. No personal information is collected, transmitted, or shared with third parties.
                </Text>
              </View>

              <View>
                <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                  🔧 Technology
                </Text>
                <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
                  Built with React Native and Expo, following Material Design principles for a consistent and intuitive user experience.
                </Text>
              </View>
            </View>

            <View style={{ 
              marginTop: 32,
              padding: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
            }}>
              <Text style={[globalStyles.textTertiary, { textAlign: 'center', lineHeight: 18 }]}>
                Made with 💙 for students who want to study smarter, not harder.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}