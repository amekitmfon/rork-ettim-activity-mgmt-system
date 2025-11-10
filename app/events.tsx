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
import { Plus, Calendar as CalendarIcon, Filter } from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import EventCard from "@/components/EventCard";
import LeftNavigation from "@/components/LeftNavigation";
import Colors from "@/constants/colors";
import { EventPriority } from "@/types";

type SortOption = "date" | "priority" | "title";
type FilterOption = "all" | "upcoming" | "past" | "conflicted";

export default function Events() {
  const insets = useSafeAreaInsets();
  const { events } = useEvents();
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];
    const now = Date.now();

    switch (filter) {
      case "upcoming":
        filtered = filtered.filter((e) => new Date(e.startTime).getTime() > now);
        break;
      case "past":
        filtered = filtered.filter((e) => new Date(e.startTime).getTime() <= now);
        break;
      case "conflicted":
        filtered = filtered.filter((e) => e.hasConflict);
        break;
    }

    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        break;
      case "priority":
        const priorityOrder: Record<EventPriority, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        filtered.sort((a, b) => 
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [events, sortBy, filter]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LeftNavigation />
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>All Events</Text>
              <Text style={styles.subtitle}>
                {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? "s" : ""} found
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

          <View style={styles.controls}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter color={Colors.primary.main} size={18} />
                <Text style={styles.filterButtonText}>Filters</Text>
              </TouchableOpacity>

              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "date" && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy("date")}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === "date" && styles.sortButtonTextActive,
                    ]}
                  >
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "priority" && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy("priority")}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === "priority" && styles.sortButtonTextActive,
                    ]}
                  >
                    Priority
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "title" && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy("title")}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === "title" && styles.sortButtonTextActive,
                    ]}
                  >
                    Title
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showFilters && (
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filter === "all" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilter("all")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filter === "all" && styles.filterOptionTextActive,
                    ]}
                  >
                    All Events
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filter === "upcoming" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilter("upcoming")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filter === "upcoming" && styles.filterOptionTextActive,
                    ]}
                  >
                    Upcoming
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filter === "past" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilter("past")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filter === "past" && styles.filterOptionTextActive,
                    ]}
                  >
                    Past
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filter === "conflicted" && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilter("conflicted")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filter === "conflicted" && styles.filterOptionTextActive,
                    ]}
                  >
                    Conflicted
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.eventsList}>
              {filteredAndSortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                />
              ))}
            </View>
            {filteredAndSortedEvents.length === 0 && (
              <View style={styles.emptyState}>
                <CalendarIcon color={Colors.text.disabled} size={48} />
                <Text style={styles.emptyStateText}>No events found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your filters
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
  controls: {
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary.main,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray100,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  sortButtonTextActive: {
    color: Colors.text.inverse,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray50,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary.main + "20",
    borderColor: Colors.primary.main,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  filterOptionTextActive: {
    color: Colors.primary.main,
  },
  scrollView: {
    flex: 1,
  },
  eventsList: {
    padding: 24,
    gap: 12,
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
