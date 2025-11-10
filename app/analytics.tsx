import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
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
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { useTheme } from "@/contexts/ThemeContext";

type TimeRange = "week" | "month" | "quarter" | "year";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
  { value: "year", label: "Last Year" },
];

export default function Analytics() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { allUsers, hasPermission } = useAuth();
  const { events, conflicts } = useEvents();
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
  const { colors } = useTheme();

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
    color: string = colors.primary.main
  ) => {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.background.card, borderLeftColor: color, borderLeftWidth: 4, borderColor: colors.border.light }]}>
        <View style={styles.metricHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
            <Text>{icon}</Text>
          </View>
          <View style={styles.metricContent}>
            <Text style={[styles.metricTitle, { color: colors.text.secondary }]}>{title}</Text>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>{value}</Text>
            <Text style={[styles.metricSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
            {trend && trendValue && (
              <View style={styles.trendContainer}>
                {trend === "up" ? (
                  <TrendingUp
                    color={colors.status.success}
                    size={14}
                  />
                ) : (
                  <TrendingDown
                    color={colors.status.error}
                    size={14}
                  />
                )}
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        trend === "up"
                          ? colors.status.success
                          : colors.status.error,
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
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: colors.background.main }]}>
          {!isMobile && <LeftNavigation />}
          {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
          <View style={[styles.content, isMobile && styles.contentMobile]}>
            {isMobile && <MobileHeader title="Analytics" onMenuPress={() => setDrawerVisible(true)} />}
            <View style={styles.accessDenied}>
              <Text style={[styles.accessDeniedText, { color: colors.text.primary }]}>Access Denied</Text>
              <Text style={[styles.accessDeniedSubtext, { color: colors.text.secondary }]}>
                You do not have permission to access this page.
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background.main }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile ? (
            <MobileHeader title="Analytics" onMenuPress={() => setDrawerVisible(true)} />
          ) : (
            <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
              <View>
                <View style={styles.titleRow}>
                  <BarChart3 color={colors.primary.main} size={28} />
                  <Text style={[styles.title, { color: colors.text.primary }]}>Analytics & Reports</Text>
                </View>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  Department performance metrics and insights
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.rangeContainer, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rangeSelector}
            >
              {TIME_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.value}
                  style={[
                    styles.rangeButton,
                    { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                    selectedRange === range.value && { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
                  ]}
                  onPress={() => setSelectedRange(range.value)}
                >
                  <Text
                    style={[
                      styles.rangeButtonText,
                      { color: colors.text.secondary },
                      selectedRange === range.value && { color: colors.text.inverse, fontWeight: "600" as const },
                    ]}
                  >
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Overview</Text>
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  <Calendar color={colors.status.info} size={24} />,
                  "Total Events",
                  analytics.totalEvents,
                  `${analytics.criticalEvents} critical, ${analytics.highPriorityEvents} high priority`,
                  undefined,
                  undefined,
                  colors.status.info
                )}
                {renderMetricCard(
                  <CheckCircle color={colors.status.success} size={24} />,
                  "Attendance Rate",
                  `${analytics.overallAttendanceRate}%`,
                  `${analytics.attendingResponses} attending out of ${analytics.totalResponses} responses`,
                  analytics.overallAttendanceRate > 75 ? "up" : "down",
                  analytics.overallAttendanceRate > 75 ? "Excellent" : "Needs Attention",
                  colors.status.success
                )}
                {renderMetricCard(
                  <AlertTriangle color={colors.status.warning} size={24} />,
                  "Active Conflicts",
                  analytics.unresolvedConflicts,
                  `${analytics.resolvedConflicts} resolved, ${analytics.conflictResolutionRate}% resolution rate`,
                  analytics.unresolvedConflicts === 0 ? "up" : "down",
                  analytics.unresolvedConflicts === 0 ? "No conflicts" : "Attention needed",
                  colors.status.warning
                )}
                {renderMetricCard(
                  <Clock color={colors.accent.amber} size={24} />,
                  "Avg Response Time",
                  analytics.avgResponseHours > 0 ? `${analytics.avgResponseHours}h` : "N/A",
                  `${analytics.pendingResponses} pending responses`,
                  analytics.avgResponseHours < 24 ? "up" : "down",
                  analytics.avgResponseHours < 24 ? "Fast" : "Slow",
                  colors.accent.amber
                )}
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Events by Priority</Text>
              <View style={styles.priorityChart}>
                <View style={styles.priorityBar}>
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.critical || 1,
                        backgroundColor: colors.status.error,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.high || 1,
                        backgroundColor: colors.status.warning,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.medium || 1,
                        backgroundColor: colors.status.info,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.prioritySegment,
                      {
                        flex: analytics.eventsByPriority.low || 1,
                        backgroundColor: colors.neutral.gray400,
                      },
                    ]}
                  />
                </View>
                <View style={styles.priorityLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.status.error },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.text.secondary }]}>
                      Critical ({analytics.eventsByPriority.critical})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.status.warning },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.text.secondary }]}>
                      High ({analytics.eventsByPriority.high})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.status.info },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.text.secondary }]}>
                      Medium ({analytics.eventsByPriority.medium})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.neutral.gray400 },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.text.secondary }]}>
                      Low ({analytics.eventsByPriority.low})
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Conflict Analysis</Text>
              <View style={styles.conflictStats}>
                <View style={[styles.conflictStatCard, { backgroundColor: colors.background.card, borderColor: colors.border.light }]}>
                  <AlertTriangle color={colors.status.error} size={32} />
                  <Text style={[styles.conflictStatValue, { color: colors.text.primary }]}>
                    {analytics.criticalConflicts}
                  </Text>
                  <Text style={[styles.conflictStatLabel, { color: colors.text.secondary }]}>
                    Critical Conflicts
                  </Text>
                </View>
                <View style={[styles.conflictStatCard, { backgroundColor: colors.background.card, borderColor: colors.border.light }]}>
                  <CheckCircle color={colors.status.success} size={32} />
                  <Text style={[styles.conflictStatValue, { color: colors.text.primary }]}>
                    {analytics.resolvedConflicts}
                  </Text>
                  <Text style={[styles.conflictStatLabel, { color: colors.text.secondary }]}>Resolved</Text>
                </View>
                <View style={[styles.conflictStatCard, { backgroundColor: colors.background.card, borderColor: colors.border.light }]}>
                  <Clock color={colors.accent.amber} size={32} />
                  <Text style={[styles.conflictStatValue, { color: colors.text.primary }]}>
                    {analytics.unresolvedConflicts}
                  </Text>
                  <Text style={[styles.conflictStatLabel, { color: colors.text.secondary }]}>Pending</Text>
                </View>
                <View style={[styles.conflictStatCard, { backgroundColor: colors.background.card, borderColor: colors.border.light }]}>
                  <Target color={colors.primary.main} size={32} />
                  <Text style={[styles.conflictStatValue, { color: colors.text.primary }]}>
                    {analytics.conflictResolutionRate}%
                  </Text>
                  <Text style={[styles.conflictStatLabel, { color: colors.text.secondary }]}>Resolution Rate</Text>
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
    padding: 24,
    borderBottomWidth: 1,
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
  },
  subtitle: {
    fontSize: 14,
  },
  rangeContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  rangeSelector: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
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
  },
  conflictStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  conflictStatCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  conflictStatValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginTop: 12,
  },
  conflictStatLabel: {
    fontSize: 13,
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
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    textAlign: "center",
  },
});
