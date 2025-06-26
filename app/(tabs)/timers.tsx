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
import { Plus, CreditCard as Edit3, Trash2, Play, Clock, Repeat, List } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTimer, CustomTimer } from '@/components/TimerProvider';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const TIMER_COLORS = [
  '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

const TIMER_EMOJIS = ['🍅', '📚', '💪', '🎯', '🚀', '⭐', '🌟', '🔥', '💎', '🎨', '🎮', '🏃'];

interface TimerSequence {
  duration: number;
  isBreak: boolean;
  label?: string;
}

interface CustomTimerWithSequence extends Omit<CustomTimer, 'workDuration' | 'breakDuration' | 'repetitions'> {
  type: 'normal' | 'sequence';
  workDuration?: number;
  breakDuration?: number;
  repetitions?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
  sequence?: TimerSequence[];
}

export default function CustomTimersScreen() {
  const [timers, setTimers] = useState<CustomTimerWithSequence[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTimer, setEditingTimer] = useState<CustomTimerWithSequence | null>(null);
  const { setCurrentTimer, setTimerState, settings } = useTimer();
  const [timerType, setTimerType] = useState<'normal' | 'sequence'>('normal');
  const [sequence, setSequence] = useState<TimerSequence[]>([{ duration: 25 * 60, isBreak: false, label: 'Work' }]);
  const [formData, setFormData] = useState({
    name: '',
    workMinutes: '25',
    workSeconds: '0',
    breakMinutes: '5',
    breakSeconds: '0',
    longBreakMinutes: '15',
    longBreakSeconds: '0',
    longBreakInterval: '4',
    repetitions: '4',
    color: TIMER_COLORS[0],
    emoji: TIMER_EMOJIS[0],
  });
  const router = useRouter();

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

  const saveTimers = async (updatedTimers: CustomTimerWithSequence[]) => {
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
      longBreakMinutes: '15',
      longBreakSeconds: '0',
      longBreakInterval: '4',
      repetitions: '4',
      color: TIMER_COLORS[0],
      emoji: TIMER_EMOJIS[0],
    });
    setTimerType('normal');
    setSequence([{ duration: 25 * 60, isBreak: false, label: 'Work' }]);
    setEditingTimer(null);
  };

  const openModal = (timer?: CustomTimerWithSequence) => {
    triggerHaptic();
    if (timer) {
      setEditingTimer(timer);
      setTimerType(timer.type);
      
      if (timer.type === 'normal') {
        setFormData({
          name: timer.name,
          workMinutes: Math.floor(timer.workDuration! / 60).toString(),
          workSeconds: (timer.workDuration! % 60).toString(),
          breakMinutes: Math.floor(timer.breakDuration! / 60).toString(),
          breakSeconds: (timer.breakDuration! % 60).toString(),
          longBreakMinutes: timer.longBreakDuration ? Math.floor(timer.longBreakDuration / 60).toString() : '15',
          longBreakSeconds: timer.longBreakDuration ? (timer.longBreakDuration % 60).toString() : '0',
          longBreakInterval: timer.longBreakInterval ? timer.longBreakInterval.toString() : '4',
          repetitions: timer.repetitions!.toString(),
          color: timer.color,
          emoji: timer.emoji,
        });
      } else {
        setFormData({
          ...formData,
          name: timer.name,
          color: timer.color,
          emoji: timer.emoji,
        });
        setSequence(timer.sequence || []);
      }
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

    let newTimer: CustomTimerWithSequence;

    if (timerType === 'normal') {
      const workDuration = parseInt(formData.workMinutes || '0') * 60 + parseInt(formData.workSeconds || '0');
      const breakDuration = parseInt(formData.breakMinutes || '0') * 60 + parseInt(formData.breakSeconds || '0');
      const longBreakDuration = parseInt(formData.longBreakMinutes || '0') * 60 + parseInt(formData.longBreakSeconds || '0');

      if (workDuration === 0) {
        Alert.alert('Error', 'Work duration must be greater than 0');
        return;
      }

      newTimer = {
        id: editingTimer?.id || Date.now().toString(),
        name: formData.name.trim(),
        type: 'normal',
        workDuration,
        breakDuration,
        longBreakDuration,
        longBreakInterval: parseInt(formData.longBreakInterval || '4'),
        repetitions: parseInt(formData.repetitions || '1'),
        color: formData.color,
        emoji: formData.emoji,
      };
    } else {
      if (sequence.length === 0) {
        Alert.alert('Error', 'Sequence must have at least one timer');
        return;
      }

      newTimer = {
        id: editingTimer?.id || Date.now().toString(),
        name: formData.name.trim(),
        type: 'sequence',
        sequence: sequence,
        color: formData.color,
        emoji: formData.emoji,
      };
    }

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

  const addSequenceItem = () => {
    setSequence([...sequence, { duration: 5 * 60, isBreak: true, label: 'Break' }]);
  };

  const removeSequenceItem = (index: number) => {
    if (sequence.length > 1) {
      setSequence(sequence.filter((_, i) => i !== index));
    }
  };

  const updateSequenceItem = (index: number, updates: Partial<TimerSequence>) => {
    const newSequence = [...sequence];
    newSequence[index] = { ...newSequence[index], ...updates };
    setSequence(newSequence);
  };

  const getTotalDuration = (timer: CustomTimerWithSequence) => {
    if (timer.type === 'normal') {
      return (timer.workDuration! + timer.breakDuration!) * timer.repetitions!;
    } else {
      return timer.sequence!.reduce((total, item) => total + item.duration, 0);
    }
  };

  const startTimer = (timer: CustomTimerWithSequence) => {
    triggerHaptic();
    
    if (timer.type === 'normal') {
      // Para Pomodoro normal - usar lógica tradicional con descansos largos
      const normalTimer: CustomTimer = {
        id: timer.id,
        name: timer.name,
        workDuration: timer.workDuration!,
        breakDuration: timer.breakDuration!,
        repetitions: timer.repetitions!,
        color: timer.color,
        emoji: timer.emoji,
        type: 'normal',
        longBreakDuration: timer.longBreakDuration,
        longBreakInterval: timer.longBreakInterval,
      };
      setCurrentTimer(normalTimer);
      setTimerState({
        isRunning: false,
        timeLeft: timer.workDuration!,
        isBreak: false,
        currentCycle: 1,
        totalCycles: timer.repetitions!,
      });
      
      // Navegar a pantalla de Pomodoro tradicional
      router.push('/pomodoro');
    } else {
      // Para Custom Pomodoro - lógica completamente diferente sin breaks
      const sequenceTimer: CustomTimer = {
        id: timer.id,
        name: timer.name,
        workDuration: timer.sequence![0].duration,
        breakDuration: 0, // NO usar breaks
        repetitions: timer.sequence!.length,
        color: timer.color,
        emoji: timer.emoji,
        sequence: timer.sequence,
        type: 'sequence',
      };
      setCurrentTimer(sequenceTimer);
      setTimerState({
        isRunning: false,
        timeLeft: timer.sequence![0].duration,
        isBreak: timer.sequence![0].isBreak,
        currentCycle: 1,
        totalCycles: timer.sequence!.length,
      });
      
      // Navegar a pantalla de Custom Timer
      router.push('/custom-timer');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const TimerCard = ({ timer }: { timer: CustomTimerWithSequence }) => (
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
            <View style={styles.timerTypeLabel}>
              <Text style={styles.timerTypeLabelText}>
                {timer.type === 'normal' ? 'Pomodoro' : 'Custom Pomodoro'}
              </Text>
            </View>
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
          {timer.type === 'normal' ? (
            <>
              <View style={styles.statRow}>
                <Clock size={14} color="#FFFFFF" />
                <Text style={styles.statText}>Work: {formatDuration(timer.workDuration!)}</Text>
              </View>
              <View style={styles.statRow}>
                <Clock size={14} color="#FFFFFF" />
                <Text style={styles.statText}>Break: {formatDuration(timer.breakDuration!)}</Text>
              </View>
              <View style={styles.statRow}>
                <Repeat size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{timer.repetitions} cycles</Text>
              </View>
              <View style={styles.statRow}>
                <Clock size={14} color="#FFFFFF" />
                <Text style={styles.statText}>Long break after {timer.longBreakInterval} cycles {timer.longBreakDuration/60}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statRow}>
                <List size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{timer.sequence!.length} segments</Text>
              </View>
              <View style={styles.statRow}>
                <Clock size={14} color="#FFFFFF" />
                <Text style={styles.statText}>Total: {formatDuration(getTotalDuration(timer))}</Text>
              </View>
            </>
          )}
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

  const SequenceBuilder = () => {
    const [tempValues, setTempValues] = useState<{[key: string]: {minutes: string, seconds: string}}>({});

    const getTempValue = (index: number, type: 'minutes' | 'seconds') => {
      const key = `${index}_${type}`;
      if (tempValues[key]) {
        return tempValues[key][type];
      }
      const item = sequence[index];
      return type === 'minutes' 
        ? Math.floor(item.duration / 60).toString()
        : (item.duration % 60).toString();
    };

    const setTempValue = (index: number, type: 'minutes' | 'seconds', value: string) => {
      const key = `${index}_${type}`;
      setTempValues(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          [type]: value
        }
      }));
    };

    const updateDurationFromTemp = (index: number) => {
      const minutesKey = `${index}_minutes`;
      const secondsKey = `${index}_seconds`;
      
      const minutes = parseInt(tempValues[minutesKey]?.minutes || Math.floor(sequence[index].duration / 60).toString());
      const seconds = parseInt(tempValues[secondsKey]?.seconds || (sequence[index].duration % 60).toString());
      
      updateSequenceItem(index, { duration: minutes * 60 + seconds });
      
      // Limpiar valores temporales
      setTempValues(prev => {
        const newTemp = { ...prev };
        delete newTemp[minutesKey];
        delete newTemp[secondsKey];
        return newTemp;
      });
    };

    return (
      <View style={styles.sequenceBuilder}>
        <Text style={styles.formLabel}>Timer Sequence</Text>
        <View style={styles.sequenceListContainer}>
          <ScrollView 
            style={styles.sequenceList} 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {sequence.map((item, index) => (
              <View key={index} style={styles.sequenceItem}>
                <View style={styles.sequenceHeader}>
                  <Text style={styles.sequenceIndex}>{index + 1}</Text>
                  <TouchableOpacity
                    style={[
                      styles.sequenceTypeButton,
                      { backgroundColor: item.isBreak ? '#4ECDC4' : '#FF6B35' }
                    ]}
                    onPress={() => updateSequenceItem(index, { 
                      isBreak: !item.isBreak,
                      label: !item.isBreak ? 'Break' : 'Work'
                    })}
                  >
                    <Text style={styles.sequenceTypeText}>
                      {item.isBreak ? 'Break' : 'Work'}
                    </Text>
                  </TouchableOpacity>
                  {sequence.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeSequenceItem(index)}
                    >
                      <Trash2 size={16} color="#FF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.sequenceDuration}>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.timeTextInput}
                      value={getTempValue(index, 'minutes')}
                      onChangeText={(text) => setTempValue(index, 'minutes', text)}
                      onBlur={() => updateDurationFromTemp(index)}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="25"
                    />
                    <Text style={styles.timeUnit}>min</Text>
                  </View>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.timeTextInput}
                      value={getTempValue(index, 'seconds')}
                      onChangeText={(text) => setTempValue(index, 'seconds', text)}
                      onBlur={() => updateDurationFromTemp(index)}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                    />
                    <Text style={styles.timeUnit}>sec</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
        
        <TouchableOpacity style={styles.addSequenceButton} onPress={addSequenceItem}>
          <Plus size={20} color="#FF6B35" />
          <Text style={styles.addSequenceText}>Add Segment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pomodoro</Text>
        <Text style={styles.subtitle}>Create your perfect focus sessions</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {timers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍅</Text>
            <Text style={styles.emptyTitle}>No Custom Pomodoros Yet</Text>
            <Text style={styles.emptyText}>
              Create your first custom pomodoro timer to get started with personalized focus sessions!
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
              {editingTimer ? 'Edit Pomodoro' : 'Create New Pomodoro'}
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Timer Type</Text>
                <View style={styles.timerTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      timerType === 'normal' && styles.selectedTypeButton
                    ]}
                    onPress={() => setTimerType('normal')}
                  >
                    <Repeat size={20} color={timerType === 'normal' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[
                      styles.typeButtonText,
                      timerType === 'normal' && styles.selectedTypeButtonText
                    ]}>
                      Normal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      timerType === 'sequence' && styles.selectedTypeButton
                    ]}
                    onPress={() => setTimerType('sequence')}
                  >
                    <List size={20} color={timerType === 'sequence' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[
                      styles.typeButtonText,
                      timerType === 'sequence' && styles.selectedTypeButtonText
                    ]}>
                      Custom Sequence
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {timerType === 'normal' ? (
                <>
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

                  <View style={styles.durationGroup}>
                    <Text style={styles.formLabel}>Long Break Duration</Text>
                    <View style={styles.durationInputs}>
                      <View style={styles.timeInput}>
                        <TextInput
                          style={styles.timeTextInput}
                          value={formData.longBreakMinutes}
                          onChangeText={(text) => setFormData({ ...formData, longBreakMinutes: text })}
                          keyboardType="numeric"
                          maxLength={3}
                          placeholder="15"
                        />
                        <Text style={styles.timeUnit}>min</Text>
                      </View>
                      <View style={styles.timeInput}>
                        <TextInput
                          style={styles.timeTextInput}
                          value={formData.longBreakSeconds}
                          onChangeText={(text) => setFormData({ ...formData, longBreakSeconds: text })}
                          keyboardType="numeric"
                          maxLength={2}
                          placeholder="0"
                        />
                        <Text style={styles.timeUnit}>sec</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Long Break Interval (cycles)</Text>
                    <TextInput
                      style={[styles.textInput, styles.numberInput]}
                      value={formData.longBreakInterval}
                      onChangeText={(text) => setFormData({ ...formData, longBreakInterval: text })}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="4"
                    />
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
                </>
              ) : (
                <SequenceBuilder />
              )}

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
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 8,
  },
  timerTypeLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timerTypeLabelText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
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
  timerTypeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 6,
    marginRight: 4,
  },
  timerTypeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedTypeButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    marginLeft: 8,
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  sequenceBuilder: {
    marginBottom: 20,
  },
  sequenceListContainer: {
    height: 250,
    marginBottom: 12,
  },
  sequenceList: {
    flex: 1,
  },
  sequencePreviewContainer: {
    height: 100,
    marginTop: 8,
  },
  sequencePreview: {
    flex: 1,
  },
  sequencePreviewContent: {
    paddingBottom: 8,
  },
  sequenceSegment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sequenceSegmentText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  sequenceSegmentType: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  sequenceItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sequenceIndex: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#334155',
    marginRight: 12,
    minWidth: 24,
  },
  sequenceTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  sequenceTypeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  sequenceDuration: {
    flexDirection: 'row',
    gap: 12,
  },
  addSequenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addSequenceText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
    marginLeft: 8,
  },
});