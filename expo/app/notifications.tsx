import React, { useState, useMemo } from "react";
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
  Bell,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Filter,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/contexts/EventsContext";
import LeftNavigation from "@/components/LeftNavigation";
import Colors from "@/constants/colors";

type NotificationType = "all" | "event" | "conflict" | "response" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  useAuth();
  const { events, conflicts } = useEvents();
  const [selectedFilter, setSelectedFilter] = useState<NotificationType>("all");

  const mockNotifications: Notification[] = useMemo(() => {
    const notifications: Notification[] = [];

    events.slice(0, 5).forEach((event) => {
      notifications.push({
        id: `notif-event-${event.id}`,
        type: "event",
        title: "New Event Assignment",
        description: `You have been assigned to "${event.title}"`,
        timestamp: event.createdAt,
        read: false,
        priority: event.priority === "critical" ? "high" : "medium",
      });
    });

    conflicts.slice(0, 3).forEach((conflict) => {
      notifications.push({
        id: `notif-conflict-${conflict.id}`,
        type: "conflict",
        title: "Scheduling Conflict Detected",
        description: `${conflict.affectedUserIds.length} team members affected`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: conflict.severity === "critical" ? "high" : "medium",
      });
    });

    notifications.push({
      id: "notif-system-1",
      type: "system",
      title: "System Update",
      description: "New features are now available in the platform",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: "low",
    });

    return notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events, conflicts]);

  const filteredNotifications = useMemo(() => {
    if (selectedFilter === "all") return mockNotifications;
    return mockNotifications.filter((notif) => notif.type === selectedFilter);
  }, [mockNotifications, selectedFilter]);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "event":
        return <Calendar color={Colors.status.info} size={20} />;
      case "conflict":
        return <AlertTriangle color={Colors.status.warning} size={20} />;
      case "response":
        return <CheckCircle color={Colors.status.success} size={20} />;
      case "system":
        return <Bell color={Colors.text.secondary} size={20} />;
      default:
        return <Bell color={Colors.text.secondary} size={20} />;
    }
  };

  const renderNotification = (notification: Notification) => {
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.notificationCardUnread,
        ]}
        onPress={() => {
          console.log("Notification pressed:", notification.id);
        }}
      >
        <View style={styles.notificationIcon}>
          <Text>{getNotificationIcon(notification.type)}</Text>
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationDescription}>
            {notification.description}
          </Text>
          <View style={styles.notificationFooter}>
            <Clock color={Colors.text.disabled} size={12} />
            <Text style={styles.notificationTime}>
              {new Date(notification.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    notification.priority === "high"
                      ? Colors.status.error + "15"
                      : notification.priority === "medium"
                      ? Colors.status.warning + "15"
                      : Colors.neutral.gray100,
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  {
                    color:
                      notification.priority === "high"
                        ? Colors.status.error
                        : notification.priority === "medium"
                        ? Colors.status.warning
                        : Colors.text.secondary,
                  },
                ]}
              >
                {notification.priority}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
              <View style={styles.titleRow}>
                <Bell color={Colors.primary.main} size={28} />
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>
                Stay updated with department activities
              </Text>
            </View>
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={() => {
                console.log("Mark all as read");
              }}
            >
              <CheckCircle color={Colors.primary.main} size={18} />
              <Text style={styles.markAllButtonText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterBar}>
            <Filter color={Colors.text.secondary} size={18} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {(["all", "event", "conflict", "response", "system"] as NotificationType[]).map(
                (type) => {
                  const count =
                    type === "all"
                      ? mockNotifications.length
                      : mockNotifications.filter((n) => n.type === type).length;

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        selectedFilter === type && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedFilter(type)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFilter === type && styles.filterChipTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.notificationsList}>
              {filteredNotifications.map(renderNotification)}
            </View>

            {filteredNotifications.length === 0 && (
              <View style={styles.emptyState}>
                <Bell color={Colors.text.disabled} size={64} />
                <Text style={styles.emptyStateText}>No notifications</Text>
                <Text style={styles.emptyStateSubtext}>
                  You are all caught up!
                </Text>
              </View>
            )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  },
  badge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text.inverse,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray50,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray50,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  notificationCardUnread: {
    backgroundColor: Colors.primary.main + "08",
    borderColor: Colors.primary.main + "30",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
  },
  notificationDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.text.disabled,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: "auto",
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase",
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
});
