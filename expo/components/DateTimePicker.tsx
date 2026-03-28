import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";

interface DateTimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode: "date" | "time";
  placeholder?: string;
}

export default function DateTimePicker({
  label,
  value,
  onChange,
  mode,
  placeholder,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (hours: number, minutes: number) => {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const generateTimeSlots = () => {
    const slots: { hours: number; minutes: number; display: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push({
          hours: h,
          minutes: m,
          display: formatTime(h, m),
        });
      }
    }
    return slots;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
    setShowPicker(false);
  };

  const handleTimeSelect = (hours: number, minutes: number) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    onChange(timeString);
    setShowPicker(false);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } =
      getDaysInMonth(selectedDate);
    const days: React.ReactElement[] = [];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        value &&
        new Date(value.split("-").reverse().join("-")).getDate() === day &&
        new Date(value.split("-").reverse().join("-")).getMonth() === month &&
        new Date(value.split("-").reverse().join("-")).getFullYear() === year;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
            style={styles.monthButton}
          >
            <ChevronLeft color={Colors.text.primary} size={20} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
            style={styles.monthButton}
          >
            <ChevronRight color={Colors.text.primary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDay}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
    );
  };

  const renderTimePicker = () => {
    const timeSlots = generateTimeSlots();

    return (
      <ScrollView style={styles.timePickerContainer}>
        {timeSlots.map((slot) => {
          const isSelected =
            value === `${slot.hours.toString().padStart(2, "0")}:${slot.minutes.toString().padStart(2, "0")}`;

          return (
            <TouchableOpacity
              key={`${slot.hours}-${slot.minutes}`}
              style={[
                styles.timeSlot,
                isSelected && styles.timeSlotSelected,
              ]}
              onPress={() => handleTimeSelect(slot.hours, slot.minutes)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  isSelected && styles.timeSlotTextSelected,
                ]}
              >
                {slot.display}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const displayValue = () => {
    if (!value) return placeholder || (mode === "date" ? "DD-MM-YYYY" : "HH:MM AM/PM");

    if (mode === "date") {
      return value;
    } else {
      const [hours, minutes] = value.split(":").map(Number);
      return formatTime(hours, minutes);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        {mode === "date" ? (
          <Calendar color={Colors.text.secondary} size={20} />
        ) : (
          <Clock color={Colors.text.secondary} size={20} />
        )}
        <Text
          style={[
            styles.inputText,
            !value && styles.inputTextPlaceholder,
          ]}
        >
          {displayValue()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              Platform.OS === "web" && { maxWidth: mode === "date" ? 400 : 350 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === "date" ? "Select Date" : "Select Time"}
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {mode === "date" ? renderCalendar() : renderTimePicker()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  inputTextPlaceholder: {
    color: Colors.text.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.text.secondary,
    fontWeight: "400" as const,
  },
  calendarContainer: {
    width: "100%",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text.primary,
  },
  calendarDayTextSelected: {
    color: Colors.text.inverse,
    fontWeight: "700" as const,
  },
  timePickerContainer: {
    maxHeight: 300,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary.main,
  },
  timeSlotText: {
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: "center",
  },
  timeSlotTextSelected: {
    color: Colors.text.inverse,
    fontWeight: "600" as const,
  },
});
