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
import { Plus, Calendar as CalendarIcon, List, Grid3x3 } from "lucide-react-native";
import { router, Stack } from "expo-router";
import { useEvents } from "@/contexts/EventsContext";
import EventCard from "@/components/EventCard";
import LeftNavigation from "@/components/LeftNavigation";
import Colors from "@/constants/colors";
import { EventPriority } from "@/types";

type ViewMode = "list" | "calendar";
type SortOption = "date" | "priority" | "title";

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const { events } = useEvents();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [selectedDate, setSelectedDate] = useState(new Date());

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
          style={[styles.calendarDay, isToday && styles.calendarDayToday]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>
            {day}
          </Text>
          {eventsOnDay.length > 0 && (
            <View style={styles.eventIndicator}>
              <Text style={styles.eventIndicatorText}>{eventsOnDay.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
          >
            <Text style={styles.monthButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
          >
            <Text style={styles.monthButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDay}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days}
        </View>

        <View style={styles.selectedDateEvents}>
          <Text style={styles.selectedDateTitle}>
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
            <Text style={styles.noEventsText}>No events on this date</Text>
          )}
        </View>
      </View>
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
              <Text style={styles.greeting}>Calendar</Text>
              <Text style={styles.subtitle}>
                View and manage all department events
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
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "list" && styles.viewButtonActive,
                ]}
                onPress={() => setViewMode("list")}
              >
                <List
                  color={viewMode === "list" ? Colors.text.inverse : Colors.text.secondary}
                  size={18}
                />
                <Text
                  style={[
                    styles.viewButtonText,
                    viewMode === "list" && styles.viewButtonTextActive,
                  ]}
                >
                  List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewButton,
                  viewMode === "calendar" && styles.viewButtonActive,
                ]}
                onPress={() => setViewMode("calendar")}
              >
                <Grid3x3
                  color={viewMode === "calendar" ? Colors.text.inverse : Colors.text.secondary}
                  size={18}
                />
                <Text
                  style={[
                    styles.viewButtonText,
                    viewMode === "calendar" && styles.viewButtonTextActive,
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
                    <CalendarIcon color={Colors.primary.main} size={20} />
                    <Text style={styles.sectionTitle}>
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
                      <CalendarIcon color={Colors.text.disabled} size={48} />
                      <Text style={styles.emptyStateText}>No upcoming events</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Create an event to get started
                      </Text>
                    </View>
                  )}
                </View>

                {pastEvents.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <CalendarIcon color={Colors.text.secondary} size={20} />
                      <Text style={styles.sectionTitle}>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.neutral.gray100,
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
  viewButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  viewButtonTextActive: {
    color: Colors.text.inverse,
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
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
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  monthButton: {
    padding: 8,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: 8,
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
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
    color: Colors.text.secondary,
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
    borderColor: Colors.border.light,
  },
  calendarDayToday: {
    backgroundColor: Colors.primary.main + "20",
    borderColor: Colors.primary.main,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  calendarDayTextToday: {
    color: Colors.primary.main,
  },
  eventIndicator: {
    marginTop: 4,
    backgroundColor: Colors.primary.main,
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
    color: Colors.text.inverse,
  },
  selectedDateEvents: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    paddingVertical: 24,
  },
});
