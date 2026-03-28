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
import { Plus, Calendar as CalendarIcon, List, Grid3x3 } from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import EventCard from "@/components/EventCard";
import LeftNavigation from "@/components/LeftNavigation";
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { EventPriority } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

type ViewMode = "list" | "calendar";
type SortOption = "date" | "priority" | "title";

export default function Calendar() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { events } = useEvents();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { colors } = useTheme();

  const sortedEvents = useMemo(() => {
    const sorted = [...events];
    
    switch (sortBy) {
      case "date":
        sorted.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        break;
      case "priority":
        const priorityOrder: Record<EventPriority, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        sorted.sort((a, b) => 
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  }, [events, sortBy]);

  const upcomingEvents = sortedEvents.filter(
    (e) => new Date(e.startTime).getTime() > Date.now()
  );

  const pastEvents = sortedEvents.filter(
    (e) => new Date(e.startTime).getTime() <= Date.now()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedDate);
    const days: React.ReactElement[] = [];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const eventsOnDay = getEventsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            { borderColor: colors.border.light },
            isToday && { backgroundColor: colors.primary.main + "20", borderColor: colors.primary.main },
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[
            styles.calendarDayText,
            { color: colors.text.primary },
            isToday && { color: colors.primary.main },
          ]}>
            {day}
          </Text>
          {eventsOnDay.length > 0 && (
            <View style={[styles.eventIndicator, { backgroundColor: colors.primary.main }]}>
              <Text style={[styles.eventIndicatorText, { color: colors.text.inverse }]}>{eventsOnDay.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={[styles.monthButton, { backgroundColor: colors.neutral.gray100 }]}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
          >
            <Text style={[styles.monthButtonText, { color: colors.text.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity
            style={[styles.monthButton, { backgroundColor: colors.neutral.gray100 }]}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
          >
            <Text style={[styles.monthButtonText, { color: colors.text.primary }]}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDay}>
              <Text style={[styles.weekDayText, { color: colors.text.secondary }]}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days}
        </View>

        <View style={[styles.selectedDateEvents, { borderTopColor: colors.border.light }]}>
          <Text style={[styles.selectedDateTitle, { color: colors.text.primary }]}>
            Events on {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </Text>
          {getEventsForDate(selectedDate).length > 0 ? (
            <View style={styles.eventsList}>
              {getEventsForDate(selectedDate).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.noEventsText, { color: colors.text.secondary }]}>No events on this date</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background.main }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile ? (
            <MobileHeader
              title="Calendar"
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
              <Text style={[styles.greeting, { color: colors.text.primary }]}>Calendar</Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                View and manage all department events
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
            <View style={[styles.viewToggle, { backgroundColor: colors.neutral.gray100 }]}>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "list" && { backgroundColor: colors.primary.main },
                ]}
                onPress={() => setViewMode("list")}
              >
                <List
                  color={viewMode === "list" ? colors.text.inverse : colors.text.secondary}
                  size={18}
                />
                <Text
                  style={[
                    styles.viewButtonText,
                    { color: viewMode === "list" ? colors.text.inverse : colors.text.secondary },
                    viewMode === "list" && { fontWeight: "600" as const },
                  ]}
                >
                  List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "calendar" && { backgroundColor: colors.primary.main },
                ]}
                onPress={() => setViewMode("calendar")}
              >
                <Grid3x3
                  color={viewMode === "calendar" ? colors.text.inverse : colors.text.secondary}
                  size={18}
                />
                <Text
                  style={[
                    styles.viewButtonText,
                    { color: viewMode === "calendar" ? colors.text.inverse : colors.text.secondary },
                    viewMode === "calendar" && { fontWeight: "600" as const },
                  ]}
                >
                  Calendar
                </Text>
              </TouchableOpacity>
            </View>

            {viewMode === "list" && (
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
                      { color: sortBy === "date" ? colors.text.inverse : colors.text.secondary },
                      sortBy === "date" && { fontWeight: "600" as const },
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
                      { color: sortBy === "priority" ? colors.text.inverse : colors.text.secondary },
                      sortBy === "priority" && { fontWeight: "600" as const },
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
                      { color: sortBy === "title" ? colors.text.inverse : colors.text.secondary },
                      sortBy === "title" && { fontWeight: "600" as const },
                    ]}
                  >
                    Title
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {viewMode === "list" ? (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <CalendarIcon color={colors.primary.main} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                      Upcoming Events ({upcomingEvents.length})
                    </Text>
                  </View>
                  <View style={styles.eventsList}>
                    {upcomingEvents.map((event) => (
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

                {pastEvents.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <CalendarIcon color={colors.text.secondary} size={20} />
                      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                        Past Events ({pastEvents.length})
                      </Text>
                    </View>
                    <View style={styles.eventsList}>
                      {pastEvents.slice(0, 10).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onPress={() => router.push(`/event/${event.id}` as any)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.section}>
                {renderCalendarView()}
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
  controls: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 8,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
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
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  weekDaysRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderWidth: 1,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  eventIndicator: {
    marginTop: 4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  eventIndicatorText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  selectedDateEvents: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});
