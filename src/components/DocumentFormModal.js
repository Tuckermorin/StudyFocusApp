// src/components/DocumentFormModal.js
import React from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DocumentFormModal({
  visible,
  onClose,
  onSave,
  isSaving = false,
  capturedImageUri = null,
  documentName,
  setDocumentName,
  documentSubject,
  setDocumentSubject,
  documentTags,
  setDocumentTags,
  documentNotes,
  setDocumentNotes,
}) {
  const { theme, globalStyles } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[globalStyles.container, { padding: 16 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[globalStyles.spaceBetween, { marginBottom: 24 }]}>
            <Text style={globalStyles.heading4}>Save Document</Text>

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
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Preview Image */}
          {capturedImageUri && (
            <View style={{ marginBottom: 24 }}>
              <Text style={[globalStyles.text, { marginBottom: 8 }]}>Preview</Text>
              <Image
                source={{ uri: capturedImageUri }}
                style={{ width: '100%', height: 200, borderRadius: 8, backgroundColor: theme.colors.surface }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Document Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>Document Name *</Text>
            <TextInput
              style={globalStyles.input}
              value={documentName}
              onChangeText={setDocumentName}
              placeholder="Enter document name..."
              placeholderTextColor={theme.colors.placeholder}
              maxLength={100}
            />
          </View>

          {/* Subject */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>Subject</Text>
            <TextInput
              style={globalStyles.input}
              value={documentSubject}
              onChangeText={setDocumentSubject}
              placeholder="Enter subject..."
              placeholderTextColor={theme.colors.placeholder}
              maxLength={50}
            />
          </View>

          {/* Tags */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>Tags (comma-separated)</Text>
            <TextInput
              style={globalStyles.input}
              value={documentTags}
              onChangeText={setDocumentTags}
              placeholder="homework, chapter1, important..."
              placeholderTextColor={theme.colors.placeholder}
              maxLength={200}
            />
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 32 }}>
            <Text style={[globalStyles.text, { marginBottom: 8 }]}>Notes (Optional)</Text>
            <TextInput
              style={[globalStyles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              value={documentNotes}
              onChangeText={setDocumentNotes}
              placeholder="Add any notes about this document..."
              placeholderTextColor={theme.colors.placeholder}
              multiline
              maxLength={500}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [globalStyles.buttonSecondary, { flex: 1 }, pressed && { opacity: 0.8 }]}
            >
              <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onSave}
              disabled={isSaving || !documentName.trim()}
              style={({ pressed }) => [
                globalStyles.button,
                { flex: 1 },
                (isSaving || !documentName.trim()) && globalStyles.buttonDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[globalStyles.buttonText, (isSaving || !documentName.trim()) && globalStyles.buttonTextDisabled]}
              >
                {isSaving ? 'Saving...' : 'Save Document'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
