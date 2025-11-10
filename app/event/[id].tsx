import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Check,
  X,
  HelpCircle,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Edit3,
} from "lucide-react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { formatDate, formatTime } from "@/utils/dateFormatting";
import LeftNavigation from "@/components/LeftNavigation";
import { useTheme } from "@/contexts/ThemeContext";

export default function EventDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { events, updateEventResponse } = useEvents();
  const { currentUser, allUsers } = useAuth();
  const { colors } = useTheme();

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Text>Event not found</Text>
        </View>
      </>
    );
  }

  const userResponse = event.responses.find((r) => r.userId === currentUser?.id);

  const handleResponse = async (status: "attending" | "not-attending" | "maybe") => {
    if (!currentUser) return;
    await updateEventResponse(event.id, currentUser.id, status);
  };

  const handleEdit = () => {
    router.push(`/edit-event/${event.id}`);
  };

  const canEdit = currentUser?.id === event.createdBy || currentUser?.role === "commissioner" || currentUser?.role === "director";

  const getResponseButtonStyle = (status: string) => {
    if (userResponse?.status === status) {
      return {
        backgroundColor:
          status === "attending"
            ? Colors.response.attending
            : status === "not-attending"
            ? Colors.response.notAttending
            : Colors.response.maybe,
      };
    }
    return {
      backgroundColor: Colors.neutral.gray100,
    };
  };

  const getResponseButtonTextStyle = (status: string) => {
    if (userResponse?.status === status) {
      return { color: Colors.text.inverse };
    }
    return { color: Colors.text.secondary };
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LeftNavigation />
        <View style={styles.content}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Event Details</Text>
            {canEdit ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
              >
                <Edit3 color={colors.primary} size={20} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.eventHeader}>
              {event.hasConflict && (
                <View style={styles.conflictWarning}>
                  <AlertTriangle color={Colors.status.warning} size={20} />
                  <Text style={styles.conflictWarningText}>
                    This event has a scheduling conflict
                  </Text>
                </View>
              )}

              <View style={styles.titleSection}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        event.priority === "critical"
                          ? Colors.priority.critical
                          : event.priority === "high"
                          ? Colors.priority.high
                          : event.priority === "medium"
                          ? Colors.priority.medium
                          : Colors.priority.low,
                    },
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {event.priority.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventDescription}>{event.description}</Text>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <CalendarIcon color={Colors.primary.main} size={24} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(event.startTime)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Clock color={Colors.primary.main} size={24} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MapPin color={Colors.primary.main} size={24} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
              </View>
            </View>

            <View style={styles.responseSection}>
              <Text style={styles.sectionTitle}>Your Response</Text>
              <View style={styles.responseButtons}>
                <TouchableOpacity
                  style={[styles.responseButton, getResponseButtonStyle("attending")]}
                  onPress={() => handleResponse("attending")}
                >
                  <Check
                    color={
                      userResponse?.status === "attending"
                        ? Colors.text.inverse
                        : Colors.text.secondary
                    }
                    size={20}
                  />
                  <Text
                    style={[
                      styles.responseButtonText,
                      getResponseButtonTextStyle("attending"),
                    ]}
                  >
                    Will Attend
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.responseButton,
                    getResponseButtonStyle("not-attending"),
                  ]}
                  onPress={() => handleResponse("not-attending")}
                >
                  <X
                    color={
                      userResponse?.status === "not-attending"
                        ? Colors.text.inverse
                        : Colors.text.secondary
                    }
                    size={20}
                  />
                  <Text
                    style={[
                      styles.responseButtonText,
                      getResponseButtonTextStyle("not-attending"),
                    ]}
                  >
                    Will Not Attend
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.responseButton, getResponseButtonStyle("maybe")]}
                  onPress={() => handleResponse("maybe")}
                >
                  <HelpCircle
                    color={
                      userResponse?.status === "maybe"
                        ? Colors.text.inverse
                        : Colors.text.secondary
                    }
                    size={20}
                  />
                  <Text
                    style={[
                      styles.responseButtonText,
                      getResponseButtonTextStyle("maybe"),
                    ]}
                  >
                    Maybe
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.attendeesSection}>
              <View style={styles.attendeesHeader}>
                <Users color={Colors.text.primary} size={20} />
                <Text style={styles.sectionTitle}>
                  Attendees ({event.responses.length})
                </Text>
              </View>
              <View style={styles.attendeesList}>
                {event.responses.map((response) => {
                  const user = allUsers.find((u) => u.id === response.userId);
                  if (!user) return null;

                  return (
                    <View key={response.userId} style={styles.attendeeItem}>
                      <View style={styles.attendeeInfo}>
                        <Text style={styles.attendeeName}>{user.name}</Text>
                        <Text style={styles.attendeeRole}>{user.role}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              response.status === "attending"
                                ? Colors.response.attending + "20"
                                : response.status === "not-attending"
                                ? Colors.response.notAttending + "20"
                                : response.status === "maybe"
                                ? Colors.response.maybe + "20"
                                : Colors.response.pending + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                response.status === "attending"
                                  ? Colors.response.attending
                                  : response.status === "not-attending"
                                  ? Colors.response.notAttending
                                  : response.status === "maybe"
                                  ? Colors.response.maybe
                                  : Colors.response.pending,
                            },
                          ]}
                        >
                          {response.status === "attending"
                            ? "Attending"
                            : response.status === "not-attending"
                            ? "Not Attending"
                            : response.status === "maybe"
                            ? "Maybe"
                            : "Pending"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.background.main,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  eventHeader: {
    padding: 24,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  conflictWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.status.warning + "10",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  conflictWarningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.status.warning,
    fontWeight: "500" as const,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    flex: 1,
    marginRight: 16,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text.inverse,
  },
  eventDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.secondary,
  },
  detailsSection: {
    padding: 24,
    gap: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  responseSection: {
    padding: 24,
    backgroundColor: Colors.background.card,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  responseButtons: {
    gap: 12,
  },
  responseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 8,
  },
  responseButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  attendeesSection: {
    padding: 24,
    backgroundColor: Colors.background.card,
  },
  attendeesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  attendeesList: {
    gap: 12,
  },
  attendeeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.neutral.gray50,
    borderRadius: 8,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  attendeeRole: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
});
