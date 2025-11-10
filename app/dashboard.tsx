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
import Colors from "@/constants/colors";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { upcomingEvents, unresolvedConflicts, conflictingEvents } = useEvents();
  const { currentUser } = useAuth();

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
      <View style={styles.container}>
        {!isMobile && <LeftNavigation />}
        {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile ? (
            <MobileHeader
              title="Dashboard"
              onMenuPress={() => setDrawerVisible(true)}
              rightButton={
                <TouchableOpacity onPress={() => router.push("/create-event" as any)}>
                  <Plus color={Colors.primary.main} size={24} />
                </TouchableOpacity>
              }
            />
          ) : (
            <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Welcome back, {currentUser?.name.split(" ")[0]}
              </Text>
              <Text style={styles.subtitle}>
                Here&apos;s what&apos;s happening in your department
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/create-event" as any)}
            >
              <Plus color={Colors.text.inverse} size={20} />
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
          )}

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: Colors.status.info + "10" }]}>
                <CalendarIcon color={Colors.status.info} size={24} />
                <Text style={styles.statValue}>{upcomingEvents.length}</Text>
                <Text style={styles.statLabel}>Upcoming Events</Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor:
                      unresolvedConflicts.length > 0
                        ? Colors.status.warning + "10"
                        : Colors.status.success + "10",
                  },
                ]}
              >
                <AlertTriangle
                  color={
                    unresolvedConflicts.length > 0
                      ? Colors.status.warning
                      : Colors.status.success
                  }
                  size={24}
                />
                <Text style={styles.statValue}>{unresolvedConflicts.length}</Text>
                <Text style={styles.statLabel}>Conflicts</Text>
              </View>

              <View
                style={[styles.statCard, { backgroundColor: Colors.accent.amber + "10" }]}
              >
                <CheckCircle color={Colors.accent.amber} size={24} />
                <Text style={styles.statValue}>{pendingResponses.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>

              <View
                style={[styles.statCard, { backgroundColor: Colors.primary.main + "10" }]}
              >
                <TrendingUp color={Colors.primary.main} size={24} />
                <Text style={styles.statValue}>
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
                <Text style={styles.statLabel}>Attendance Rate</Text>
              </View>
            </View>

            {unresolvedConflicts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AlertTriangle color={Colors.status.warning} size={20} />
                  <Text style={styles.sectionTitle}>Scheduling Conflicts</Text>
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
                    <Text style={styles.viewAllText}>
                      View all {conflictingEvents.length} conflicts
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {pendingResponses.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CheckCircle color={Colors.accent.amber} size={20} />
                  <Text style={styles.sectionTitle}>Pending Responses</Text>
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
                <CalendarIcon color={Colors.primary.main} size={20} />
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
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
                  <CalendarIcon color={Colors.text.disabled} size={48} />
                  <Text style={styles.emptyStateText}>No upcoming events</Text>
                  <Text style={styles.emptyStateSubtext}>
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
  contentMobile: {
    marginLeft: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    flexWrap: "wrap",
    gap: 12,
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
    color: Colors.text.primary,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
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
    color: Colors.text.primary,
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
    color: Colors.primary.main,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.disabled,
    marginTop: 4,
  },
});
