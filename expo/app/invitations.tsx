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
  useWindowDimensions,
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
import { useTheme } from "@/contexts/ThemeContext";
import LeftNavigation from "@/components/LeftNavigation";
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import DateTimePicker from "@/components/DateTimePicker";
import { Invitation } from "@/types";

export default function Invitations() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { invitations, updateInvitationStatus, addInvitation } = useInvitations();
  const { addEvent } = useEvents();
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

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
          { backgroundColor: colors.background.card, borderColor: colors.border.light },
          invitation.hasConflict && { borderColor: colors.status.warning, borderWidth: 2 },
        ]}
      >
        {invitation.hasConflict && (
          <View style={[styles.conflictBanner, { backgroundColor: colors.status.warning }]}>
            <AlertTriangle color={colors.text.inverse} size={16} />
            <Text style={[styles.conflictBannerText, { color: colors.text.inverse }]}>
              Date conflicts with existing event
            </Text>
          </View>
        )}

        <View style={styles.invitationHeader}>
          <Mail color={colors.primary.main} size={24} />
          <View style={styles.invitationHeaderText}>
            <Text style={[styles.invitationTitle, { color: colors.text.primary }]}>{invitation.title}</Text>
            <Text style={[styles.invitationOrganizer, { color: colors.text.secondary }]}>From: {invitation.organizer}</Text>
          </View>
        </View>

        <Text style={[styles.invitationDescription, { color: colors.text.secondary }]}>{invitation.description}</Text>

        <View style={styles.invitationDetails}>
          <View style={styles.detailRow}>
            <CalendarIcon color={colors.text.secondary} size={16} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
              {new Date(`${invitation.eventDate}T${invitation.eventTime}`).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at {invitation.eventTime}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin color={colors.text.secondary} size={16} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>{invitation.location}</Text>
          </View>
        </View>

        {isPending && (
          <View style={styles.invitationActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton, { backgroundColor: colors.neutral.gray100, borderColor: colors.status.error }]}
              onPress={() => handleDecline(invitation)}
            >
              <X color={colors.status.error} size={18} />
              <Text style={[styles.declineButtonText, { color: colors.status.error }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.status.success }]}
              onPress={() => handleAccept(invitation)}
            >
              <Check color={colors.text.inverse} size={18} />
              <Text style={[styles.acceptButtonText, { color: colors.text.inverse }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            style={[styles.scheduleButton, { backgroundColor: colors.primary.main }]}
            onPress={() => handleScheduleEvent(invitation)}
          >
            <CalendarIcon color={colors.text.inverse} size={18} />
            <Text style={[styles.scheduleButtonText, { color: colors.text.inverse }]}>Schedule Event</Text>
          </TouchableOpacity>
        )}

        {invitation.status === "declined" && (
          <View style={[styles.statusBadge, { backgroundColor: colors.neutral.gray100 }]}>
            <Text style={[styles.statusBadgeText, { color: colors.text.secondary }]}>Declined</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: isMobile ? 0 : insets.top, backgroundColor: colors.background.main }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && (
          <MobileNavDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
          />
        )}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile && (
            <MobileHeader
              title="Invitations"
              onMenuPress={() => setDrawerVisible(true)}
              rightButton={
                <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                  <Plus color={colors.primary.main} size={24} />
                </TouchableOpacity>
              }
            />
          )}
          
          {!isMobile && (
            <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
              <View>
                <Text style={[styles.greeting, { color: colors.text.primary }]}>Invitations</Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Manage all department invitations</Text>
              </View>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary.main }]}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus color={colors.text.inverse} size={20} />
                <Text style={[styles.createButtonText, { color: colors.text.inverse }]}>Add Invitation</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {pendingInvitations.length > 0 && (
              <View style={[styles.section, isMobile && styles.sectionMobile]}>
                <View style={styles.sectionHeader}>
                  <Mail color={colors.accent.amber} size={20} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Pending ({pendingInvitations.length})
                  </Text>
                </View>
                <View style={styles.invitationsList}>
                  {pendingInvitations.map(renderInvitationCard)}
                </View>
              </View>
            )}

            {acceptedInvitations.length > 0 && (
              <View style={[styles.section, isMobile && styles.sectionMobile]}>
                <View style={styles.sectionHeader}>
                  <Check color={colors.status.success} size={20} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Accepted ({acceptedInvitations.length})
                  </Text>
                </View>
                <View style={styles.invitationsList}>
                  {acceptedInvitations.map(renderInvitationCard)}
                </View>
              </View>
            )}

            {declinedInvitations.length > 0 && (
              <View style={[styles.section, isMobile && styles.sectionMobile]}>
                <View style={styles.sectionHeader}>
                  <X color={colors.text.disabled} size={20} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
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
                <Mail color={colors.text.disabled} size={64} />
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>No invitations</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.disabled }]}>
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
          <View style={[styles.modalContent, { backgroundColor: colors.background.card }, Platform.OS === "web" && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Create Invitation</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X color={colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Title *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light, color: colors.text.primary }]}
                  placeholder="Event title"
                  placeholderTextColor={colors.text.disabled}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light, color: colors.text.primary }]}
                  placeholder="Event description"
                  placeholderTextColor={colors.text.disabled}
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
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Location *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light, color: colors.text.primary }]}
                  placeholder="Event location"
                  placeholderTextColor={colors.text.disabled}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Organizer *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light, color: colors.text.primary }]}
                  placeholder="Organizer name"
                  placeholderTextColor={colors.text.disabled}
                  value={organizer}
                  onChangeText={setOrganizer}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Invitation Letter</Text>
                <TouchableOpacity
                  style={[styles.uploadButton, { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light }]}
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
                      <FileText color={colors.primary.main} size={20} />
                      <Text style={[styles.uploadedFileName, { color: colors.text.primary }]}>{documentName}</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadContent}>
                      <Upload color={colors.text.secondary} size={20} />
                      <Text style={[styles.uploadText, { color: colors.text.secondary }]}>Upload invitation letter</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral.gray100 }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: colors.primary.main }]}
                onPress={handleCreateInvitation}
              >
                <Text style={[styles.modalSaveText, { color: colors.text.inverse }]}>Create</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.background.card }, Platform.OS === "web" && { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Schedule Event</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <X color={colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.text.secondary }]}>
              Add this invitation to your calendar as an event?
            </Text>

            {selectedInvitation?.hasConflict && (
              <View style={[styles.conflictWarning, { backgroundColor: colors.status.warning + "20" }]}>
                <AlertTriangle color={colors.status.warning} size={20} />
                <Text style={[styles.conflictWarningText, { color: colors.status.warning }]}>
                  This event conflicts with existing events on your calendar
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutral.gray100 }]}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text.secondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: colors.primary.main }]}
                onPress={confirmScheduleEvent}
              >
                <Text style={[styles.modalSaveText, { color: colors.text.inverse }]}>Confirm</Text>
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
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        marginLeft: 280,
      },
    }),
  },
  contentMobile: {
    marginLeft: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    padding: 24,
  },
  sectionMobile: {
    padding: 16,
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
  },
  invitationsList: {
    gap: 16,
  },
  invitationCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  conflictBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  conflictBannerText: {
    fontSize: 12,
    fontWeight: "600" as const,
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
  },
  invitationOrganizer: {
    fontSize: 12,
    marginTop: 4,
  },
  invitationDescription: {
    fontSize: 14,
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
  acceptButton: {},
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  declineButton: {
    borderWidth: 1,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
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
  },
  modalDescription: {
    fontSize: 14,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  conflictWarningText: {
    flex: 1,
    fontSize: 13,
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
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  uploadButton: {
    borderWidth: 2,
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
  },
  uploadedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uploadedFileName: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
