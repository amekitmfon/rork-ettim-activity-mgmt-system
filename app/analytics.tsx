import React, { useMemo, useState } from "react";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/contexts/EventsContext";
import LeftNavigation from "@/components/LeftNavigation";
import Colors from "@/constants/colors";


type TimeRange = "week" | "month" | "quarter" | "year";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
  { value: "year", label: "Last Year" },
];

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const { allUsers, hasPermission } = useAuth();
  const { events, conflicts } = useEvents();
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");

  const canAccessPage = hasPermission("director");

  const getDaysInRange = (range: TimeRange): number => {
    switch (range) {
      case "week":
        return 7;
      case "month":
        return 30;
      case "quarter":
        return 90;
      case "year":
        return 365;
    }
  };

  const analytics = useMemo(() => {
    const daysInRange = getDaysInRange(selectedRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInRange);
    const cutoffTime = cutoffDate.getTime();

    const filteredEvents = events.filter(
      (event) => new Date(event.createdAt).getTime() >= cutoffTime
    );

    const totalEvents = filteredEvents.length;
    const criticalEvents = filteredEvents.filter(
      (e) => e.priority === "critical"
    ).length;
    const highPriorityEvents = filteredEvents.filter(
      (e) => e.priority === "high"
    ).length;

    const eventsWithResponses = filteredEvents.filter(
      (e) => e.responses.length > 0
    );
    const totalResponses = eventsWithResponses.reduce(
      (sum, event) => sum + event.responses.length,
      0
    );
    const attendingResponses = eventsWithResponses.reduce(
      (sum, event) =>
        sum + event.responses.filter((r) => r.status === "attending").length,
      0
    );
    const pendingResponses = eventsWithResponses.reduce(
      (sum, event) =>
        sum + event.responses.filter((r) => r.status === "pending").length,
      0
    );
    const declinedResponses = eventsWithResponses.reduce(
      (sum, event) =>
        sum + event.responses.filter((r) => r.status === "not-attending").length,
      0
    );

    const overallAttendanceRate =
      totalResponses > 0
        ? Math.round((attendingResponses / totalResponses) * 100)
        : 0;

    const conflictsInRange = conflicts.filter((conflict) => {
      const conflictEvents = conflict.eventIds
        .map((id) => events.find((e) => e.id === id))
        .filter(Boolean);
      return conflictEvents.some(
        (event) => event && new Date(event.createdAt).getTime() >= cutoffTime
      );
    });

    const totalConflicts = conflictsInRange.length;
    const resolvedConflicts = conflictsInRange.filter((c) => c.isResolved).length;
    const unresolvedConflicts = totalConflicts - resolvedConflicts;
    const criticalConflicts = conflictsInRange.filter(
      (c) => c.severity === "critical"
    ).length;

    const conflictResolutionRate =
      totalConflicts > 0
        ? Math.round((resolvedConflicts / totalConflicts) * 100)
        : 0;

    const userPerformance = allUsers.map((user) => {
      const userEvents = filteredEvents.filter((event) =>
        event.assignedTo.includes(user.id)
      );
      const userResponses = userEvents.flatMap((event) =>
        event.responses.filter((r) => r.userId === user.id)
      );
      const attending = userResponses.filter(
        (r) => r.status === "attending"
      ).length;
      const total = userResponses.length;
      const rate = total > 0 ? Math.round((attending / total) * 100) : 0;

      return {
        user,
        totalEvents: userEvents.length,
        attendanceRate: rate,
        attending,
        pending: userResponses.filter((r) => r.status === "pending").length,
      };
    });

    userPerformance.sort((a, b) => b.attendanceRate - a.attendanceRate);

    const eventsByPriority = {
      critical: criticalEvents,
      high: highPriorityEvents,
      medium: filteredEvents.filter((e) => e.priority === "medium").length,
      low: filteredEvents.filter((e) => e.priority === "low").length,
    };

    const avgResponseTime = eventsWithResponses.length > 0
      ? eventsWithResponses.reduce((sum, event) => {
          const eventCreated = new Date(event.createdAt).getTime();
          const responses = event.responses.filter((r) => r.status !== "pending");
          if (responses.length === 0) return sum;
          
          const avgTime = responses.reduce((rSum, response) => {
            const responseTime = new Date(response.timestamp).getTime();
            return rSum + (responseTime - eventCreated);
          }, 0) / responses.length;
          
          return sum + avgTime;
        }, 0) / eventsWithResponses.length
      : 0;

    const avgResponseHours = Math.round(avgResponseTime / (1000 * 60 * 60));

    return {
      totalEvents,
      criticalEvents,
      highPriorityEvents,
      totalResponses,
      attendingResponses,
      pendingResponses,
      declinedResponses,
      overallAttendanceRate,
      totalConflicts,
      resolvedConflicts,
      unresolvedConflicts,
      criticalConflicts,
      conflictResolutionRate,
      eventsByPriority,
      avgResponseHours,
    };
  }, [events, conflicts, allUsers, selectedRange]);

  const renderMetricCard = (
    icon: React.ReactElement,
    title: string,
    value: string | number,
    subtitle: string,
    trend?: "up" | "down",
    trendValue?: string,
    color: string = Colors.primary.main
  ) => {
    return (
      <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <View style={styles.metricHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
            <Text>{icon}</Text>
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>{title}</Text>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricSubtitle}>{subtitle}</Text>
            {trend && trendValue && (
              <View style={styles.trendContainer}>
                {trend === "up" ? (
                  <TrendingUp
                    color={Colors.status.success}
                    size={14}
                  />
                ) : (
                  <TrendingDown
                    color={Colors.status.error}
                    size={14}
                  />
                )}
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        trend === "up"
                          ? Colors.status.success
                          : Colors.status.error,
                    },
                  ]}
                >
                  {trendValue}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!canAccessPage) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LeftNavigation />
        <View style={styles.content}>
          <View style={styles.accessDenied}>
            <Text style={styles.accessDeniedText}>Access Denied</Text>
            <Text style={styles.accessDeniedSubtext}>
              You do not have permission to access this page.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LeftNavigation />
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <BarChart3 color={Colors.primary.main} size={28} />
                <Text style={styles.title}>Analytics & Reports</Text>
              </View>
              <Text style={styles.subtitle}>
                Department performance metrics and insights
              </Text>
            </View>
            <View style={styles.rangeSelector}>
              {TIME_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.value}
                  style={[
                    styles.rangeButton,
                    selectedRange === range.value && styles.rangeButtonActive,
                  ]}
                  onPress={() => setSelectedRange(range.value)}
                >
                  <Text
                    style={[
                      styles.rangeButtonText,
                      selectedRange === range.value &&
                        styles.rangeButtonTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  <Calendar color={Colors.status.info} size={24} />,
                  "Total Events",
                  analytics.totalEvents,
                  `${analytics.criticalEvents} critical, ${analytics.highPriorityEvents} high priority`,
                  undefined,
                  undefined,
                  Colors.status.info
                )}
                {renderMetricCard(
                  <CheckCircle color={Colors.status.success} size={24} />,
                  "Attendance Rate",
                  `${analytics.overallAttendanceRate}%`,
                  `${analytics.attendingResponses} attending out of ${analytics.totalResponses} responses`,
                  analytics.overallAttendanceRate > 75 ? "up" : "down",
                  analytics.overallAttendanceRate > 75 ? "Excellent" : "Needs Attention",
                  Colors.status.success
                )}
                {renderMetricCard(
                  <AlertTriangle color={Colors.status.warning} size={24} />,
                  "Active Conflicts",
                  analytics.unresolvedConflicts,
                  `${analytics.resolvedConflicts} resolved, ${analytics.conflictResolutionRate}% resolution rate`,
                  analytics.unresolvedConflicts === 0 ? "up" : "down",
                  analytics.unresolvedConflicts === 0 ? "No conflicts" : "Attention needed",
                  Colors.status.warning
                )}
                {renderMetricCard(
                  <Clock color={Colors.accent.amber} size={24} />,
                  "Avg Response Time",
                  analytics.avgResponseHours > 0 ? `${analytics.avgResponseHours}h` : "N/A",
                  `${analytics.pendingResponses} pending responses`,
                  analytics.avgResponseHours < 24 ? "up" : "down",
                  analytics.avgResponseHours < 24 ? "Fast" : "Slow",
                  Colors.accent.amber
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Events by Priority</Text>
              <View style={styles.priorityChart}>
                <View style={styles.priorityBar}>
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.critical || 1,
                        backgroundColor: Colors.status.error,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.high || 1,
                        backgroundColor: Colors.status.warning,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.medium || 1,
                        backgroundColor: Colors.status.info,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.low || 1,
                        backgroundColor: Colors.neutral.gray400,
                      },
                    ]}
                  />
                </View>
                <View style={styles.priorityLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: Colors.status.error },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      Critical ({analytics.eventsByPriority.critical})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: Colors.status.warning },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      High ({analytics.eventsByPriority.high})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: Colors.status.info },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      Medium ({analytics.eventsByPriority.medium})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: Colors.neutral.gray400 },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      Low ({analytics.eventsByPriority.low})
                    </Text>
                  </View>
                </View>
              </View>
            </View>



            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conflict Analysis</Text>
              <View style={styles.conflictStats}>
                <View style={styles.conflictStatCard}>
                  <AlertTriangle color={Colors.status.error} size={32} />
                  <Text style={styles.conflictStatValue}>
                    {analytics.criticalConflicts}
                  </Text>
                  <Text style={styles.conflictStatLabel}>
                    Critical Conflicts
                  </Text>
                </View>
                <View style={styles.conflictStatCard}>
                  <CheckCircle color={Colors.status.success} size={32} />
                  <Text style={styles.conflictStatValue}>
                    {analytics.resolvedConflicts}
                  </Text>
                  <Text style={styles.conflictStatLabel}>Resolved</Text>
                </View>
                <View style={styles.conflictStatCard}>
                  <Clock color={Colors.accent.amber} size={32} />
                  <Text style={styles.conflictStatValue}>
                    {analytics.unresolvedConflicts}
                  </Text>
                  <Text style={styles.conflictStatLabel}>Pending</Text>
                </View>
                <View style={styles.conflictStatCard}>
                  <Target color={Colors.primary.main} size={32} />
                  <Text style={styles.conflictStatValue}>
                    {analytics.conflictResolutionRate}%
                  </Text>
                  <Text style={styles.conflictStatLabel}>Resolution Rate</Text>
                </View>
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
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        marginLeft: 280,
      },
    }),
  },
  header: {
    padding: 24,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  rangeSelector: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray50,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  rangeButtonActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  rangeButtonTextActive: {
    color: Colors.text.inverse,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  metricHeader: {
    flexDirection: "row",
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  priorityChart: {
    gap: 16,
  },
  priorityBar: {
    flexDirection: "row",
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
  },
  prioritySegment: {
    height: "100%",
  },
  priorityLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  conflictStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  conflictStatCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: "center",
  },
  conflictStatValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginTop: 12,
  },
  conflictStatLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
