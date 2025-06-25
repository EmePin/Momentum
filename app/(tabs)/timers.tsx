import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, CreditCard as Edit3, Trash2, Play, Clock, Repeat } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTimer, CustomTimer } from '@/components/TimerProvider';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const TIMER_COLORS = [
  '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

const TIMER_EMOJIS = ['🍅', '📚', '💪', '🎯', '🚀', '⭐', '🌟', '🔥', '💎', '🎨', '🎮', '🏃'];

export default function CustomTimersScreen() {
  const [timers, setTimers] = useState<CustomTimer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTimer, setEditingTimer] = useState<CustomTimer | null>(null);
  const { setCurrentTimer, setTimerState, settings } = useTimer();
  const [formData, setFormData] = useState({
    name: '',
    workMinutes: '25',
    workSeconds: '0',
    breakMinutes: '5',
    breakSeconds: '0',
    repetitions: '4',
    color: TIMER_COLORS[0],
    emoji: TIMER_EMOJIS[0],
  });

  useEffect(() => {
    loadTimers();
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const loadTimers = async () => {
    try {
      const savedTimers = await AsyncStorage.getItem('customTimers');
      if (savedTimers) {
        setTimers(JSON.parse(savedTimers));
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const saveTimers = async (updatedTimers: CustomTimer[]) => {
    try {
      await AsyncStorage.setItem('customTimers', JSON.stringify(updatedTimers));
      setTimers(updatedTimers);
    } catch (error) {
      console.error('Error saving timers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      workMinutes: '25',
      workSeconds: '0',
      breakMinutes: '5',
      breakSeconds: '0',
      repetitions: '4',
      color: TIMER_COLORS[0],
      emoji: TIMER_EMOJIS[0],
    });
    setEditingTimer(null);
  };

  const openModal = (timer?: CustomTimer) => {
    triggerHaptic();
    if (timer) {
      setEditingTimer(timer);
      setFormData({
        name: timer.name,
        workMinutes: Math.floor(timer.workDuration / 60).toString(),
        workSeconds: (timer.workDuration % 60).toString(),
        breakMinutes: Math.floor(timer.breakDuration / 60).toString(),
        breakSeconds: (timer.breakDuration % 60).toString(),
        repetitions: timer.repetitions.toString(),
        color: timer.color,
        emoji: timer.emoji,
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    triggerHaptic();
    setModalVisible(false);
    resetForm();
  };

  const saveTimer = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a timer name');
      return;
    }

    const workDuration = parseInt(formData.workMinutes || '0') * 60 + parseInt(formData.workSeconds || '0');
    const breakDuration = parseInt(formData.breakMinutes || '0') * 60 + parseInt(formData.breakSeconds || '0');

    if (workDuration === 0) {
      Alert.alert('Error', 'Work duration must be greater than 0');
      return;
    }

    const newTimer: CustomTimer = {
      id: editingTimer?.id || Date.now().toString(),
      name: formData.name.trim(),
      workDuration,
      breakDuration,
      repetitions: parseInt(formData.repetitions || '1'),
      color: formData.color,
      emoji: formData.emoji,
    };

    let updatedTimers;
    if (editingTimer) {
      updatedTimers = timers.map(timer => 
        timer.id === editingTimer.id ? newTimer : timer
      );
    } else {
      updatedTimers = [...timers, newTimer];
    }

    saveTimers(updatedTimers);
    triggerHaptic();
    closeModal();
  };

  const deleteTimer = (id: string) => {
    Alert.alert(
      'Delete Timer',
      'Are you sure you want to delete this timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTimers = timers.filter(timer => timer.id !== id);
            saveTimers(updatedTimers);
            triggerHaptic();
          },
        },
      ]
    );
  };

  const startTimer = (timer: CustomTimer) => {
    triggerHaptic();
    setCurrentTimer(timer);
    setTimerState({
      isRunning: false,
      timeLeft: timer.workDuration,
      isBreak: false,
      currentCycle: 1,
      totalCycles: timer.repetitions,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const TimerCard = ({ timer }: { timer: CustomTimer }) => (
    <TouchableOpacity 
      style={styles.timerCard} 
      activeOpacity={0.8}
      onPress={() => startTimer(timer)}
    >
      <LinearGradient
        colors={[timer.color, timer.color + '80']}
        style={styles.timerCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.timerCardHeader}>
          <Text style={styles.timerEmoji}>{timer.emoji}</Text>
          <View style={styles.timerCardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openModal(timer)}
            >
              <Edit3 size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteTimer(timer.id)}
            >
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.timerName}>{timer.name}</Text>

        <View style={styles.timerStats}>
          <View style={styles.statRow}>
            <Clock size={14} color="#FFFFFF" />
            <Text style={styles.statText}>Work: {formatDuration(timer.workDuration)}</Text>
          </View>
          <View style={styles.statRow}>
            <Clock size={14} color="#FFFFFF" />
            <Text style={styles.statText}>Break: {formatDuration(timer.breakDuration)}</Text>
          </View>
          <View style={styles.statRow}>
            <Repeat size={14} color="#FFFFFF" />
            <Text style={styles.statText}>{timer.repetitions} cycles</Text>
          </View>
        </View>

        <View style={styles.playButton}>
          <Play size={20} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Start Timer</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const ColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.formLabel}>Color</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
        {TIMER_COLORS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.color === color && styles.selectedColor,
            ]}
            onPress={() => {
              triggerHaptic();
              setFormData({ ...formData, color });
            }}
          />
        ))}
      </ScrollView>
    </View>
  );

  const EmojiPicker = () => (
    <View style={styles.emojiPicker}>
      <Text style={styles.formLabel}>Emoji</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
        {TIMER_EMOJIS.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.emojiOption,
              formData.emoji === emoji && styles.selectedEmoji,
            ]}
            onPress={() => {
              triggerHaptic();
              setFormData({ ...formData, emoji });
            }}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Custom Timers</Text>
        <Text style={styles.subtitle}>Create your perfect focus sessions</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {timers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyTitle}>No Custom Timers Yet</Text>
            <Text style={styles.emptyText}>
              Create your first custom timer to get started with personalized focus sessions!
            </Text>
          </View>
        ) : (
          <View style={styles.timersGrid}>
            {timers.map((timer) => (
              <TimerCard key={timer.id} timer={timer} />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <LinearGradient
          colors={['#FF6B35', '#FFA726']}
          style={styles.fabGradient}
        >
          <Plus size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTimer ? 'Edit Timer' : 'Create New Timer'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Timer Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Study Session, Workout, Reading"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.durationGroup}>
                <Text style={styles.formLabel}>Work Duration</Text>
                <View style={styles.durationInputs}>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.timeTextInput}
                      value={formData.workMinutes}
                      onChangeText={(text) => setFormData({ ...formData, workMinutes: text })}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="25"
                    />
                    <Text style={styles.timeUnit}>min</Text>
                  </View>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.timeTextInput}
                      value={formData.workSeconds}
                      onChangeText={(text) => setFormData({ ...formData, workSeconds: text })}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                    />
                    <Text style={styles.timeUnit}>sec</Text>
                  </View>
                </View>
              </View>

              <View style={styles.durationGroup}>
                <Text style={styles.formLabel}>Break Duration</Text>
                <View style={styles.durationInputs}>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.timeTextInput}
                      value={formData.breakMinutes}
                      onChangeText={(text) => setFormData({ ...formData, breakMinutes: text })}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="5"
                    />
                    <Text style={styles.timeUnit}>min</Text>
                  </View>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.timeTextInput}
                      value={formData.breakSeconds}
                      onChangeText={(text) => setFormData({ ...formData, breakSeconds: text })}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                    />
                    <Text style={styles.timeUnit}>sec</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Number of Cycles</Text>
                <TextInput
                  style={[styles.textInput, styles.numberInput]}
                  value={formData.repetitions}
                  onChangeText={(text) => setFormData({ ...formData, repetitions: text })}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="4"
                />
              </View>

              <ColorPicker />
              <EmojiPicker />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveTimer}>
                  <LinearGradient
                    colors={['#FF6B35', '#FFA726']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingTimer ? 'Update' : 'Create'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  timersGrid: {
    paddingBottom: 100,
  },
  timerCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  timerCardGradient: {
    padding: 20,
  },
  timerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerEmoji: {
    fontSize: 32,
  },
  timerCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 8,
  },
  timerName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timerStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  playButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationGroup: {
    marginBottom: 20,
  },
  durationInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timeTextInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    textAlign: 'center',
  },
  timeUnit: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  numberInput: {
    textAlign: 'center',
  },
  colorPicker: {
    marginBottom: 20,
  },
  colorRow: {
    flexDirection: 'row',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#1E293B',
  },
  emojiPicker: {
    marginBottom: 20,
  },
  emojiRow: {
    flexDirection: 'row',
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEmoji: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F0',
  },
  emojiText: {
    fontSize: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});