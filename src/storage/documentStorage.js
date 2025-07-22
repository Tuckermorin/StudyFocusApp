// src/storage/documentStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { randomUUID } from 'expo-crypto';

// Storage keys
const STORAGE_KEYS = {
  DOCUMENTS: '@study_focus_documents',
  DOCUMENT_METADATA: '@study_focus_document_metadata',
  SCAN_HISTORY: '@study_focus_scan_history',
  COLLECTIONS: '@study_focus_collections',
};

// Document directories
const DOCUMENT_DIRS = {
  SCANS: `${FileSystem.documentDirectory}scans/`,
  NOTES: `${FileSystem.documentDirectory}notes/`,
  TEMP: `${FileSystem.documentDirectory}temp/`,
};

// Document structure
export const createDocument = (overrides = {}) => ({
  id: randomUUID(),
  name: '',
  type: 'scan', // 'scan', 'note', 'photo'
  subject: '',
  filePath: '',
  thumbnailPath: '',
  size: 0,
  mimeType: 'image/jpeg',
  tags: [],
  studySessionId: null,
  metadata: {
    scannedAt: new Date().toISOString(),
    quality: 'good', // 'poor', 'good', 'excellent'
    pages: 1,
    textContent: null, // For future OCR implementation
    notes: '',
  },
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  ...overrides,
});

// Collection structure for organizing documents
export const createCollection = (overrides = {}) => ({
  id: randomUUID(),
  name: '',
  description: '',
  color: '#4285f4',
  subject: '',
  documentIds: [],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  ...overrides,
});

class DocumentStorage {
  constructor() {
    this.initializeDirectories();
  }

  // Initialize document directories
  async initializeDirectories() {
    try {
      for (const dir of Object.values(DOCUMENT_DIRS)) {
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }
      }
    } catch (error) {
      console.error('Error initializing directories:', error);
    }
  }

  // === DOCUMENT MANAGEMENT ===

  // Save a scanned document
  async saveDocument(imageUri, documentData) {
    try {
      const document = createDocument(documentData);
      
      // Generate file paths
      const fileName = `${document.id}.jpg`;
      const filePath = `${DOCUMENT_DIRS.SCANS}${fileName}`;
      const thumbnailPath = `${DOCUMENT_DIRS.SCANS}thumb_${fileName}`;
      
      // Move the image to permanent storage
      await FileSystem.moveAsync({
        from: imageUri,
        to: filePath,
      });
      
      // Create thumbnail (resize to 200x200)
      await this.createThumbnail(filePath, thumbnailPath);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      // Update document with file information
      document.filePath = filePath;
      document.thumbnailPath = thumbnailPath;
      document.size = fileInfo.size;
      
      // Save document metadata
      await this.saveDocumentMetadata(document);
      
      return document;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  // Create thumbnail for document
  async createThumbnail(originalPath, thumbnailPath) {
    try {
      // For now, just copy the original file as thumbnail
      // In a real app, you'd use an image processing library to resize
      await FileSystem.copyAsync({
        from: originalPath,
        to: thumbnailPath,
      });
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      // Don't throw - thumbnails are optional
    }
  }

  // Save document metadata
  async saveDocumentMetadata(document) {
    try {
      const documents = await this.getAllDocuments();
      const existingIndex = documents.findIndex(d => d.id === document.id);
      
      if (existingIndex >= 0) {
        documents[existingIndex] = { ...document, lastModified: new Date().toISOString() };
      } else {
        documents.push(document);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
      return true;
    } catch (error) {
      console.error('Error saving document metadata:', error);
      return false;
    }
  }

  // Get all documents
  async getAllDocuments() {
    try {
      const documentsJson = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (documentsJson) {
        const documents = JSON.parse(documentsJson);
        return documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return [];
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  // Get document by ID
  async getDocumentById(documentId) {
    try {
      const documents = await this.getAllDocuments();
      return documents.find(doc => doc.id === documentId) || null;
    } catch (error) {
      console.error('Error getting document by ID:', error);
      return null;
    }
  }

  // Get documents by subject
  async getDocumentsBySubject(subject) {
    try {
      const documents = await this.getAllDocuments();
      return documents.filter(doc => 
        doc.subject.toLowerCase() === subject.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting documents by subject:', error);
      return [];
    }
  }

  // Get documents by study session
  async getDocumentsBySession(sessionId) {
    try {
      const documents = await this.getAllDocuments();
      return documents.filter(doc => doc.studySessionId === sessionId);
    } catch (error) {
      console.error('Error getting documents by session:', error);
      return [];
    }
  }

  // Search documents by name or tags
  async searchDocuments(searchTerm) {
    try {
      const documents = await this.getAllDocuments();
      const term = searchTerm.toLowerCase();
      
      return documents.filter(doc => 
        doc.name.toLowerCase().includes(term) ||
        doc.subject.toLowerCase().includes(term) ||
        doc.tags.some(tag => tag.toLowerCase().includes(term)) ||
        (doc.metadata.notes && doc.metadata.notes.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  // Update document
  async updateDocument(documentId, updates) {
    try {
      const documents = await this.getAllDocuments();
      const documentIndex = documents.findIndex(d => d.id === documentId);
      
      if (documentIndex >= 0) {
        documents[documentIndex] = {
          ...documents[documentIndex],
          ...updates,
          lastModified: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
        return documents[documentIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Error updating document:', error);
      return null;
    }
  }

  // Delete document
  async deleteDocument(documentId) {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) return false;
      
      // Delete files from filesystem
      try {
        if (document.filePath) {
          await FileSystem.deleteAsync(document.filePath);
        }
        if (document.thumbnailPath) {
          await FileSystem.deleteAsync(document.thumbnailPath);
        }
      } catch (fileError) {
        console.warn('Error deleting document files:', fileError);
        // Continue with metadata deletion even if file deletion fails
      }
      
      // Remove from metadata
      const documents = await this.getAllDocuments();
      const filteredDocuments = documents.filter(d => d.id !== documentId);
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filteredDocuments));
      
      // Remove from collections
      await this.removeDocumentFromAllCollections(documentId);
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // === COLLECTIONS ===

  // Create collection
  async createDocumentCollection(collectionData) {
    try {
      const collection = createCollection(collectionData);
      await this.saveCollection(collection);
      return collection;
    } catch (error) {
      console.error('Error creating collection:', error);
      return null;
    }
  }

  // Save collection
  async saveCollection(collection) {
    try {
      const collections = await this.getAllCollections();
      const existingIndex = collections.findIndex(c => c.id === collection.id);
      
      if (existingIndex >= 0) {
        collections[existingIndex] = { ...collection, lastModified: new Date().toISOString() };
      } else {
        collections.push(collection);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      return true;
    } catch (error) {
      console.error('Error saving collection:', error);
      return false;
    }
  }

  // Get all collections
  async getAllCollections() {
    try {
      const collectionsJson = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (collectionsJson) {
        return JSON.parse(collectionsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting collections:', error);
      return [];
    }
  }

  // Add document to collection
  async addDocumentToCollection(collectionId, documentId) {
    try {
      const collections = await this.getAllCollections();
      const collection = collections.find(c => c.id === collectionId);
      
      if (collection && !collection.documentIds.includes(documentId)) {
        collection.documentIds.push(documentId);
        collection.lastModified = new Date().toISOString();
        await this.saveCollection(collection);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding document to collection:', error);
      return false;
    }
  }

  // Remove document from collection
  async removeDocumentFromCollection(collectionId, documentId) {
    try {
      const collections = await this.getAllCollections();
      const collection = collections.find(c => c.id === collectionId);
      
      if (collection) {
        collection.documentIds = collection.documentIds.filter(id => id !== documentId);
        collection.lastModified = new Date().toISOString();
        await this.saveCollection(collection);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error removing document from collection:', error);
      return false;
    }
  }

  // Remove document from all collections
  async removeDocumentFromAllCollections(documentId) {
    try {
      const collections = await this.getAllCollections();
      let updated = false;
      
      for (const collection of collections) {
        if (collection.documentIds.includes(documentId)) {
          collection.documentIds = collection.documentIds.filter(id => id !== documentId);
          collection.lastModified = new Date().toISOString();
          updated = true;
        }
      }
      
      if (updated) {
        await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      }
      
      return true;
    } catch (error) {
      console.error('Error removing document from all collections:', error);
      return false;
    }
  }

  // Get documents in collection
  async getCollectionDocuments(collectionId) {
    try {
      const collections = await this.getAllCollections();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) return [];
      
      const allDocuments = await this.getAllDocuments();
      return allDocuments.filter(doc => collection.documentIds.includes(doc.id));
    } catch (error) {
      console.error('Error getting collection documents:', error);
      return [];
    }
  }

  // === SCAN HISTORY ===

  // Add scan to history
  async addScanToHistory(scanData) {
    try {
      const history = await this.getScanHistory();
      history.unshift({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ...scanData,
      });
      
      // Keep only last 50 scans in history
      if (history.length > 50) {
        history.splice(50);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error adding scan to history:', error);
      return false;
    }
  }

  // Get scan history
  async getScanHistory() {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
      if (historyJson) {
        return JSON.parse(historyJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting scan history:', error);
      return [];
    }
  }

  // === STATISTICS ===

  // Get document statistics
  async getDocumentStats() {
    try {
      const documents = await this.getAllDocuments();
      const collections = await this.getAllCollections();
      const scanHistory = await this.getScanHistory();
      
      // Basic counts
      const stats = {
        totalDocuments: documents.length,
        totalCollections: collections.length,
        totalScans: scanHistory.length,
        
        // By type
        documentTypes: {
          scans: documents.filter(d => d.type === 'scan').length,
          notes: documents.filter(d => d.type === 'note').length,
          photos: documents.filter(d => d.type === 'photo').length,
        },
        
        // By subject
        subjectBreakdown: {},
        
        // By quality
        qualityBreakdown: {
          poor: documents.filter(d => d.metadata.quality === 'poor').length,
          good: documents.filter(d => d.metadata.quality === 'good').length,
          excellent: documents.filter(d => d.metadata.quality === 'excellent').length,
        },
        
        // Storage usage
        totalFileSize: 0,
        averageFileSize: 0,
        
        // Recent activity
        documentsThisWeek: 0,
        documentsThisMonth: 0,
      };
      
      // Calculate subject breakdown and file sizes
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      documents.forEach(doc => {
        // Subject breakdown
        if (doc.subject) {
          stats.subjectBreakdown[doc.subject] = (stats.subjectBreakdown[doc.subject] || 0) + 1;
        }
        
        // File sizes
        stats.totalFileSize += doc.size || 0;
        
        // Recent activity
        const createdAt = new Date(doc.createdAt);
        if (createdAt > oneWeekAgo) {
          stats.documentsThisWeek++;
        }
        if (createdAt > oneMonthAgo) {
          stats.documentsThisMonth++;
        }
      });
      
      // Calculate average file size
      if (documents.length > 0) {
        stats.averageFileSize = Math.round(stats.totalFileSize / documents.length);
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      return null;
    }
  }

  // Get storage usage info
  async getStorageUsage() {
    try {
      const documents = await this.getAllDocuments();
      let totalSize = 0;
      let thumbnailSize = 0;
      
      for (const doc of documents) {
        // Add document file size
        if (doc.filePath) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(doc.filePath);
            if (fileInfo.exists) {
              totalSize += fileInfo.size;
            }
          } catch (error) {
            console.warn('Error getting file size for:', doc.filePath);
          }
        }
        
        // Add thumbnail size
        if (doc.thumbnailPath) {
          try {
            const thumbInfo = await FileSystem.getInfoAsync(doc.thumbnailPath);
            if (thumbInfo.exists) {
              thumbnailSize += thumbInfo.size;
            }
          } catch (error) {
            console.warn('Error getting thumbnail size for:', doc.thumbnailPath);
          }
        }
      }
      
      return {
        totalDocuments: documents.length,
        totalFileSize: totalSize,
        thumbnailSize: thumbnailSize,
        totalSize: totalSize + thumbnailSize,
        averageDocumentSize: documents.length > 0 ? Math.round(totalSize / documents.length) : 0,
        formattedTotalSize: this.formatFileSize(totalSize + thumbnailSize),
        formattedAverageSize: this.formatFileSize(documents.length > 0 ? totalSize / documents.length : 0),
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return null;
    }
  }

  // === UTILITY METHODS ===

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clean up orphaned files (files without metadata)
  async cleanupOrphanedFiles() {
    try {
      const documents = await this.getAllDocuments();
      const validFilePaths = new Set();
      
      // Collect all valid file paths
      documents.forEach(doc => {
        if (doc.filePath) validFilePaths.add(doc.filePath);
        if (doc.thumbnailPath) validFilePaths.add(doc.thumbnailPath);
      });
      
      // Check scan directory for orphaned files
      const scanDirInfo = await FileSystem.getInfoAsync(DOCUMENT_DIRS.SCANS);
      if (scanDirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(DOCUMENT_DIRS.SCANS);
        let deletedCount = 0;
        
        for (const fileName of files) {
          const filePath = `${DOCUMENT_DIRS.SCANS}${fileName}`;
          if (!validFilePaths.has(filePath)) {
            try {
              await FileSystem.deleteAsync(filePath);
              deletedCount++;
            } catch (error) {
              console.warn('Error deleting orphaned file:', filePath);
            }
          }
        }
        
        return { deletedFiles: deletedCount };
      }
      
      return { deletedFiles: 0 };
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      return { deletedFiles: 0, error: error.message };
    }
  }

  // Export all document data
  async exportDocumentData() {
    try {
      const documents = await this.getAllDocuments();
      const collections = await this.getAllCollections();
      const scanHistory = await this.getScanHistory();
      const stats = await this.getDocumentStats();
      
      return {
        documents: documents.map(doc => ({
          ...doc,
          // Note: File paths are local and won't be portable
          exportNote: 'File paths are device-specific and not included in export'
        })),
        collections,
        scanHistory,
        statistics: stats,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      console.error('Error exporting document data:', error);
      return null;
    }
  }

  // Clear all document data
  async clearAllDocuments() {
    try {
      // Delete all files
      for (const dir of Object.values(DOCUMENT_DIRS)) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(dir);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(dir);
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          }
        } catch (error) {
          console.warn('Error clearing directory:', dir);
        }
      }
      
      // Clear metadata
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DOCUMENTS,
        STORAGE_KEYS.DOCUMENT_METADATA,
        STORAGE_KEYS.SCAN_HISTORY,
        STORAGE_KEYS.COLLECTIONS,
      ]);
      
      return true;
    } catch (error) {
      console.error('Error clearing all documents:', error);
      return false;
    }
  }

  // Get documents modified since date
  async getDocumentsModifiedSince(date) {
    try {
      const documents = await this.getAllDocuments();
      return documents.filter(doc => new Date(doc.lastModified) > date);
    } catch (error) {
      console.error('Error getting documents modified since date:', error);
      return [];
    }
  }

  // Backup documents metadata to AsyncStorage
  async backupMetadata() {
    try {
      const backup = {
        documents: await this.getAllDocuments(),
        collections: await this.getAllCollections(),
        scanHistory: await this.getScanHistory(),
        backupDate: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('@study_focus_document_backup', JSON.stringify(backup));
      return true;
    } catch (error) {
      console.error('Error backing up metadata:', error);
      return false;
    }
  }

  // Restore documents metadata from backup
  async restoreMetadata() {
    try {
      const backupJson = await AsyncStorage.getItem('@study_focus_document_backup');
      if (!backupJson) return false;
      
      const backup = JSON.parse(backupJson);
      
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(backup.documents || []));
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(backup.collections || []));
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(backup.scanHistory || []));
      
      return true;
    } catch (error) {
      console.error('Error restoring metadata:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new DocumentStorage();