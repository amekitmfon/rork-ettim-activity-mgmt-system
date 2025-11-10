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
  AlertTriangle,
  Plus,
  TrendingUp,
  Calendar as CalendarIcon,
  CheckCircle,
} from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "@/components/EventCard";
import LeftNavigation from "@/components/LeftNavigation";
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { useTheme } from "@/contexts/ThemeContext";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { upcomingEvents, unresolvedConflicts, conflictingEvents } = useEvents();
  const { currentUser } = useAuth();
  const { colors } = useTheme();

  const getPendingResponses = () => {
    return upcomingEvents.filter((event) => {
      const response = event.responses.find((r) => r.userId === currentUser?.id);
      return response?.status === "pending";
    });
  };

  const pendingResponses = getPendingResponses();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background.main }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile ? (
            <MobileHeader
              title="Dashboard"
              onMenuPress={() => setDrawerVisible(true)}
              rightButton={
                <TouchableOpacity onPress={() => router.push("/create-event" as any)}>
                  <Plus color={colors.primary.main} size={24} />
                </TouchableOpacity>
              }
            />
          ) : (
            <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
            <View>
              <Text style={[styles.greeting, { color: colors.text.primary }]}>
                Welcome back, {currentUser?.name.split(" ")[0]}
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Here&apos;s what&apos;s happening in your department
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary.main }]}
              onPress={() => router.push("/create-event" as any)}
            >
              <Plus color={colors.text.inverse} size={20} />
              <Text style={[styles.createButtonText, { color: colors.text.inverse }]}>Create Event</Text>
            </TouchableOpacity>
          </View>
          )}

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.status.info + "10" }]}>
                <CalendarIcon color={colors.status.info} size={24} />
                <Text style={[styles.statValue, { color: colors.text.primary }]}>{upcomingEvents.length}</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Upcoming Events</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor:
                      unresolvedConflicts.length > 0
                        ? colors.status.warning + "10"
                        : colors.status.success + "10",
                  },
                ]}
              >
                <AlertTriangle
                  color={
                    unresolvedConflicts.length > 0
                      ? colors.status.warning
                      : colors.status.success
                  }
                  size={24}
                />
                <Text style={[styles.statValue, { color: colors.text.primary }]}>{unresolvedConflicts.length}</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Conflicts</Text>
              </View>

              <View
                style={[styles.statCard, { backgroundColor: colors.accent.amber + "10" }]}
              >
                <CheckCircle color={colors.accent.amber} size={24} />
                <Text style={[styles.statValue, { color: colors.text.primary }]}>{pendingResponses.length}</Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Pending</Text>
              </View>

              <View
                style={[styles.statCard, { backgroundColor: colors.primary.main + "10" }]}
              >
                <TrendingUp color={colors.primary.main} size={24} />
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {Math.round(
                    (upcomingEvents.filter((e) =>
                      e.responses.find(
                        (r) => r.userId === currentUser?.id && r.status === "attending"
                      )
                    ).length /
                      upcomingEvents.length) *
                      100
                  ) || 0}
                  %
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Attendance Rate</Text>
              </View>
            </View>

            {unresolvedConflicts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AlertTriangle color={colors.status.warning} size={20} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Scheduling Conflicts</Text>
                </View>
                <View style={styles.conflictsList}>
                  {conflictingEvents.slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPress={() => router.push(`/event/${event.id}` as any)}
                      compact
                    />
                  ))}
                </View>
                {conflictingEvents.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => router.push("/conflicts" as any)}
                  >
                    <Text style={[styles.viewAllText, { color: colors.primary.main }]}>
                      View all {conflictingEvents.length} conflicts
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {pendingResponses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CheckCircle color={colors.accent.amber} size={20} />
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Pending Responses</Text>
                </View>
                <View style={styles.eventsList}>
                  {pendingResponses.slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPress={() => router.push(`/event/${event.id}` as any)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CalendarIcon color={colors.primary.main} size={20} />
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Upcoming Events</Text>
              </View>
              <View style={styles.eventsList}>
                {upcomingEvents.slice(0, 5).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/event/${event.id}` as any)}
                  />
                ))}
              </View>
              {upcomingEvents.length === 0 && (
                <View style={styles.emptyState}>
                  <CalendarIcon color={colors.text.disabled} size={48} />
                  <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>No upcoming events</Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.text.disabled }]}>
                    Create an event to get started
                  </Text>
                </View>
              )}
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
    flexWrap: "wrap",
    gap: 12,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: 200,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  section: {
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
  eventsList: {
    gap: 12,
  },
  conflictsList: {
    gap: 12,
  },
  viewAllButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});
