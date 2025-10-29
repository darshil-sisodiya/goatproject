import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

const bodyParts = [
  { id: 'head', label: 'Head', icon: 'head' as keyof typeof Ionicons.glyphMap, position: { top: 50, left: '42%' } },
  { id: 'neck', label: 'Neck', icon: 'resize' as keyof typeof Ionicons.glyphMap, position: { top: 120, left: '42%' } },
  { id: 'chest', label: 'Chest', icon: 'square' as keyof typeof Ionicons.glyphMap, position: { top: 170, left: '42%' } },
  { id: 'stomach', label: 'Stomach', icon: 'ellipse' as keyof typeof Ionicons.glyphMap, position: { top: 240, left: '42%' } },
  { id: 'left_shoulder', label: 'Left Shoulder', icon: 'radio-button-on' as keyof typeof Ionicons.glyphMap, position: { top: 150, left: '20%' } },
  { id: 'right_shoulder', label: 'Right Shoulder', icon: 'radio-button-on' as keyof typeof Ionicons.glyphMap, position: { top: 150, left: '64%' } },
  { id: 'left_arm', label: 'Left Arm', icon: 'remove' as keyof typeof Ionicons.glyphMap, position: { top: 200, left: '15%' } },
  { id: 'right_arm', label: 'Right Arm', icon: 'remove' as keyof typeof Ionicons.glyphMap, position: { top: 200, left: '69%' } },
  { id: 'left_leg', label: 'Left Leg', icon: 'remove' as keyof typeof Ionicons.glyphMap, position: { top: 330, left: '35%' }, rotate: 90 },
  { id: 'right_leg', label: 'Right Leg', icon: 'remove' as keyof typeof Ionicons.glyphMap, position: { top: 330, left: '49%' }, rotate: 90 },
  { id: 'back', label: 'Back', icon: 'square' as keyof typeof Ionicons.glyphMap, position: { top: 170, left: '90%' } },
];

export default function BodyMap() {
  const { token } = useAuth();
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [painLevel, setPainLevel] = useState(3);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  const handleBodyPartPress = (partId: string) => {
    setSelectedPart(partId);
    setModalVisible(true);
  };

  const handleAnalyze = async () => {
    if (!selectedPart) return;

    setIsAnalyzing(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/bodymap/analyze`,
        {
          body_part: selectedPart,
          pain_level: painLevel,
          description: description.trim() || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalysisResult(response.data);
      setModalVisible(false);
      setResultModalVisible(true);
      setPainLevel(3);
      setDescription('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to analyze symptom');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#EF4444';
      case 'moderate':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6366F1';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Body Map</Text>
        <Text style={styles.headerSubtitle}>Tap where it hurts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.bodyContainer}>
          <View style={styles.bodyOutline}>
            {/* Front View */}
            <View style={styles.frontView}>
              <Text style={styles.viewLabel}>Front</Text>
              {bodyParts
                .filter((part) => part.id !== 'back')
                .map((part) => (
                  <TouchableOpacity
                    key={part.id}
                    style={[
                      styles.bodyPart,
                      {
                        top: part.position.top,
                        left: part.position.left,
                      },
                    ]}
                    onPress={() => handleBodyPartPress(part.id)}
                  >
                    <View style={styles.bodyPartCircle}>
                      <Ionicons name={part.icon} size={24} color="#6366F1" />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Back View */}
            <View style={styles.backView}>
              <Text style={styles.viewLabel}>Back</Text>
              {bodyParts
                .filter((part) => part.id === 'back')
                .map((part) => (
                  <TouchableOpacity
                    key={part.id}
                    style={[
                      styles.bodyPart,
                      {
                        top: part.position.top,
                        left: '30%',
                      },
                    ]}
                    onPress={() => handleBodyPartPress(part.id)}
                  >
                    <View style={styles.bodyPartCircle}>
                      <Ionicons name={part.icon} size={24} color="#6366F1" />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Pain Scale</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Low (1-2)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Moderate (3-4)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>High (5)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6366F1" />
          <Text style={styles.infoText}>
            Tap any body part to log symptoms and get AI-powered insights about possible causes and remedies.
          </Text>
        </View>
      </ScrollView>

      {/* Symptom Input Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPart ? bodyParts.find((p) => p.id === selectedPart)?.label : 'Symptom'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Pain Level: {painLevel}/5</Text>
            <View style={styles.painLevelContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.painLevelButton,
                    painLevel === level && styles.painLevelButtonActive,
                    {
                      backgroundColor:
                        painLevel === level
                          ? level <= 2
                            ? '#10B981'
                            : level <= 4
                            ? '#F59E0B'
                            : '#EF4444'
                          : '#0F172A',
                    },
                  ]}
                  onPress={() => setPainLevel(level)}
                >
                  <Text
                    style={[
                      styles.painLevelText,
                      painLevel === level && styles.painLevelTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe what you're feeling..."
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Get AI Analysis</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Analysis Result Modal */}
      <Modal visible={resultModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Analysis</Text>
              <TouchableOpacity onPress={() => setResultModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {analysisResult && (
              <ScrollView>
                <View
                  style={[
                    styles.severityBanner,
                    { backgroundColor: getSeverityColor(analysisResult.severity) + '20' },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={24}
                    color={getSeverityColor(analysisResult.severity)}
                  />
                  <Text
                    style={[
                      styles.severityText,
                      { color: getSeverityColor(analysisResult.severity) },
                    ]}
                  >
                    {analysisResult.severity.toUpperCase()} Severity
                  </Text>
                </View>

                <View style={styles.analysisContent}>
                  <Text style={styles.analysisText}>{analysisResult.analysis}</Text>
                </View>

                <View style={styles.disclaimerCard}>
                  <Ionicons name="medical" size={20} color="#F59E0B" />
                  <Text style={styles.disclaimerText}>
                    This is general information only. Always consult a healthcare professional for
                    medical advice.
                  </Text>
                </View>
              </ScrollView>
            )}
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
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  bodyContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  bodyOutline: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  frontView: {
    width: '45%',
    height: 400,
    position: 'relative',
  },
  backView: {
    width: '45%',
    height: 400,
    position: 'relative',
  },
  viewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  bodyPart: {
    position: 'absolute',
  },
  bodyPartCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  legendContainer: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
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
    maxHeight: '75%',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  painLevelContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  painLevelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  painLevelButtonActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  painLevelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  painLevelTextActive: {
    color: '#FFFFFF',
  },
  descriptionInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    color: '#F1F5F9',
    fontSize: 16,
    height: 100,
    marginBottom: 16,
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  severityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  severityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  analysisContent: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 15,
    color: '#F1F5F9',
    lineHeight: 24,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 18,
  },
});
