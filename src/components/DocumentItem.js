// src/components/DocumentItem.js
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DocumentItem({ document, onDelete, formatFileSize, formatDate, style = {} }) {
  const { theme, globalStyles } = useTheme();

  return (
    <View style={[globalStyles.card, { marginBottom: 12 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Document Thumbnail */}
        <View
          style={{
            width: 60,
            height: 80,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            marginRight: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {document.thumbnailPath ? (
            <Image
              source={{ uri: document.thumbnailPath }}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="document-text" size={24} color={theme.colors.textTertiary} />
          )}
        </View>

        {/* Document Info */}
        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>{document.name}</Text>

          {document.subject && (
            <Text style={[globalStyles.textSecondary, { marginBottom: 4 }]}>📚 {document.subject}</Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={[globalStyles.textTertiary, { marginRight: 12 }]}>
              {formatDate(document.createdAt)}
            </Text>
            {document.size && (
              <Text style={globalStyles.textTertiary}>{formatFileSize(document.size)}</Text>
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
                  <Text style={[globalStyles.textTertiary, { fontSize: 10 }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        <Pressable
          onPress={() => onDelete(document.id)}
          style={({ pressed }) => [
            {
              padding: 8,
              borderRadius: 20,
              backgroundColor: pressed ? theme.colors.error : `${theme.colors.error}20`,
            },
          ]}
        >
          <Ionicons name="trash" size={16} color={theme.colors.error} />
        </Pressable>
      </View>
    </View>
  );
}
