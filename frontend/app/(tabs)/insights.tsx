import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Insights() {
  const { token } = useAuth();
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/insights/patterns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInsights();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      case 'stable':
        return 'remove';
      case 'good':
        return 'checkmark-circle';
      case 'needs_improvement':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '#EF4444';
      case 'decreasing':
        return '#10B981';
      case 'stable':
        return '#6366F1';
      case 'good':
        return '#10B981';
      case 'needs_improvement':
        return '#F59E0B';
      default:
        return '#94A3B8';
    }
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
        <Text style={styles.headerTitle}>Health Insights</Text>
        <Text style={styles.headerSubtitle}>AI-powered pattern analysis</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        {insights && (
          <>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#6366F120' }]}>
                  <Ionicons name="calendar" size={24} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{insights.total_entries}</Text>
                <Text style={styles.statLabel}>Total Entries</Text>
                <Text style={styles.statPeriod}>Last 30 days</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="medkit" size={24} color="#EF4444" />
                </View>
                <Text style={styles.statValue}>{insights.symptoms_this_month}</Text>
                <Text style={styles.statLabel}>Symptoms</Text>
                <Text style={styles.statPeriod}>This month</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="happy" size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{insights.stress_free_days}</Text>
                <Text style={styles.statLabel}>Stress-Free</Text>
                <Text style={styles.statPeriod}>Days</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#06B6D420' }]}>
                  <Ionicons name="water" size={24} color="#06B6D4" />
                </View>
                <Text style={styles.statValue}>{insights.hydration_logs}</Text>
                <Text style={styles.statLabel}>Hydration</Text>
                <Text style={styles.statPeriod}>Logs</Text>
              </View>
            </View>

            {/* Trends Card */}
            <View style={styles.trendsCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="analytics" size={24} color="#6366F1" />
                <Text style={styles.cardTitle}>Health Trends</Text>
              </View>

              <View style={styles.trendItem}>
                <View style={styles.trendLeft}>
                  <Ionicons
                    name={getTrendIcon(insights.trends.symptom_trend)}
                    size={20}
                    color={getTrendColor(insights.trends.symptom_trend)}
                  />
                  <Text style={styles.trendLabel}>Symptom Pattern</Text>
                </View>
                <Text
                  style={[
                    styles.trendValue,
                    { color: getTrendColor(insights.trends.symptom_trend) },
                  ]}
                >
                  {insights.trends.symptom_trend.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <View style={styles.trendDivider} />

              <View style={styles.trendItem}>
                <View style={styles.trendLeft}>
                  <Ionicons
                    name={getTrendIcon(insights.trends.hydration_trend)}
                    size={20}
                    color={getTrendColor(insights.trends.hydration_trend)}
                  />
                  <Text style={styles.trendLabel}>Hydration Level</Text>
                </View>
                <Text
                  style={[
                    styles.trendValue,
                    { color: getTrendColor(insights.trends.hydration_trend) },
                  ]}
                >
                  {insights.trends.hydration_trend.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {/* AI Insights Card */}
            <View style={styles.aiInsightsCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="sparkles" size={24} color="#F59E0B" />
                <Text style={styles.cardTitle}>AI Insights</Text>
              </View>
              <Text style={styles.aiInsightsText}>{insights.ai_insights}</Text>
            </View>

            {/* Streaks Card */}
            {insights.stress_free_days >= 5 && (
              <View style={styles.streakCard}>
                <View style={styles.streakIcon}>
                  <Ionicons name="flame" size={32} color="#F59E0B" />
                </View>
                <View style={styles.streakContent}>
                  <Text style={styles.streakTitle}>Amazing Streak! 🎉</Text>
                  <Text style={styles.streakText}>
                    You've maintained {insights.stress_free_days} stress-free days. Keep it up!
                  </Text>
                </View>
              </View>
            )}

            {/* Tips Card */}
            <View style={styles.tipsCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="bulb" size={24} color="#6366F1" />
                <Text style={styles.cardTitle}>Quick Tips</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.tipText}>Track your mood daily for better insights</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.tipText}>Stay hydrated throughout the day</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.tipText}>Regular exercise improves overall health</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statPeriod: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  trendsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  trendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendLabel: {
    fontSize: 15,
    color: '#F1F5F9',
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  trendDivider: {
    height: 1,
    backgroundColor: '#334155',
  },
  aiInsightsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B30',
  },
  aiInsightsText: {
    fontSize: 15,
    color: '#F1F5F9',
    lineHeight: 24,
  },
  streakCard: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  streakIcon: {
    marginRight: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#F1F5F9',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});
