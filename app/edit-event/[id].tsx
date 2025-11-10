import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, MapPin, Users } from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import { useAuth } from "@/contexts/AuthContext";
import DateTimePicker from "@/components/DateTimePicker";
import Colors from "@/constants/colors";
import { EventPriority } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

export default function EditEvent() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { id } = useLocalSearchParams();
  const { events, updateEvent } = useEvents();
  const { allUsers } = useAuth();
  const { colors } = useTheme();

  const event = events.find((e) => e.id === id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<EventPriority>("medium");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [commissionerRequired, setCommissionerRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location);

      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      const formatDateString = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formatTimeString = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      setStartDate(formatDateString(start));
      setStartTime(formatTimeString(start));
      setEndDate(formatDateString(end));
      setEndTime(formatTimeString(end));

      setPriority(event.priority);
      setSelectedUsers(event.assignedTo);
      setCommissionerRequired(event.commissionerRequired);
    }
  }, [event]);

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Event Not Found</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!title || !description || !location || !startDate || !startTime || !endDate || !endTime) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert("No Attendees", "Please select at least one attendee.");
      return;
    }

    setLoading(true);

    const [startDay, startMonth, startYear] = startDate.split("-");
    const startDateTime = new Date(`${startYear}-${startMonth}-${startDay}T${startTime}`).toISOString();
    const [endDay, endMonth, endYear] = endDate.split("-");
    const endDateTime = new Date(`${endYear}-${endMonth}-${endDay}T${endTime}`).toISOString();

    await updateEvent(event.id, {
      title,
      description,
      location,
      startTime: startDateTime,
      endTime: endDateTime,
      priority,
      assignedTo: selectedUsers,
      commissionerRequired,
    });

    setLoading(false);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: isMobile ? insets.top : 0, paddingBottom: isMobile ? insets.bottom : 0, backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Event</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={isMobile && styles.contentMobile}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Event Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter event title"
              placeholderTextColor={Colors.text.disabled}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter event description"
              placeholderTextColor={Colors.text.disabled}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <View style={[styles.iconInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MapPin color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.iconInputText, { color: colors.text }]}
                placeholder="Enter location"
                placeholderTextColor={Colors.text.disabled}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={[styles.row, isMobile && styles.rowMobile]}>
            <View style={[styles.section, { flex: 1 }]}>
              <DateTimePicker
                label="Start Date *"
                value={startDate}
                onChange={setStartDate}
                mode="date"
              />
            </View>

            <View style={[styles.section, { flex: 1 }]}>
              <DateTimePicker
                label="Start Time *"
                value={startTime}
                onChange={setStartTime}
                mode="time"
              />
            </View>
          </View>

          <View style={[styles.row, isMobile && styles.rowMobile]}>
            <View style={[styles.section, { flex: 1 }]}>
              <DateTimePicker
                label="End Date *"
                value={endDate}
                onChange={setEndDate}
                mode="date"
              />
            </View>

            <View style={[styles.section, { flex: 1 }]}>
              <DateTimePicker
                label="End Time *"
                value={endTime}
                onChange={setEndTime}
                mode="time"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(["critical", "high", "medium", "low"] as EventPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    { backgroundColor: priority === p ? colors.primary : Colors.neutral.gray100 },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      { color: priority === p ? Colors.text.inverse : Colors.text.secondary },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.label, { color: colors.text }]}>Commissioner Required</Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Mark if the commissioner must attend this event
                </Text>
              </View>
              <Switch
                value={commissionerRequired}
                onValueChange={setCommissionerRequired}
                trackColor={{ false: Colors.neutral.gray200, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Users color={colors.text} size={20} />
              <Text style={[styles.label, { color: colors.text }]}>Attendees *</Text>
            </View>
            <View style={styles.usersList}>
              {allUsers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedUsers.includes(user.id) && { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
                  ]}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                    <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user.role}</Text>
                  </View>
                  {selectedUsers.includes(user.id) && (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: Colors.neutral.gray100 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  contentMobile: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text.primary,
    outlineStyle: "none" as any,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  iconInput: {
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
  iconInputText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    outlineStyle: "none" as any,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  rowMobile: {
    flexDirection: "column",
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray100,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  toggleLabel: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  usersList: {
    gap: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  userRole: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    backgroundColor: Colors.background.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray100,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
});
