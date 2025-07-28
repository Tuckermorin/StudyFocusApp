// app/scanner.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy } from '../src/context/StudyContext';
import MetricCard from '../src/components/MetricCard';
import FloatingActionButton from '../src/components/FloatingActionButton';
import DocumentStorage from '../src/storage/documentStorage';

export default function ScannerScreen() {
  const { theme, globalStyles } = useTheme();
  const { currentSubject } = useStudy();
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentStats, setDocumentStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef(null);

  // Document form state
  const [documentName, setDocumentName] = useState('');
  const [documentSubject, setDocumentSubject] = useState('');
  const [documentTags, setDocumentTags] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');

  useEffect(() => {
    checkCameraPermissions();
    loadDocuments();
    loadDocumentStats();
  }, []);

  const checkCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const loadDocuments = async () => {
    try {
      const allDocuments = await DocumentStorage.getAllDocuments();
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentStats = async () => {
    try {
      const stats = await DocumentStorage.getDocumentStats();
      setDocumentStats(stats);
    } catch (error) {
      console.error('Error loading document stats:', error);
    }
  };

  const handleStartScan = () => {
    if (!cameraPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan documents.',
        [
          { text: 'Cancel' },
          { text: 'Allow', onPress: checkCameraPermissions },
        ]
      );
      return;
    }

    setShowCamera(true);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImageUri(asset.uri);
        setDocumentName(asset.name || 'Imported Document');
        setDocumentSubject(currentSubject || '');
        setShowDocumentForm(true);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to import document');
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      setCapturedImageUri(photo.uri);
      setShowCamera(false);
      
      // Auto-populate form
      const timestamp = new Date().toLocaleString();
      setDocumentName(`Scan ${timestamp}`);
      setDocumentSubject(currentSubject || '');
      setDocumentTags('');
      setDocumentNotes('');
      setShowDocumentForm(true);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const saveDocument = async () => {
    if (!capturedImageUri || !documentName.trim()) {
      Alert.alert('Error', 'Please provide a document name');
      return;
    }

    try {
      setIsSaving(true);
      
      const documentData = {
        name: documentName.trim(),
        subject: documentSubject.trim(),
        tags: documentTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        metadata: {
          notes: documentNotes.trim(),
          quality: 'good', // Could be determined by image analysis
          scannedAt: new Date().toISOString(),
        },
      };

      const savedDocument = await DocumentStorage.saveDocument(capturedImageUri, documentData);
      
      if (savedDocument) {
        // Add to scan history
        await DocumentStorage.addScanToHistory({
          documentId: savedDocument.id,
          documentName: savedDocument.name,
          subject: savedDocument.subject,
          success: true,
        });

        Alert.alert(
          'Document Saved!',
          'Your document has been successfully saved and organized.',
          [{ text: 'OK' }]
        );

        // Refresh documents list
        loadDocuments();
        loadDocumentStats();
        
        // Reset form
        resetDocumentForm();
      } else {
        Alert.alert('Error', 'Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert('Error', 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const resetDocumentForm = () => {
    setShowDocumentForm(false);
    setCapturedImageUri(null);
    setDocumentName('');
    setDocumentSubject('');
    setDocumentTags('');
    setDocumentNotes('');
  };

  const deleteDocument = async (documentId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await DocumentStorage.deleteDocument(documentId);
              if (success) {
                loadDocuments();
                loadDocumentStats();
              } else {
                Alert.alert('Error', 'Failed to delete document');
              }
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderDocumentItem = ({ item: document }) => (
    <View style={[globalStyles.card, { marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Document Thumbnail */}
        <View style={{
          width: 60,
          height: 80,
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {document.thumbnailPath ? (
            <Image
              source={{ uri: document.thumbnailPath }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 8,
              }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="document-text"
              size={24}
              color={theme.colors.textTertiary}
            />
          )}
        </View>

        {/* Document Info */}
        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
            {document.name}
          </Text>
          
          {document.subject && (
            <Text style={[globalStyles.textSecondary, { marginBottom: 4 }]}>
              📚 {document.subject}
            </Text>
          )}
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={[globalStyles.textTertiary, { marginRight: 12 }]}>
              {formatDate(document.createdAt)}
            </Text>
            {document.size && (
              <Text style={globalStyles.textTertiary}>
                {formatFileSize(document.size)}
              </Text>
            )}
          </View>

          {document.tags && document.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {document.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                    marginRight: 6,
                    marginBottom: 4,
                  }}
                >
                  <Text style={[globalStyles.textTertiary, { fontSize: 10 }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        <Pressable
          onPress={() => deleteDocument(document.id)}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 20,
              backgroundColor: pressed ? theme.colors.error : `${theme.colors.error}20`,
            },
          ]}
        >
          <Ionicons 
            name="trash" 
            size={16} 
            color={theme.colors.error}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading3, { marginBottom: 8 }]}>
            Document Scanner
          </Text>
          <Text style={globalStyles.textSecondary}>
            Scan, organize, and manage your study documents
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 12,
          marginBottom: 24,
        }}>
          <Pressable
            onPress={handlePickDocument}
            style={({ pressed }) => [
              globalStyles.buttonSecondary,
              { flex: 1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="folder" 
                size={20} 
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={globalStyles.buttonTextSecondary}>Import File</Text>
            </View>
          </Pressable>
        </View>

        {/* Document Statistics */}
        {documentStats && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
              Document Library
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              gap: 12,
              marginBottom: 12,
            }}>
              <MetricCard
                title="Total Documents"
                value={documentStats.totalDocuments}
                icon="folder"
                color={theme.colors.primary}
                style={{ flex: 1 }}
                size="small"
              />
              
              <MetricCard
                title="This Week"
                value={documentStats.documentsThisWeek}
                icon="calendar"
                color={theme.colors.success}
                style={{ flex: 1 }}
                size="small"
                trend={documentStats.documentsThisWeek > 0 ? 'up' : 'stable'}
              />
            </View>

            <View style={{ 
              flexDirection: 'row', 
              gap: 12,
            }}>
              <MetricCard
                title="Storage Used"
                value={documentStats.formattedTotalSize || '0 KB'}
                icon="archive"
                color={theme.colors.info}
                style={{ flex: 1 }}
                size="small"
                subtitle={`${documentStats.totalDocuments} files`}
              />
              
              <MetricCard
                title="Average Size"
                value={documentStats.formattedAverageSize || '0 KB'}
                icon="document"
                color={theme.colors.warning}
                style={{ flex: 1 }}
                size="small"
              />
            </View>
          </View>
        )}

        {/* Subject Breakdown */}
        {documentStats && Object.keys(documentStats.subjectBreakdown || {}).length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
              Documents by Subject
            </Text>
            
            {Object.entries(documentStats.subjectBreakdown).map(([subject, count]) => (
              <View key={subject} style={[globalStyles.card, { 
                flexDirection: 'row', 
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                padding: 12,
              }]}>
                <Text style={[globalStyles.text, { fontWeight: '500' }]}>
                  📚 {subject}
                </Text>
                <Text style={[globalStyles.textSecondary]}>
                  {count} {count === 1 ? 'document' : 'documents'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Documents */}
        <View style={{ marginBottom: 24 }}>
          <View style={[globalStyles.spaceBetween, { marginBottom: 16 }]}>
            <Text style={globalStyles.heading5}>
              Recent Documents
            </Text>
            <Pressable
              onPress={loadDocuments}
              style={({ pressed }) => [
                {
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: pressed ? theme.colors.surface : 'transparent',
                },
              ]}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={theme.colors.primary}
              />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={[globalStyles.centeredContent, { height: 100 }]}>
              <Text style={globalStyles.textSecondary}>Loading documents...</Text>
            </View>
          ) : documents.length === 0 ? (
            <View style={[globalStyles.centeredContent, { height: 200 }]}>
              <Ionicons 
                name="document-outline" 
                size={48} 
                color={theme.colors.textTertiary}
                style={{ marginBottom: 16 }}
              />
              <Text style={[globalStyles.heading6, { marginBottom: 8 }]}>
                No Documents Yet
              </Text>
              <Text style={[globalStyles.textSecondary, { textAlign: 'center' }]}>
                Start by scanning your first document or importing existing files
              </Text>
            </View>
          ) : (
            <FlatList
              data={documents.slice(0, 10)} // Show recent 10
              renderItem={renderDocumentItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Scanning Tips */}
        <View style={[globalStyles.card, { 
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.info,
        }]}>
          <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 12 }]}>
            📄 Scanning Tips
          </Text>
          
          <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
            • Ensure good lighting for clear scans{'\n'}
            • Keep the document flat and within the camera frame{'\n'}
            • Use consistent naming for easy organization{'\n'}
            • Add relevant tags to make documents searchable{'\n'}
            • Group related documents by subject
          </Text>
        </View>
      </ScrollView>

      {/* Quick Scan FAB */}
      <FloatingActionButton
        onPress={handleStartScan}
        icon="camera"
        position="bottom-right"
        size="normal"
        color={theme.colors.success}
      />

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {cameraPermission && (
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
            />
          )}
          
          {/* Camera Controls */}
          <View style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
            <Pressable
              onPress={() => setShowCamera(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 35,
                padding: 15,
              }}
            >
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={capturePhoto}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 40,
                padding: 20,
              }}
            >
              <Ionicons 
                name="camera" 
                size={40} 
                color="#000000" 
              />
            </Pressable>

            <View style={{ width: 70 }} />
          </View>

          {/* Instructions */}
          <View style={{
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 8,
            padding: 16,
          }}>
            <Text style={{
              color: '#FFFFFF',
              textAlign: 'center',
              fontSize: 16,
              marginBottom: 8,
            }}>
              Document Scanner
            </Text>
            <Text style={{
              color: '#FFFFFF',
              textAlign: 'center',
              fontSize: 14,
            }}>
              Position the document within the frame and tap capture
            </Text>
          </View>
        </View>
      </Modal>

      {/* Document Form Modal */}
      <Modal
        visible={showDocumentForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetDocumentForm}
      >
        <SafeAreaView style={[globalStyles.container, { padding: 16 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[globalStyles.spaceBetween, { marginBottom: 24 }]}>
              <Text style={globalStyles.heading4}>
                Save Document
              </Text>
              
              <Pressable
                onPress={resetDocumentForm}
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

            {/* Preview Image */}
            {capturedImageUri && (
              <View style={{ marginBottom: 24 }}>
                <Text style={[globalStyles.text, { marginBottom: 8 }]}>
                  Preview
                </Text>
                <Image
                  source={{ uri: capturedImageUri }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surface,
                  }}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Document Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[globalStyles.text, { marginBottom: 8 }]}>
                Document Name *
              </Text>
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
              <Text style={[globalStyles.text, { marginBottom: 8 }]}>
                Subject
              </Text>
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
              <Text style={[globalStyles.text, { marginBottom: 8 }]}>
                Tags (comma-separated)
              </Text>
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
              <Text style={[globalStyles.text, { marginBottom: 8 }]}>
                Notes (Optional)
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
                onPress={resetDocumentForm}
                style={({ pressed }) => [
                  globalStyles.buttonSecondary,
                  { flex: 1 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={globalStyles.buttonTextSecondary}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveDocument}
                disabled={isSaving || !documentName.trim()}
                style={({ pressed }) => [
                  globalStyles.button,
                  { flex: 1 },
                  (isSaving || !documentName.trim()) && globalStyles.buttonDisabled,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[
                  globalStyles.buttonText,
                  (isSaving || !documentName.trim()) && globalStyles.buttonTextDisabled,
                ]}>
                  {isSaving ? 'Saving...' : 'Save Document'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}