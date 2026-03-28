import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { Event } from "@/types";
import Colors from "@/constants/colors";
import { formatDate, formatTime } from "@/utils/dateFormatting";
import { useAuth } from "@/contexts/AuthContext";

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  compact?: boolean;
}

export default function EventCard({ event, onPress, compact = false }: EventCardProps) {
  const { currentUser } = useAuth();

  const getPriorityColor = (priority: Event["priority"]) => {
    switch (priority) {
      case "critical":
        return Colors.priority.critical;
      case "high":
        return Colors.priority.high;
      case "medium":
        return Colors.priority.medium;
      case "low":
        return Colors.priority.low;
    }
  };

  const getUserResponse = () => {
    if (!currentUser) return null;
    return event.responses.find((r) => r.userId === currentUser.id);
  };

  const getResponseColor = (status: string) => {
    switch (status) {
      case "attending":
        return Colors.response.attending;
      case "not-attending":
        return Colors.response.notAttending;
      case "maybe":
        return Colors.response.maybe;
      default:
        return Colors.response.pending;
    }
  };

  const userResponse = getUserResponse();
  const attendingCount = event.responses.filter((r) => r.status === "attending").length;

  return (
    <TouchableOpacity
      style={[styles.container, event.hasConflict && styles.containerConflict]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {event.hasConflict && (
            <View style={styles.conflictBadge}>
              <AlertTriangle color={Colors.status.warning} size={16} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        <View
          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(event.priority) }]}
        >
          <Text style={styles.priorityText}>
            {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
          </Text>
        </View>
      </View>

      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <CalendarIcon color={Colors.text.secondary} size={16} />
          <Text style={styles.detailText}>{formatDate(event.startTime)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock color={Colors.text.secondary} size={16} />
          <Text style={styles.detailText}>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <MapPin color={Colors.text.secondary} size={16} />
          <Text style={styles.detailText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Users color={Colors.text.secondary} size={16} />
          <Text style={styles.detailText}>
            {attendingCount}/{event.assignedTo.length} attending
          </Text>
        </View>
      </View>

      {userResponse && (
        <View style={styles.footer}>
          <View
            style={[
              styles.responseBadge,
              { backgroundColor: getResponseColor(userResponse.status) + "20" },
            ]}
          >
            <View
              style={[
                styles.responseDot,
                { backgroundColor: getResponseColor(userResponse.status) },
              ]}
            />
            <Text
              style={[
                styles.responseText,
                { color: getResponseColor(userResponse.status) },
              ]}
            >
              {userResponse.status === "attending"
                ? "You're attending"
                : userResponse.status === "not-attending"
                ? "You're not attending"
                : userResponse.status === "maybe"
                ? "You marked as maybe"
                : "Response pending"}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerConflict: {
    borderColor: Colors.status.warning,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  conflictBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.status.warning + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
    textTransform: "uppercase",
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: "45%",
  },
  detailText: {
    fontSize: 13,
    color: Colors.text.secondary,
    flex: 1,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  responseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  responseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  responseText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
