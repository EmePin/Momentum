import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Bell, 
  Clock, 
  Palette, 
  RotateCcw,
  ChevronRight,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react-native';
import { useTimer } from '@/components/TimerProvider';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const { settings, updateSettings } = useTimer();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());

  useEffect(() => {
    // Parse the reminder time string to Date object
    const [hours, minutes] = settings.reminderTime.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    setReminderTime(date);
  }, [settings.reminderTime]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive daily reminders.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const scheduleDailyReminder = async () => {
    if (settings.dailyReminders) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const [hours, minutes] = settings.reminderTime.split(':');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍅 Pomokids Reminder',
          body: 'Time for your focus session! Let\'s get productive!',
          sound: true,
        },
        trigger: {
          hour: parseInt(hours, 10),
          minute: parseInt(minutes, 10),
          repeats: true,
        },
      });
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const toggleDailyReminders = async (value: boolean) => {
    if (value) {
      const hasPermission = await handleNotificationPermission();
      if (!hasPermission) return;
    }
    
    await updateSettings({ dailyReminders: value });
    await scheduleDailyReminder();
    triggerHaptic();
  };

  const handleTimeChange = async (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      await updateSettings({ reminderTime: timeString });
      setReminderTime(selectedTime);
      
      if (settings.dailyReminders) {
        await scheduleDailyReminder();
      }
      triggerHaptic();
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await updateSettings({
              soundEnabled: true,
              vibrationEnabled: true,
              workDuration: 25 * 60,
              breakDuration: 5 * 60,
              longBreakDuration: 15 * 60,
              longBreakInterval: 4,
              dailyReminders: false,
              reminderTime: '09:00',
              theme: 'auto',
            });
            await Notifications.cancelAllScheduledNotificationsAsync();
            triggerHaptic();
          },
        },
      ]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showChevron = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && <ChevronRight size={20} color="#94A3B8" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your Pomokids experience</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Feedback</Text>
          
          <SettingItem
            icon={settings.soundEnabled ? <Volume2 size={20} color="#FF6B35" /> : <VolumeX size={20} color="#94A3B8" />}
            title="Sound Effects"
            subtitle="Play sounds for timer start/stop events"
            rightComponent={
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => {
                  updateSettings({ soundEnabled: value });
                  triggerHaptic();
                }}
                trackColor={{ false: '#374151', true: '#FF6B35' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          {Platform.OS !== 'web' && (
            <SettingItem
              icon={<Vibrate size={20} color={settings.vibrationEnabled ? '#FF6B35' : '#94A3B8'} />}
              title="Vibration"
              subtitle="Haptic feedback for interactions"
              rightComponent={
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => {
                    updateSettings({ vibrationEnabled: value });
                    if (value) triggerHaptic();
                  }}
                  trackColor={{ false: '#374151', true: '#FF6B35' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer Defaults</Text>
          
          <SettingItem
            icon={<Clock size={20} color="#4ECDC4" />}
            title="Work Duration"
            subtitle={`${Math.floor(settings.workDuration / 60)} minutes`}
            onPress={() => {
              Alert.alert(
                'Work Duration',
                'Set the default work session duration (1-90 minutes)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: '15 min', onPress: () => updateSettings({ workDuration: 15 * 60 }) },
                  { text: '25 min', onPress: () => updateSettings({ workDuration: 25 * 60 }) },
                  { text: '30 min', onPress: () => updateSettings({ workDuration: 30 * 60 }) },
                  { text: '45 min', onPress: () => updateSettings({ workDuration: 45 * 60 }) },
                ]
              );
            }}
            showChevron
          />

          <SettingItem
            icon={<Clock size={20} color="#96CEB4" />}
            title="Break Duration"
            subtitle={`${Math.floor(settings.breakDuration / 60)} minutes`}
            onPress={() => {
              Alert.alert(
                'Break Duration',
                'Set the default break duration (1-30 minutes)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: '5 min', onPress: () => updateSettings({ breakDuration: 5 * 60 }) },
                  { text: '10 min', onPress: () => updateSettings({ breakDuration: 10 * 60 }) },
                  { text: '15 min', onPress: () => updateSettings({ breakDuration: 15 * 60 }) },
                  { text: '20 min', onPress: () => updateSettings({ breakDuration: 20 * 60 }) },
                ]
              );
            }}
            showChevron
          />

          <SettingItem
            icon={<Clock size={20} color="#FFEAA7" />}
            title="Long Break Duration"
            subtitle={`${Math.floor(settings.longBreakDuration / 60)} minutes`}
            onPress={() => {
              Alert.alert(
                'Long Break Duration',
                'Set the duration for long breaks (10-60 minutes)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: '15 min', onPress: () => updateSettings({ longBreakDuration: 15 * 60 }) },
                  { text: '20 min', onPress: () => updateSettings({ longBreakDuration: 20 * 60 }) },
                  { text: '30 min', onPress: () => updateSettings({ longBreakDuration: 30 * 60 }) },
                  { text: '45 min', onPress: () => updateSettings({ longBreakDuration: 45 * 60 }) },
                ]
              );
            }}
            showChevron
          />

          <SettingItem
            icon={<RotateCcw size={20} color="#DDA0DD" />}
            title="Long Break Interval"
            subtitle={`Every ${settings.longBreakInterval} cycles`}
            onPress={() => {
              Alert.alert(
                'Long Break Interval',
                'After how many cycles should a long break occur?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: '3 cycles', onPress: () => updateSettings({ longBreakInterval: 3 }) },
                  { text: '4 cycles', onPress: () => updateSettings({ longBreakInterval: 4 }) },
                  { text: '5 cycles', onPress: () => updateSettings({ longBreakInterval: 5 }) },
                  { text: '6 cycles', onPress: () => updateSettings({ longBreakInterval: 6 }) },
                ]
              );
            }}
            showChevron
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            icon={<Bell size={20} color={settings.dailyReminders ? '#FF6B35' : '#94A3B8'} />}
            title="Daily Reminders"
            subtitle={settings.dailyReminders ? `Enabled at ${formatTime(settings.reminderTime)}` : 'Disabled'}
            rightComponent={
              <Switch
                value={settings.dailyReminders}
                onValueChange={toggleDailyReminders}
                trackColor={{ false: '#374151', true: '#FF6B35' }}
                thumbColor="#FFFFFF"
              />
            }
          />

          {settings.dailyReminders && (
            <SettingItem
              icon={<Clock size={20} color="#4ECDC4" />}
              title="Reminder Time"
              subtitle={formatTime(settings.reminderTime)}
              onPress={() => setShowTimePicker(true)}
              showChevron
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <SettingItem
            icon={
              settings.theme === 'light' ? <Sun size={20} color="#FFEAA7" /> :
              settings.theme === 'dark' ? <Moon size={20} color="#85C1E9" /> :
              <Smartphone size={20} color="#94A3B8" />
            }
            title="Theme"
            subtitle={settings.theme === 'auto' ? 'Follow system' : settings.theme === 'light' ? 'Light' : 'Dark'}
            onPress={() => {
              Alert.alert(
                'Choose Theme',
                'Select your preferred theme',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Light', onPress: () => updateSettings({ theme: 'light' }) },
                  { text: 'Dark', onPress: () => updateSettings({ theme: 'dark' }) },
                  { text: 'Auto', onPress: () => updateSettings({ theme: 'auto' }) },
                ]
              );
            }}
            showChevron
          />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.resetButtonGradient}
          >
            <RotateCcw size={20} color="#FFFFFF" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pomokids v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ for productivity</Text>
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginTop: 4,
  },
});