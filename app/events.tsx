import React, { useState, useMemo } from "react";
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
import { Plus, Calendar as CalendarIcon, Filter } from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import { useTheme } from "@/contexts/ThemeContext";
import EventCard from "@/components/EventCard";
import LeftNavigation from "@/components/LeftNavigation";
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { EventPriority } from "@/types";

type SortOption = "date" | "priority" | "title";
type FilterOption = "all" | "upcoming" | "past" | "conflicted";

export default function Events() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { events } = useEvents();
  const { colors } = useTheme();
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

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
              title="All Events"
              onMenuPress={() => setDrawerVisible(true)}
              rightButton={
                <TouchableOpacity
                  onPress={() => router.push("/create-event" as any)}
                >
                  <Plus color={colors.primary.main} size={24} />
                </TouchableOpacity>
              }
            />
          )}
          
          {!isMobile && (
            <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
              <View>
                <Text style={[styles.greeting, { color: colors.text.primary }]}>All Events</Text>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? "s" : ""} found
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

          <View style={[styles.controls, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, { borderColor: colors.primary.main }]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter color={colors.primary.main} size={18} />
                <Text style={[styles.filterButtonText, { color: colors.primary.main }]}>Filters</Text>
              </TouchableOpacity>

              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    { backgroundColor: colors.neutral.gray100 },
                    sortBy === "date" && { backgroundColor: colors.primary.main },
                  ]}
                  onPress={() => setSortBy("date")}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: colors.text.secondary },
                      sortBy === "date" && { color: colors.text.inverse },
                    ]}
                  >
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    { backgroundColor: colors.neutral.gray100 },
                    sortBy === "priority" && { backgroundColor: colors.primary.main },
                  ]}
                  onPress={() => setSortBy("priority")}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: colors.text.secondary },
                      sortBy === "priority" && { color: colors.text.inverse },
                    ]}
                  >
                    Priority
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    { backgroundColor: colors.neutral.gray100 },
                    sortBy === "title" && { backgroundColor: colors.primary.main },
                  ]}
                  onPress={() => setSortBy("title")}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      { color: colors.text.secondary },
                      sortBy === "title" && { color: colors.text.inverse },
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
                    { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                    filter === "all" && { backgroundColor: colors.primary.main + "20", borderColor: colors.primary.main },
                  ]}
                  onPress={() => setFilter("all")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "all" && { color: colors.primary.main },
                    ]}
                  >
                    All Events
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                    filter === "upcoming" && { backgroundColor: colors.primary.main + "20", borderColor: colors.primary.main },
                  ]}
                  onPress={() => setFilter("upcoming")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "upcoming" && { color: colors.primary.main },
                    ]}
                  >
                    Upcoming
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                    filter === "past" && { backgroundColor: colors.primary.main + "20", borderColor: colors.primary.main },
                  ]}
                  onPress={() => setFilter("past")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "past" && { color: colors.primary.main },
                    ]}
                  >
                    Past
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                    filter === "conflicted" && { backgroundColor: colors.primary.main + "20", borderColor: colors.primary.main },
                  ]}
                  onPress={() => setFilter("conflicted")}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: colors.text.secondary },
                      filter === "conflicted" && { color: colors.primary.main },
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
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.eventsList, isMobile && styles.eventsListMobile]}>
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
                <CalendarIcon color={colors.text.disabled} size={48} />
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>No events found</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.disabled }]}>
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
  controls: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
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
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  eventsList: {
    padding: 24,
    gap: 12,
  },
  eventsListMobile: {
    padding: 16,
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
