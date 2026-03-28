import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, AlertTriangle, MapPin, Users } from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import { useAuth } from "@/contexts/AuthContext";
import DateTimePicker from "@/components/DateTimePicker";
import Colors from "@/constants/colors";
import { EventPriority, Conflict } from "@/types";
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
  
  const [conflictModal, setConflictModal] = useState(false);
  const [detectedConflicts, setDetectedConflicts] = useState<Conflict[]>([]);
  const [justification, setJustification] = useState("");

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
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background.main }]}>
          <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Event Not Found</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X color={colors.text.primary} size={24} />
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

    console.log("[EditEvent] Saving event with:");
    console.log("  - Title:", title);
    console.log("  - Start:", startDateTime);
    console.log("  - End:", endDateTime);
    console.log("  - Attendees:", selectedUsers);

    const result = await updateEvent(event.id, {
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

    console.log("[EditEvent] Update result:", result);

    if (!result.success && result.conflicts) {
      console.log("[EditEvent] Conflicts detected, showing modal");
      setDetectedConflicts(result.conflicts);
      setConflictModal(true);
    } else {
      console.log("[EditEvent] No conflicts, navigating back");
      router.back();
    }
  };

  const handleProceedWithConflict = async () => {
    if (!justification.trim()) {
      Alert.alert("Justification Required", "Please provide a justification for proceeding with this conflict.");
      return;
    }

    setLoading(true);

    const [startDay, startMonth, startYear] = startDate.split("-");
    const startDateTime = new Date(`${startYear}-${startMonth}-${startDay}T${startTime}`).toISOString();
    const [endDay, endMonth, endYear] = endDate.split("-");
    const endDateTime = new Date(`${endYear}-${endMonth}-${endDay}T${endTime}`).toISOString();

    await updateEvent(
      event.id,
      {
        title,
        description,
        location,
        startTime: startDateTime,
        endTime: endDateTime,
        priority,
        assignedTo: selectedUsers,
        commissionerRequired,
      },
      true,
      justification
    );

    setLoading(false);
    setConflictModal(false);
    router.back();
  };

  const getSeverityColor = (severity: Conflict["severity"]) => {
    switch (severity) {
      case "critical":
        return Colors.priority.critical;
      case "high":
        return Colors.priority.high;
      case "medium":
        return Colors.priority.medium;
      default:
        return Colors.priority.low;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: isMobile ? insets.top : 0, paddingBottom: isMobile ? insets.bottom : 0, backgroundColor: colors.background.main }]}>
        <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Edit Event</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.text.primary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={isMobile && styles.contentMobile}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Event Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background.card, borderColor: colors.border.light, color: colors.text.primary }]}
              placeholder="Enter event title"
              placeholderTextColor={Colors.text.disabled}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background.card, borderColor: colors.border.light, color: colors.text.primary }]}
              placeholder="Enter event description"
              placeholderTextColor={Colors.text.disabled}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text.primary }]}>Location *</Text>
            <View style={[styles.iconInput, { backgroundColor: colors.background.card, borderColor: colors.border.light }]}>
              <MapPin color={colors.text.secondary} size={20} />
              <TextInput
                style={[styles.iconInputText, { color: colors.text.primary }]}
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
            <Text style={[styles.label, { color: colors.text.primary }]}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(["critical", "high", "medium", "low"] as EventPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    { backgroundColor: priority === p ? colors.primary.main : Colors.neutral.gray100 },
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
                <Text style={[styles.label, { color: colors.text.primary }]}>Commissioner Required</Text>
                <Text style={[styles.toggleDescription, { color: colors.text.secondary }]}>
                  Mark if the commissioner must attend this event
                </Text>
              </View>
              <Switch
                value={commissionerRequired}
                onValueChange={setCommissionerRequired}
                trackColor={{ false: Colors.neutral.gray200, true: colors.primary.main }}
                thumbColor={colors.background.card}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Users color={colors.text.primary} size={20} />
              <Text style={[styles.label, { color: colors.text.primary }]}>Attendees *</Text>
            </View>
            <View style={styles.usersList}>
              {allUsers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userItem,
                    { backgroundColor: colors.background.card, borderColor: colors.border.light },
                    selectedUsers.includes(user.id) && { borderColor: colors.primary.main, backgroundColor: colors.primary.main + "10" },
                  ]}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text.primary }]}>{user.name}</Text>
                    <Text style={[styles.userRole, { color: colors.text.secondary }]}>{user.role}</Text>
                  </View>
                  {selectedUsers.includes(user.id) && (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary.main }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background.card, borderTopColor: colors.border.light }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: Colors.neutral.gray100 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary.main }, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={conflictModal}
          transparent
          animationType="fade"
          onRequestClose={() => setConflictModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, Platform.OS === "web" && { maxWidth: 500 }]}>
              <View style={styles.modalHeader}>
                <AlertTriangle color={Colors.status.warning} size={32} />
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Scheduling Conflict Detected</Text>
              </View>

              <Text style={[styles.modalDescription, { color: colors.text.secondary }]}>
                This event update conflicts with existing schedules. Review the conflicts below:
              </Text>

              <View style={styles.conflictsList}>
                {detectedConflicts.map((conflict, index) => (
                  <View key={conflict.id} style={[styles.conflictItem, { backgroundColor: colors.background.elevated }]}>
                    <View
                      style={[
                        styles.severityIndicator,
                        { backgroundColor: getSeverityColor(conflict.severity) },
                      ]}
                    />
                    <View style={styles.conflictDetails}>
                      <Text style={[styles.conflictTitle, { color: colors.text.primary }]}>
                        Conflict {index + 1}: {conflict.severity.toUpperCase()}
                      </Text>
                      <Text style={[styles.conflictText, { color: colors.text.secondary }]}>
                        {conflict.overlapDuration} minute overlap
                      </Text>
                      <Text style={[styles.conflictText, { color: colors.text.secondary }]}>
                        {conflict.affectedUserIds.length} attendee(s) affected
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.justificationSection}>
                <Text style={[styles.justificationLabel, { color: colors.text.primary }]}>
                  Justification (required to proceed) *
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background.card, borderColor: colors.border.light, color: colors.text.primary }]}
                  placeholder="Explain why this event must proceed despite conflicts..."
                  placeholderTextColor={Colors.text.disabled}
                  value={justification}
                  onChangeText={setJustification}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { backgroundColor: Colors.neutral.gray100 }]}
                  onPress={() => {
                    setConflictModal(false);
                    setJustification("");
                  }}
                >
                  <Text style={[styles.modalCancelText, { color: Colors.text.secondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalProceedButton, { backgroundColor: Colors.status.warning }]}
                  onPress={handleProceedWithConflict}
                >
                  <Text style={[styles.modalProceedText, { color: Colors.text.inverse }]}>Proceed Anyway</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    padding: 24,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginTop: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    textAlign: "center",
  },
  conflictsList: {
    gap: 12,
    marginBottom: 20,
  },
  conflictItem: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: Colors.neutral.gray50,
    borderRadius: 8,
  },
  severityIndicator: {
    width: 4,
    borderRadius: 2,
  },
  conflictDetails: {
    flex: 1,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  conflictText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  justificationSection: {
    marginBottom: 20,
  },
  justificationLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray100,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  modalProceedButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.status.warning,
    alignItems: "center",
  },
  modalProceedText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
});
