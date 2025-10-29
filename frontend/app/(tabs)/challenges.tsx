import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';
import { format, differenceInDays } from 'date-fns';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Challenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  completed_days: number;
  is_active: boolean;
  is_completed: boolean;
  badges: string[];
}

const challengeTemplates = [
  {
    type: 'hydration',
    title: '3-Day Hydration Hustle',
    description: 'Drink 8 glasses of water daily',
    duration: 3,
    icon: 'water' as keyof typeof Ionicons.glyphMap,
    color: '#06B6D4',
  },
  {
    type: 'no_sugar',
    title: 'No Sugar Week',
    description: 'Avoid added sugars for 7 days',
    duration: 7,
    icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
    color: '#EF4444',
  },
  {
    type: 'mindful_morning',
    title: 'Mindful Morning Challenge',
    description: '10 minutes of meditation each morning',
    duration: 7,
    icon: 'sunny' as keyof typeof Ionicons.glyphMap,
    color: '#F59E0B',
  },
  {
    type: 'exercise',
    title: '30-Day Fitness Journey',
    description: '30 minutes of exercise daily',
    duration: 30,
    icon: 'fitness' as keyof typeof Ionicons.glyphMap,
    color: '#10B981',
  },
  {
    type: 'sleep',
    title: 'Sleep Master Challenge',
    description: '8 hours of sleep for 14 days',
    duration: 14,
    icon: 'moon' as keyof typeof Ionicons.glyphMap,
    color: '#6366F1',
  },
];

const badgeInfo: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  '3_day_streak': { label: '3 Day Streak', icon: 'flame', color: '#F59E0B' },
  'week_warrior': { label: 'Week Warrior', icon: 'trophy', color: '#EF4444' },
  'challenge_completed': { label: 'Champion', icon: 'ribbon', color: '#6366F1' },
};

export default function Challenges() {
  const { token } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkInModal, setCheckInModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/challenges/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChallenges(response.data);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startChallenge = async (template: typeof challengeTemplates[0]) => {
    setIsSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/challenges/create`,
        {
          challenge_type: template.type,
          title: template.title,
          description: template.description,
          duration_days: template.duration,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalVisible(false);
      loadChallenges();
      Alert.alert('Success', 'Challenge started! Good luck!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to start challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedChallenge) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/challenges/checkin`,
        {
          challenge_id: selectedChallenge.id,
          notes: checkInNotes.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCheckInModal(false);
      setCheckInNotes('');
      loadChallenges();

      Alert.alert(
        'Great Job! 🎉',
        `${response.data.ai_feedback}\n\nCompleted: ${response.data.completed_days} days${response.data.badges.length > 0 ? '\n🏆 New badges earned!' : ''}`,
        [{ text: 'Awesome!' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to check in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderChallenge = (challenge: Challenge) => {
    const template = challengeTemplates.find((t) => t.type === challenge.challenge_type);
    const progress = (challenge.completed_days / challenge.duration_days) * 100;
    const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());

    return (
      <View key={challenge.id} style={styles.challengeCard}>
        <View style={[styles.challengeIcon, { backgroundColor: template?.color + '20' }]}>
          <Ionicons name={template?.icon || 'star'} size={32} color={template?.color} />
        </View>
        <View style={styles.challengeContent}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: template?.color }]} />
            </View>
            <Text style={styles.progressText}>
              {challenge.completed_days}/{challenge.duration_days} days
            </Text>
          </View>

          {challenge.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              {challenge.badges.map((badge) => {
                const badgeData = badgeInfo[badge];
                return (
                  <View key={badge} style={styles.badge}>
                    <Ionicons name={badgeData?.icon} size={16} color={badgeData?.color} />
                    <Text style={styles.badgeText}>{badgeData?.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {!challenge.is_completed && (
            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: template?.color }]}
              onPress={() => {
                setSelectedChallenge(challenge);
                setCheckInModal(true);
              }}
            >
              <Text style={styles.checkInButtonText}>Check In Today</Text>
            </TouchableOpacity>
          )}

          {challenge.is_completed && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.completedText}>Challenge Completed! 🎉</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Challenges</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#475569" />
            <Text style={styles.emptyText}>No active challenges</Text>
            <Text style={styles.emptySubtext}>Start your first challenge!</Text>
            <TouchableOpacity style={styles.startButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.startButtonText}>Browse Challenges</Text>
            </TouchableOpacity>
          </View>
        ) : (
          challenges.map(renderChallenge)
        )}
      </ScrollView>

      {/* Challenge Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Challenge</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {challengeTemplates.map((template) => (
                <TouchableOpacity
                  key={template.type}
                  style={styles.templateCard}
                  onPress={() => startChallenge(template)}
                  disabled={isSubmitting}
                >
                  <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                    <Ionicons name={template.icon} size={32} color={template.color} />
                  </View>
                  <View style={styles.templateContent}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <Text style={styles.templateDuration}>{template.duration} days</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#64748B" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Check-in Modal */}
      <Modal visible={checkInModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Check-In</Text>
              <TouchableOpacity onPress={() => setCheckInModal(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.checkInLabel}>How did today go? (Optional)</Text>
            <TextInput
              style={styles.checkInInput}
              placeholder="Add notes about your progress..."
              placeholderTextColor="#64748B"
              value={checkInNotes}
              onChangeText={setCheckInNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCheckIn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Complete Today's Challenge</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  content: {
    padding: 16,
    flexGrow: 1,
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
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  challengeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  checkInButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
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
    maxHeight: '80%',
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
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  templateDuration: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  checkInLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  checkInInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#F1F5F9',
    fontSize: 16,
    height: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
