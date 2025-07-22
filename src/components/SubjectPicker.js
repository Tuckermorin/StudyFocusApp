// src/components/SubjectPicker.js
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useStudy } from '../context/StudyContext';
import StudyStorage, { createSubject } from '../storage/studyStorage';

export default function SubjectPicker({
  visible = false,
  onClose = () => {},
  onSubjectSelect = () => {},
  selectedSubject = '',
  mode = 'select', // 'select' | 'manage'
  style = {},
}) {
  const { theme, globalStyles } = useTheme();
  const { setSubject } = useStudy();
  const [subjects, setSubjects] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#4285f4');
  const [isLoading, setIsLoading] = useState(true);

  // Predefined colors for subjects
  const subjectColors = [
    '#4285f4', // Blue
    '#34a853', // Green
    '#fbbc05', // Yellow
    '#ea4335', // Red
    '#9c27b0', // Purple
    '#ff9800', // Orange
    '#795548', // Brown
    '#607d8b', // Blue Grey
    '#e91e63', // Pink
    '#009688', // Teal
    '#3f51b5', // Indigo
    '#8bc34a', // Light Green
  ];

  useEffect(() => {
    if (visible) {
      loadSubjects();
    }
  }, [visible]);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const allSubjects = await StudyStorage.getAllSubjects();
      setSubjects(allSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
      Alert.alert('Error', 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name');
      return;
    }

    // Check if subject already exists
    const existingSubject = subjects.find(
      s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase()
    );
    
    if (existingSubject) {
      Alert.alert('Error', 'A subject with this name already exists');
      return;
    }

    try {
      const newSubject = createSubject({
        name: newSubjectName.trim(),
        color: selectedColor,
      });

      const success = await StudyStorage.saveSubject(newSubject);
      if (success) {
        setSubjects(prev => [...prev, newSubject]);
        setNewSubjectName('');
        setIsCreating(false);
        
        // Auto-select the newly created subject
        handleSubjectSelect(newSubject.name);
      } else {
        Alert.alert('Error', 'Failed to create subject');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      Alert.alert('Error', 'Failed to create subject');
    }
  };

  const handleSubjectSelect = (subjectName) => {
    setSubject(subjectName);
    onSubjectSelect(subjectName);
    if (mode === 'select') {
      onClose();
    }
  };

  const handleDeleteSubject = (subject) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete "${subject.name}"? This will not delete your study sessions, but the subject won't be available for new sessions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await StudyStorage.deleteSubject(subject.id);
              if (success) {
                setSubjects(prev => prev.filter(s => s.id !== subject.id));
                if (selectedSubject === subject.name) {
                  setSubject('');
                  onSubjectSelect('');
                }
              } else {
                Alert.alert('Error', 'Failed to delete subject');
              }
            } catch (error) {
              console.error('Error deleting subject:', error);
              Alert.alert('Error', 'Failed to delete subject');
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

  const renderSubjectItem = (subject) => (
    <Pressable
      key={subject.id}
      onPress={() => handleSubjectSelect(subject.name)}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          marginVertical: 4,
          backgroundColor: selectedSubject === subject.name 
            ? `${theme.colors.primary}20` 
            : theme.colors.card,
          borderRadius: 12,
          borderWidth: selectedSubject === subject.name ? 2 : 1,
          borderColor: selectedSubject === subject.name 
            ? theme.colors.primary 
            : theme.colors.border,
        },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Subject Color Indicator */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: subject.color,
          marginRight: 12,
        }}
      />

      {/* Subject Info */}
      <View style={{ flex: 1 }}>
        <Text style={[globalStyles.text, { fontWeight: '600' }]}>
          {subject.name}
        </Text>
        
        {subject.totalStudyTime > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[globalStyles.textSecondary, { marginRight: 12 }]}>
              {formatTime(subject.totalStudyTime)} studied
            </Text>
            <Text style={globalStyles.textSecondary}>
              {subject.sessionsCount} sessions
            </Text>
          </View>
        )}
        
        {subject.averageFocusScore && (
          <Text style={[globalStyles.textTertiary, { marginTop: 2 }]}>
            Avg. focus: {subject.averageFocusScore}/10
          </Text>
        )}
      </View>

      {/* Selection Indicator */}
      {selectedSubject === subject.name && (
        <Ionicons 
          name="checkmark-circle" 
          size={24} 
          color={theme.colors.primary}
          style={{ marginLeft: 8 }}
        />
      )}

      {/* Delete Button (in manage mode) */}
      {mode === 'manage' && (
        <Pressable
          onPress={() => handleDeleteSubject(subject)}
          style={({ pressed }) => [
            {
              padding: 8,
              marginLeft: 8,
              borderRadius: 20,
              backgroundColor: pressed ? theme.colors.error : `${theme.colors.error}20`,
            },
          ]}
        >
          <Ionicons 
            name="trash" 
            size={18} 
            color={theme.colors.error}
          />
        </Pressable>
      )}
    </Pressable>
  );

  const renderCreateForm = () => (
    <View style={{ marginTop: 16 }}>
      <Text style={[globalStyles.heading6, { marginBottom: 16 }]}>
        Create New Subject
      </Text>

      {/* Subject Name Input */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
          Subject Name
        </Text>
        <TextInput
          style={globalStyles.input}
          value={newSubjectName}
          onChangeText={setNewSubjectName}
          placeholder="Enter subject name..."
          placeholderTextColor={theme.colors.placeholder}
          maxLength={50}
          autoFocus
        />
      </View>

      {/* Color Picker */}
      <View style={{ marginBottom: 20 }}>
        <Text style={[globalStyles.textSecondary, { marginBottom: 12 }]}>
          Choose Color
        </Text>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {subjectColors.map((color) => (
            <Pressable
              key={color}
              onPress={() => setSelectedColor(color)}
              style={({ pressed }) => [
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: color,
                  borderWidth: selectedColor === color ? 3 : 2,
                  borderColor: selectedColor === color ? theme.colors.text : theme.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              {selectedColor === color && (
                <Ionicons 
                  name="checkmark" 
                  size={20} 
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          onPress={() => {
            setIsCreating(false);
            setNewSubjectName('');
            setSelectedColor('#4285f4');
          }}
          style={({ pressed }) => [
            globalStyles.buttonSecondary,
            { flex: 1 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleCreateSubject}
          style={({ pressed }) => [
            globalStyles.button,
            { flex: 1 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={globalStyles.buttonText}>Create</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[globalStyles.container, { padding: 16 }]}>
        {/* Header */}
        <View style={[globalStyles.spaceBetween, { marginBottom: 24 }]}>
          <Text style={globalStyles.heading3}>
            {mode === 'manage' ? 'Manage Subjects' : 'Select Subject'}
          </Text>
          
          <Pressable
            onPress={onClose}
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

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Loading State */}
          {isLoading && (
            <View style={[globalStyles.centeredContent, { height: 200 }]}>
              <Text style={globalStyles.textSecondary}>Loading subjects...</Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && subjects.length === 0 && !isCreating && (
            <View style={[globalStyles.centeredContent, { height: 200 }]}>
              <Ionicons 
                name="book-outline" 
                size={48} 
                color={theme.colors.textTertiary}
                style={{ marginBottom: 16 }}
              />
              <Text style={[globalStyles.heading6, { marginBottom: 8 }]}>
                No Subjects Yet
              </Text>
              <Text style={[globalStyles.textSecondary, { textAlign: 'center', marginBottom: 24 }]}>
                Create your first subject to start studying
              </Text>
            </View>
          )}

          {/* Subjects List */}
          {!isLoading && subjects.length > 0 && !isCreating && (
            <View style={{ marginBottom: 20 }}>
              {subjects.map(renderSubjectItem)}
            </View>
          )}

          {/* Create New Subject Form */}
          {isCreating && renderCreateForm()}

          {/* Create Subject Button */}
          {!isCreating && (
            <Pressable
              onPress={() => setIsCreating(true)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  borderStyle: 'dashed',
                  marginTop: 16,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons 
                name="add" 
                size={24} 
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[globalStyles.text, { color: theme.colors.primary, fontWeight: '600' }]}>
                Create New Subject
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Footer Actions */}
        {mode === 'select' && !isCreating && (
          <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.divider }}>
            <Pressable
              onPress={() => {
                setSubject('');
                onSubjectSelect('');
                onClose();
              }}
              style={({ pressed }) => [
                globalStyles.buttonSecondary,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={globalStyles.buttonTextSecondary}>
                Study Without Subject
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}