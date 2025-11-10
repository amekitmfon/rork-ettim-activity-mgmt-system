import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  Mail,
  Check,
  X,
  AlertTriangle,
  Calendar as CalendarIcon,
  MapPin,
  Upload,
  FileText,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { useInvitations } from "@/contexts/InvitationsContext";
import { useEvents } from "@/contexts/EventsContext";
import LeftNavigation from "@/components/LeftNavigation";
import DateTimePicker from "@/components/DateTimePicker";
import Colors from "@/constants/colors";
import { Invitation } from "@/types";

export default function Invitations() {
  const insets = useSafeAreaInsets();
  const { invitations, updateInvitationStatus, addInvitation } = useInvitations();
  const { addEvent } = useEvents();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [documentUri, setDocumentUri] = useState("");
  const [documentName, setDocumentName] = useState("");

  const handleAccept = async (invitation: Invitation) => {
    await updateInvitationStatus(invitation.id, "accepted");
    Alert.alert("Success", "Invitation accepted");
  };

  const handleDecline = async (invitation: Invitation) => {
    await updateInvitationStatus(invitation.id, "declined");
    Alert.alert("Success", "Invitation declined");
  };

  const handleScheduleEvent = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowScheduleModal(true);
  };

  const confirmScheduleEvent = async () => {
    if (!selectedInvitation) return;

    const startDateTime = new Date(`${selectedInvitation.eventDate}T${selectedInvitation.eventTime}`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString();

    const result = await addEvent({
      title: selectedInvitation.title,
      description: selectedInvitation.description,
      location: selectedInvitation.location,
      startTime: startDateTime,
      endTime: endDateTime,
      priority: "high",
      createdBy: "1",
      assignedTo: ["1"],
      tags: ["invitation"],
      commissionerRequired: false,
    });

    if (result.success) {
      Alert.alert("Success", "Event added to calendar");
      setShowScheduleModal(false);
      setSelectedInvitation(null);
    } else if (result.conflicts) {
      Alert.alert(
        "Conflict Detected",
        `This event conflicts with ${result.conflicts.length} existing event(s). Please check your calendar.`
      );
      setShowScheduleModal(false);
      setSelectedInvitation(null);
    }
  };

  const handleCreateInvitation = async () => {
    if (!title || !eventDate || !eventTime || !location || !organizer) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    const [day, month, year] = eventDate.split("-");
    const formattedEventDate = `${year}-${month}-${day}`;

    await addInvitation({
      title,
      description,
      invitationDate: new Date().toISOString(),
      eventDate: formattedEventDate,
      eventTime,
      location,
      organizer,
      status: "pending",
      notes: "",
      documentUri: documentUri || undefined,
    });

    setShowCreateModal(false);
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setOrganizer("");
    setDocumentUri("");
    setDocumentName("");
    Alert.alert("Success", "Invitation created");
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
  const acceptedInvitations = invitations.filter((inv) => inv.status === "accepted");
  const declinedInvitations = invitations.filter((inv) => inv.status === "declined");

  const renderInvitationCard = (invitation: Invitation) => {
    const isPending = invitation.status === "pending";
    const isAccepted = invitation.status === "accepted";

    return (
      <View
        key={invitation.id}
        style={[
          styles.invitationCard,
          invitation.hasConflict && styles.invitationCardConflict,
        ]}
      >
        {invitation.hasConflict && (
          <View style={styles.conflictBanner}>
            <AlertTriangle color={Colors.text.inverse} size={16} />
            <Text style={styles.conflictBannerText}>
              Date conflicts with existing event
            </Text>
          </View>
        )}

        <View style={styles.invitationHeader}>
          <Mail color={Colors.primary.main} size={24} />
          <View style={styles.invitationHeaderText}>
            <Text style={styles.invitationTitle}>{invitation.title}</Text>
            <Text style={styles.invitationOrganizer}>From: {invitation.organizer}</Text>
          </View>
        </View>

        <Text style={styles.invitationDescription}>{invitation.description}</Text>

        <View style={styles.invitationDetails}>
          <View style={styles.detailRow}>
            <CalendarIcon color={Colors.text.secondary} size={16} />
            <Text style={styles.detailText}>
              {new Date(`${invitation.eventDate}T${invitation.eventTime}`).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at {invitation.eventTime}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin color={Colors.text.secondary} size={16} />
            <Text style={styles.detailText}>{invitation.location}</Text>
          </View>
        </View>

        {isPending && (
          <View style={styles.invitationActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDecline(invitation)}
            >
              <X color={Colors.status.error} size={18} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(invitation)}
            >
              <Check color={Colors.text.inverse} size={18} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => handleScheduleEvent(invitation)}
          >
            <CalendarIcon color={Colors.text.inverse} size={18} />
            <Text style={styles.scheduleButtonText}>Schedule Event</Text>
          </TouchableOpacity>
        )}

        {invitation.status === "declined" && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Declined</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LeftNavigation />
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Invitations</Text>
              <Text style={styles.subtitle}>Manage all department invitations</Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus color={Colors.text.inverse} size={20} />
              <Text style={styles.createButtonText}>Add Invitation</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {pendingInvitations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Mail color={Colors.accent.amber} size={20} />
                  <Text style={styles.sectionTitle}>
                    Pending ({pendingInvitations.length})
                  </Text>
                </View>
                <View style={styles.invitationsList}>
                  {pendingInvitations.map(renderInvitationCard)}
                </View>
              </View>
            )}

            {acceptedInvitations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Check color={Colors.status.success} size={20} />
                  <Text style={styles.sectionTitle}>
                    Accepted ({acceptedInvitations.length})
                  </Text>
                </View>
                <View style={styles.invitationsList}>
                  {acceptedInvitations.map(renderInvitationCard)}
                </View>
              </View>
            )}

            {declinedInvitations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <X color={Colors.text.disabled} size={20} />
                  <Text style={styles.sectionTitle}>
                    Declined ({declinedInvitations.length})
                  </Text>
                </View>
                <View style={styles.invitationsList}>
                  {declinedInvitations.map(renderInvitationCard)}
                </View>
              </View>
            )}

            {invitations.length === 0 && (
              <View style={styles.emptyState}>
                <Mail color={Colors.text.disabled} size={64} />
                <Text style={styles.emptyStateText}>No invitations</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create an invitation to get started
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, Platform.OS === "web" && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Invitation</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X color={Colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event title"
                  placeholderTextColor={Colors.text.disabled}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Event description"
                  placeholderTextColor={Colors.text.disabled}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputSection}>
                <DateTimePicker
                  label="Event Date *"
                  value={eventDate}
                  onChange={setEventDate}
                  mode="date"
                />
              </View>

              <View style={styles.inputSection}>
                <DateTimePicker
                  label="Event Time *"
                  value={eventTime}
                  onChange={setEventTime}
                  mode="time"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Event location"
                  placeholderTextColor={Colors.text.disabled}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Organizer *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Organizer name"
                  placeholderTextColor={Colors.text.disabled}
                  value={organizer}
                  onChangeText={setOrganizer}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Invitation Letter</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    if (Platform.OS === "web") {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.doc,.docx,image/*";
                      input.onchange = (e: any) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDocumentName(file.name);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setDocumentUri(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    } else {
                      Alert.alert("Info", "File picker not available on mobile yet");
                    }
                  }}
                >
                  {documentName ? (
                    <View style={styles.uploadedFile}>
                      <FileText color={Colors.primary.main} size={20} />
                      <Text style={styles.uploadedFileName}>{documentName}</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadContent}>
                      <Upload color={Colors.text.secondary} size={20} />
                      <Text style={styles.uploadText}>Upload invitation letter</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateInvitation}
              >
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showScheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, Platform.OS === "web" && { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Event</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <X color={Colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Add this invitation to your calendar as an event?
            </Text>

            {selectedInvitation?.hasConflict && (
              <View style={styles.conflictWarning}>
                <AlertTriangle color={Colors.status.warning} size={20} />
                <Text style={styles.conflictWarningText}>
                  This event conflicts with existing events on your calendar
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={confirmScheduleEvent}
              >
                <Text style={styles.modalSaveText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.background.main,
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        marginLeft: 280,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  invitationsList: {
    gap: 16,
  },
  invitationCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  invitationCardConflict: {
    borderColor: Colors.status.warning,
    borderWidth: 2,
  },
  conflictBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.status.warning,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  conflictBannerText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
  invitationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  invitationHeaderText: {
    flex: 1,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  invitationOrganizer: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  invitationDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  invitationDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  invitationActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: Colors.status.success,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
  declineButton: {
    backgroundColor: Colors.neutral.gray100,
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.status.error,
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.neutral.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.disabled,
    marginTop: 8,
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.neutral.gray50,
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  conflictWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.status.warning + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  conflictWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.status.warning,
    fontWeight: "600" as const,
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
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
  uploadButton: {
    backgroundColor: Colors.neutral.gray50,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadContent: {
    alignItems: "center",
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  uploadedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uploadedFileName: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: "600" as const,
  },
});
