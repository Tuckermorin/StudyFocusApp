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
import DocumentItem from '../src/components/DocumentItem';
import DocumentFormModal from '../src/components/DocumentFormModal';

// Helper to format file sizes
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to format dates for display
export const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
              renderItem={({ item }) => (
                <DocumentItem
                  document={item}
                  onDelete={deleteDocument}
                  formatFileSize={formatFileSize}
                  formatDate={formatDate}
                />
              )}
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

      <DocumentFormModal
        visible={showDocumentForm}
        onClose={resetDocumentForm}
        onSave={saveDocument}
        isSaving={isSaving}
        capturedImageUri={capturedImageUri}
        documentName={documentName}
        setDocumentName={setDocumentName}
        documentSubject={documentSubject}
        setDocumentSubject={setDocumentSubject}
        documentTags={documentTags}
        setDocumentTags={setDocumentTags}
        documentNotes={documentNotes}
        setDocumentNotes={setDocumentNotes}
      />
    </SafeAreaView>
  );
}