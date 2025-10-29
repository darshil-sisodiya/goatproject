import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';
import { format } from 'date-fns';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

type EntryType = 'symptom' | 'mood' | 'medicine' | 'sleep' | 'hydration' | 'note';

interface TimelineEntry {
  id: string;
  entry_type: EntryType;
  title: string;
  description?: string;
  severity?: number;
  tags: string[];
  timestamp: string;
}

const entryTypeConfig: Record<EntryType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  symptom: { icon: 'medkit', color: '#EF4444', label: 'Symptom' },
  mood: { icon: 'happy', color: '#F59E0B', label: 'Mood' },
  medicine: { icon: 'medical', color: '#10B981', label: 'Medicine' },
  sleep: { icon: 'moon', color: '#6366F1', label: 'Sleep' },
  hydration: { icon: 'water', color: '#06B6D4', label: 'Hydration' },
  note: { icon: 'document-text', color: '#8B5CF6', label: 'Note' },
};

export default function Home() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<EntryType>('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    loadEntries();
    loadQuickInsights();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/timeline/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadQuickInsights = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/insights/patterns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries();
  }, []);

  const handleAddEntry = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/timeline/entry`,
        {
          entry_type: selectedType,
          title: title.trim(),
          description: description.trim() || undefined,
          tags: [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setModalVisible(false);
      setTitle('');
      setDescription('');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add entry');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEntry = ({ item }: { item: TimelineEntry }) => {
    const config = entryTypeConfig[item.entry_type];
    return (
      <View style={styles.entryCard}>
        <View style={[styles.entryIcon, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryType}>{config.label}</Text>
            <Text style={styles.entryTime}>{format(new Date(item.timestamp), 'MMM d, h:mm a')}</Text>
          </View>
          <Text style={styles.entryTitle}>{item.title}</Text>
          {item.description && <Text style={styles.entryDescription}>{item.description}</Text>}
        </View>
      </View>
    );
  };

  const renderTypeSelector = () => (
    <View style={styles.typeSelectorContainer}>
      {(Object.keys(entryTypeConfig) as EntryType[]).map((type) => {
        const config = entryTypeConfig[type];
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeOption,
              selectedType === type && { backgroundColor: config.color + '30' },
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Ionicons name={config.icon} size={24} color={config.color} />
            <Text style={[styles.typeLabel, selectedType === type && { color: config.color }]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Timeline</Text>
      </View>

      {insights && insights.symptoms_this_month > 5 && (
        <View style={styles.insightBanner}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.insightText}>
            Headaches increasing lately - try hydrating more!
          </Text>
        </View>
      )}

      {insights && insights.stress_free_days >= 5 && (
        <View style={[styles.insightBanner, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
          <Ionicons name="trophy" size={20} color="#10B981" />
          <Text style={[styles.insightText, { color: '#10B981' }]}>
            Amazing! {insights.stress_free_days}-day stress-free streak! 🎉
          </Text>
        </View>
      )}

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#475569" />
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your health journey</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {renderTypeSelector()}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What happened?"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add more details..."
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSaving}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleAddEntry}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Entry</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  entryTime: {
    fontSize: 12,
    color: '#64748B',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 16,
    color: '#F1F5F9',
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
