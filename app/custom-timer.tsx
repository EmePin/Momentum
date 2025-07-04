import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, ArrowLeft, SkipForward } from 'lucide-react-native';
import { useTimer } from '@/components/TimerProvider';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';


const { width, height } = Dimensions.get('window');
const isLargeScreen = width > 900;
export default function CustomTimerScreen() {
   const isWeb = Platform.OS === 'web';
  
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: isLargeScreen ? 'flex-start' : 'space-between',
        paddingHorizontal: 20,
        paddingTop: isLargeScreen ? height * 0.07 : 60,
        paddingBottom: isLargeScreen ? height * 0.04 : 120,
        backgroundColor: 'transparent',
      },
      backButton: {
        position: 'absolute',
        top: isLargeScreen ? height * 0.07 : 60,
        left: 20,
        zIndex: 10,
        width: isLargeScreen ? 44 : 40,
        height: isLargeScreen ? 44 : 40,
        borderRadius: isLargeScreen ? 22 : 20,
        backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: isLargeScreen ? 2 : 0,
        shadowColor: isLargeScreen ? '#000' : undefined,
        shadowOpacity: isLargeScreen ? 0.1 : undefined,
        shadowRadius: isLargeScreen ? 4 : undefined,
        shadowOffset: isLargeScreen ? { width: 0, height: 2 } : undefined,
      },
      header: {
        alignItems: 'center',
        marginBottom: isLargeScreen ? 24 : 20,
        marginTop: isLargeScreen ? height * 0.08 : 40,
        width: '100%',
        ...(isLargeScreen && { gap: 8 }),
      },
      title: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: '#FFFFFF',
        marginBottom: isLargeScreen ? 4 : 8,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: 18,
        fontFamily: 'Inter-Regular',
        color: '#CBD5E1',
        textAlign: 'center',
      },
      timerInfo: {
        marginTop: isLargeScreen ? 10 : 8,
        paddingHorizontal: isLargeScreen ? 18 : 16,
        paddingVertical: isLargeScreen ? 8 : 6,
        backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.1)',
        borderRadius: isLargeScreen ? 14 : 12,
        alignSelf: 'center',
      },
      timerInfoText: {
        fontSize: isLargeScreen ? 15 : 14,
        fontFamily: 'Inter-Regular',
        color: '#CBD5E1',
        textAlign: 'center',
      },
      timerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
        marginVertical: isLargeScreen ? 10 : 0,
      },
      progressRing: {
        width: isLargeScreen ? width * 0.75 : width * 0.8,
        height: isLargeScreen ? width * 0.75 : width * 0.8,
        borderRadius: isLargeScreen ? (width * 0.75) / 2 : width * 0.4,
        backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: isLargeScreen ? 10 : 0,
      },
      progressBar: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: isLargeScreen ? (width * 0.75) / 2 : width * 0.4,
        opacity: 0.2,
      },
      timerInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: isLargeScreen ? 10 : 0,
        width: '100%',
      },
      timerText: {
        fontSize: 48,
        fontFamily: 'Inter-Bold',
        marginBottom: isLargeScreen ? 6 : 8,
        textAlign: 'center',
      },
      phaseText: {
        fontSize: isLargeScreen ? 17 : 16,
        fontFamily: 'Inter-SemiBold',
        color: '#94A3B8',
        textAlign: 'center',
      },
      controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: isLargeScreen ? '90%' : '100%',
        alignSelf: 'center',
        paddingHorizontal: isLargeScreen ? 20 : 40,
        marginBottom: isLargeScreen ? 30 : 40,
        marginTop: isLargeScreen ? 10 : 0,
        ...(isLargeScreen && { gap: 24 }),
      },
      playButton: {
        marginTop: 0,
        width: 80,
        height: 80,
        borderRadius: 40,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'center',
      },
      playButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
      },
      secondaryButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: isLargeScreen ? 2 : 0,
      },
      stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.1)',
        borderRadius: isLargeScreen ? 18 : 16,
        paddingVertical: isLargeScreen ? 18 : 20,
        paddingHorizontal: isLargeScreen ? 10 : 20,
        marginTop: isLargeScreen ? 10 : 0,
        marginBottom: 0,
        ...(isLargeScreen && { gap: 10 }),
      },
      statItem: {
        alignItems: 'center',
        minWidth: isLargeScreen ? 70 : undefined,
        ...(isLargeScreen && { gap: 2 }),
      },
      statValue: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: '#FFFFFF',
        marginBottom: isLargeScreen ? 2 : 4,
        textAlign: 'center',
      },
      statLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
        textAlign: 'center',
      },
    });
  
  const router = useRouter();
  const { 
    currentTimer, 
    timerState, 
    setTimerState, 
    playSound, 
    settings,
    nextCycle 
  } = useTimer();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.timeLeft]);

  useEffect(() => {
    if (timerState.timeLeft === 0 && timerState.isRunning) {
      handleTimerComplete();
    }
  }, [timerState.timeLeft, timerState.isRunning]);

  useEffect(() => {
    const currentSegment = getCurrentSegment();
    const progress = currentSegment ? 1 - (timerState.timeLeft / currentSegment.duration) : 0;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [timerState.timeLeft, timerState.currentCycle]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const getCurrentSegment = () => {
    if (!currentTimer?.sequence) return null;
    return currentTimer.sequence[timerState.currentCycle - 1];
  };

  const getCurrentPhaseLabel = () => {
    const segment = getCurrentSegment();
    if (!segment) return 'Custom Timer';
    return segment.label || (segment.isBreak ? 'Rest' : 'Active');
  };

  const getCurrentPhaseColor = () => {
    return currentTimer?.color || '#FF6B35';
  };

const handleTimerComplete = async () => {
  triggerHaptic();
  
  if (!currentTimer?.sequence) return;
  
  const nextCycle = timerState.currentCycle + 1;
  
  if (nextCycle <= currentTimer.sequence.length) {
    // Avanza al siguiente segmento
    await playSound('pip'); // Sonido normal entre segmentos
    const nextSegment = currentTimer.sequence[nextCycle - 1];
    setTimerState({
      isRunning: true,
      timeLeft: nextSegment.duration,
      isBreak: nextSegment.isBreak,
      currentCycle: nextCycle,
      totalCycles: currentTimer.sequence.length,
    });
  } else {
    // Fin de toda la secuencia
    await playSound('complete'); // Sonido especial de finalización
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: 0,
    }));
  }
};

  const handlePlayPause = async () => {
    triggerHaptic();
    
    const currentSegment = getCurrentSegment();
    if (!timerState.isRunning && currentSegment && timerState.timeLeft === currentSegment.duration) {
      await playSound('pip');
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleReset = () => {
    triggerHaptic();
    if (!currentTimer?.sequence) return;
    
    setTimerState({
      isRunning: false,
      timeLeft: currentTimer.sequence[0].duration,
      isBreak: currentTimer.sequence[0].isBreak,
      currentCycle: 1,
      totalCycles: currentTimer.sequence.length,
    });
    
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSkip = () => {
    triggerHaptic();
    if (!currentTimer?.sequence) return;
    const nextCycle = timerState.currentCycle + 1;
    if (nextCycle <= currentTimer.sequence.length) {
      const nextSegment = currentTimer.sequence[nextCycle - 1];
      setTimerState({
        isRunning: true,
        timeLeft: nextSegment.duration,
        isBreak: nextSegment.isBreak,
        currentCycle: nextCycle,
        totalCycles: currentTimer.sequence.length,
      });
    } else {
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        timeLeft: 0,
      }));
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!currentTimer?.sequence) return 0;
    return currentTimer.sequence.reduce((total, segment) => total + segment.duration, 0);
  };

  if (!currentTimer || !currentTimer.sequence) {
    return (
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>No Custom Timer Selected</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Custom Timer</Text>
        <Text style={styles.subtitle}>
          {currentTimer.emoji} {getCurrentPhaseLabel()}
        </Text>
        <View style={styles.timerInfo}>
          <Text style={styles.timerInfoText}>{currentTimer.name}</Text>
        </View>
      </View>

      <View style={styles.timerContainer}>
        <View style={[styles.progressRing, { borderColor: getCurrentPhaseColor() + '20' }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getCurrentPhaseColor(),
                transform: [
                  {
                    rotate: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.timerInner}>
            <Text style={[styles.timerText, { color: getCurrentPhaseColor() }]}>
              {formatTime(timerState.timeLeft)}
            </Text>
            <Text style={styles.phaseText}>
              Segment {timerState.currentCycle}/{timerState.totalCycles}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <RotateCcw size={24} color="#94A3B8" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={[styles.playButton, { shadowColor: getCurrentPhaseColor() }]}
            onPress={handlePlayPause}
          >
            <LinearGradient
              colors={[getCurrentPhaseColor(), getCurrentPhaseColor() + 'CC']}
              style={styles.playButtonGradient}
            >
              {timerState.isRunning ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <SkipForward size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentTimer.sequence.length}</Text>
          <Text style={styles.statLabel}>Segments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(getTotalDuration() / 60)}m</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{timerState.currentCycle}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
  },
  timerInfo: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  timerInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressRing: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
    opacity: 0.2,
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  playButton: {
    marginTop:30,
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
});
