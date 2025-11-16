import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';

interface DatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  required?: boolean;
}

export function DatePicker({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  required = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Convert YYYY-MM-DD string to Date object
  const dateValue = value ? new Date(value + 'T00:00:00') : new Date();

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    // On Android, always close picker
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    // Handle date selection
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onChange(dateString);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}>
        <Ionicons name="calendar-outline" size={20} color={COLORS.gray[500]} />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {formatDisplayDate(value)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={COLORS.gray[400]}
          style={styles.chevron}
        />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          // iOS specific props
          {...(Platform.OS === 'ios' && {
            textColor: COLORS.gray[900],
            themeVariant: 'light',
          })}
        />
      )}

      {/* iOS requires a separate Done button */}
      {showPicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerActions}>
          <TouchableOpacity
            style={styles.iosDoneButton}
            onPress={() => setShowPicker(false)}>
            <Text style={styles.iosDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 6,
  },
  required: {
    color: COLORS.error,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  placeholderText: {
    color: COLORS.gray[400],
  },
  chevron: {
    marginLeft: 'auto',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingBottom: 8,
  },
  iosDoneButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.accent[400],
    borderRadius: 8,
  },
  iosDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
