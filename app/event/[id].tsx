import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
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
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { useTheme } from "@/contexts/ThemeContext";

export default function EventDetail() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);
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
      <View style={[styles.container, { paddingTop: isMobile ? 0 : insets.top, backgroundColor: colors.background }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile ? (
            <MobileHeader
              title="Event Details"
              onMenuPress={() => setDrawerVisible(true)}
              rightButton={
                canEdit ? (
                  <TouchableOpacity onPress={handleEdit}>
                    <Edit3 color={colors.primary} size={24} />
                  </TouchableOpacity>
                ) : null
              }
            />
          ) : (
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
          )}

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={isMobile && styles.scrollContentMobile}>
            <View style={[styles.eventHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }, isMobile && styles.eventHeaderMobile]}>
              {event.hasConflict && (
                <View style={styles.conflictWarning}>
                  <AlertTriangle color={Colors.status.warning} size={20} />
                  <Text style={styles.conflictWarningText}>
                    This event has a scheduling conflict
                  </Text>
                </View>
              )}

              <View style={[styles.titleSection, isMobile && styles.titleSectionMobile]}>
                <Text style={[styles.eventTitle, { color: colors.text }, isMobile && styles.eventTitleMobile]}>{event.title}</Text>
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

              <Text style={[styles.eventDescription, { color: colors.textSecondary }]}>{event.description}</Text>
            </View>

            <View style={[styles.detailsSection, isMobile && styles.detailsSectionMobile]}>
              <View style={styles.detailRow}>
                <CalendarIcon color={Colors.primary.main} size={24} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(event.startTime)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Clock color={Colors.primary.main} size={24} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <MapPin color={Colors.primary.main} size={24} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{event.location}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.responseSection, { backgroundColor: colors.card }, isMobile && styles.responseSectionMobile]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Response</Text>
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

            <View style={[styles.attendeesSection, { backgroundColor: colors.card }, isMobile && styles.attendeesSectionMobile]}>
              <View style={styles.attendeesHeader}>
                <Users color={colors.text} size={20} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Attendees ({event.responses.length})
                </Text>
              </View>
              <View style={styles.attendeesList}>
                {event.responses.map((response) => {
                  const user = allUsers.find((u) => u.id === response.userId);
                  if (!user) return null;

                  return (
                    <View key={response.userId} style={[styles.attendeeItem, { backgroundColor: colors.neutral.gray50 }]}>
                      <View style={styles.attendeeInfo}>
                        <Text style={[styles.attendeeName, { color: colors.text }]}>{user.name}</Text>
                        <Text style={[styles.attendeeRole, { color: colors.textSecondary }]}>{user.role}</Text>
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
  contentMobile: {
    marginLeft: 0,
  },
  scrollContentMobile: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    borderBottomWidth: 1,
  },
  eventHeaderMobile: {
    padding: 16,
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
  titleSectionMobile: {
    flexDirection: "column",
    gap: 12,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    flex: 1,
    marginRight: 16,
  },
  eventTitleMobile: {
    fontSize: 22,
    flex: 0,
    marginRight: 0,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text.inverse,
  },
  eventDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailsSection: {
    padding: 24,
    gap: 20,
  },
  detailsSectionMobile: {
    padding: 16,
    gap: 16,
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  responseSection: {
    padding: 24,
    marginBottom: 16,
  },
  responseSectionMobile: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
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
  },
  attendeesSectionMobile: {
    padding: 16,
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
    borderRadius: 8,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  attendeeRole: {
    fontSize: 12,
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
