import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Timer, Settings as SettingsIcon, BookOpen, Zap } from 'lucide-react-native';
import { useTimer } from '@/components/TimerProvider';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { currentTimer, timerState } = useTimer();

  const QuickAccessCard = ({ title, description, icon: Icon, onPress, color }: {
    title: string;
    description: string;
    icon: any;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity style={styles.quickAccessCard} onPress={onPress}>
      <LinearGradient
        colors={[color, color + '80']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon size={32} color="#FFFFFF" />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      
        <View style={styles.header}>
          <Text style={styles.title}>Focus Timer</Text>
          <Text style={styles.subtitle}>Your productivity companion</Text>
        </View>
<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentTimer && (
          <View style={styles.currentTimerSection}>
            <Text style={styles.sectionTitle}>Active Timer</Text>
            <TouchableOpacity 
              style={styles.currentTimerCard}
              onPress={() => {
                if (currentTimer.type === 'sequence') {
                  router.push('/custom-timer');
                } else {
                  router.push('/pomodoro');
                }
              }}
            >
              <LinearGradient
                colors={[currentTimer.color, currentTimer.color + '80']}
                style={styles.currentTimerGradient}
              >
                <View style={styles.currentTimerHeader}>
                  <Text style={styles.currentTimerEmoji}>{currentTimer.emoji}</Text>
                  <View style={styles.currentTimerInfo}>
                    <Text style={styles.currentTimerName}>{currentTimer.name}</Text>
                    <Text style={styles.currentTimerStatus}>
                      {timerState.isRunning ? 'Running' : 'Paused'} • {Math.floor(timerState.timeLeft / 60)}:{(timerState.timeLeft % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.currentTimerCycle}>
                  {currentTimer.type === 'sequence' ? 'Segment' : 'Cycle'} {timerState.currentCycle}/{timerState.totalCycles}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <QuickAccessCard
              title="Pomodoro Timers"
              description="Traditional focus sessions with breaks"
              icon={Timer}
              color="#FF6B35"
              onPress={() => router.push('/timers')}
            />
            <QuickAccessCard
              title="Custom Timers"
              description="Create your own timer sequences"
              icon={Zap}
              color="#4ECDC4"
              onPress={() => router.push('/custom')}
            />
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0h</Text>
              <Text style={styles.statLabel}>Focus Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Breaks</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => router.push('/settings')}
      >
        <SettingsIcon size={24} color="#94A3B8" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  currentTimerSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  currentTimerCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentTimerGradient: {
    padding: 20,
  },
  currentTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentTimerEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  currentTimerInfo: {
    flex: 1,
  },
  currentTimerName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  currentTimerStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  currentTimerCycle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  quickAccessSection: {
    marginBottom: 30,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickAccessCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});