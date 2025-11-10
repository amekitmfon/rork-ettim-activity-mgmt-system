import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, AlertTriangle, MapPin, Users } from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import { useAuth } from "@/contexts/AuthContext";
import DateTimePicker from "@/components/DateTimePicker";
import Colors from "@/constants/colors";
import { EventPriority, Conflict } from "@/types";

export default function CreateEvent() {
  const insets = useSafeAreaInsets();
  const { addEvent } = useEvents();
  const { currentUser, allUsers } = useAuth();

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

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
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

    const result = await addEvent({
      title,
      description,
      location,
      startTime: startDateTime,
      endTime: endDateTime,
      priority,
      createdBy: currentUser?.id || "",
      assignedTo: selectedUsers,
      tags: [],
      commissionerRequired,
    });

    setLoading(false);

    if (!result.success && result.conflicts) {
      setDetectedConflicts(result.conflicts);
      setConflictModal(true);
    } else {
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

    await addEvent(
      {
        title,
        description,
        location,
        startTime: startDateTime,
        endTime: endDateTime,
        priority,
        createdBy: currentUser?.id || "",
        assignedTo: selectedUsers,
        tags: [],
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
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create New Event</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={Colors.text.primary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter event title"
              placeholderTextColor={Colors.text.disabled}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter event description"
              placeholderTextColor={Colors.text.disabled}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Location *</Text>
            <View style={styles.iconInput}>
              <MapPin color={Colors.text.secondary} size={20} />
              <TextInput
                style={styles.iconInputText}
                placeholder="Enter location"
                placeholderTextColor={Colors.text.disabled}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={styles.row}>
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

          <View style={styles.row}>
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
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(["critical", "high", "medium", "low"] as EventPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && { backgroundColor: Colors.primary.main },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p && { color: Colors.text.inverse },
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
                <Text style={styles.label}>Commissioner Required</Text>
                <Text style={styles.toggleDescription}>
                  Mark if the commissioner must attend this event
                </Text>
              </View>
              <Switch
                value={commissionerRequired}
                onValueChange={setCommissionerRequired}
                trackColor={{ false: Colors.neutral.gray200, true: Colors.primary.main }}
                thumbColor={Colors.background.card}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Users color={Colors.text.primary} size={20} />
              <Text style={styles.label}>Attendees *</Text>
            </View>
            <View style={styles.usersList}>
              {allUsers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userItem,
                    selectedUsers.includes(user.id) && styles.userItemSelected,
                  ]}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userRole}>{user.role}</Text>
                  </View>
                  {selectedUsers.includes(user.id) && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? "Creating..." : "Create Event"}
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
                <Text style={styles.modalTitle}>Scheduling Conflict Detected</Text>
              </View>

              <Text style={styles.modalDescription}>
                This event conflicts with existing schedules. Review the conflicts below:
              </Text>

              <View style={styles.conflictsList}>
                {detectedConflicts.map((conflict, index) => (
                  <View key={conflict.id} style={styles.conflictItem}>
                    <View
                      style={[
                        styles.severityIndicator,
                        { backgroundColor: getSeverityColor(conflict.severity) },
                      ]}
                    />
                    <View style={styles.conflictDetails}>
                      <Text style={styles.conflictTitle}>
                        Conflict {index + 1}: {conflict.severity.toUpperCase()}
                      </Text>
                      <Text style={styles.conflictText}>
                        {conflict.overlapDuration} minute overlap
                      </Text>
                      <Text style={styles.conflictText}>
                        {conflict.affectedUserIds.length} attendee(s) affected
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.justificationSection}>
                <Text style={styles.justificationLabel}>
                  Justification (required to proceed) *
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
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
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setConflictModal(false);
                    setJustification("");
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalProceedButton}
                  onPress={handleProceedWithConflict}
                >
                  <Text style={styles.modalProceedText}>Proceed Anyway</Text>
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
    backgroundColor: Colors.background.main,
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
  userItemSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + "10",
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
  createButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
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
