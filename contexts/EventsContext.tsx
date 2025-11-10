import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Event, Conflict, EventResponseStatus } from "@/types";
import { useAuth } from "./AuthContext";

const INITIAL_EVENTS: Event[] = [
  {
    id: "1",
    title: "Budget Review Meeting",
    description: "Quarterly budget review and allocation discussion",
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: "Conference Room A",
    priority: "critical",
    createdBy: "1",
    assignedTo: ["1", "2", "3"],
    responses: [],
    hasConflict: false,
    conflictIds: [],
    requiresJustification: false,
    tags: ["budget", "quarterly"],
    commissionerRequired: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Staff Training Session",
    description: "New policy implementation training for all staff members",
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    location: "Training Hall",
    priority: "high",
    createdBy: "2",
    assignedTo: ["2", "3", "4"],
    responses: [],
    hasConflict: true,
    conflictIds: ["conflict-1"],
    requiresJustification: false,
    tags: ["training", "policy"],
    commissionerRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Community Outreach Event",
    description: "Public engagement session with community leaders",
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    location: "City Hall",
    priority: "medium",
    createdBy: "1",
    assignedTo: ["1", "2"],
    responses: [
      { userId: "1", status: "attending", timestamp: new Date().toISOString() },
    ],
    hasConflict: false,
    conflictIds: [],
    requiresJustification: false,
    tags: ["community", "outreach"],
    commissionerRequired: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_CONFLICTS: Conflict[] = [
  {
    id: "conflict-1",
    severity: "high",
    eventIds: ["1", "2"],
    affectedUserIds: ["2", "3"],
    type: "time-overlap",
    overlapDuration: 90,
    isResolved: false,
  },
];

export const [EventsProvider, useEvents] = createContextHook(() => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("events");
      if (stored) {
        setEvents(JSON.parse(stored));
      } else {
        setEvents(INITIAL_EVENTS);
        await AsyncStorage.setItem("events", JSON.stringify(INITIAL_EVENTS));
      }
      
      const storedConflicts = await AsyncStorage.getItem("conflicts");
      if (storedConflicts) {
        setConflicts(JSON.parse(storedConflicts));
      } else {
        setConflicts(INITIAL_CONFLICTS);
        await AsyncStorage.setItem("conflicts", JSON.stringify(INITIAL_CONFLICTS));
      }
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents(INITIAL_EVENTS);
      setConflicts(INITIAL_CONFLICTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const detectConflicts = useCallback((newEvent: Event, existingEvents: Event[]): Conflict[] => {
    const detectedConflicts: Conflict[] = [];
    const newStart = new Date(newEvent.startTime).getTime();
    const newEnd = new Date(newEvent.endTime).getTime();

    existingEvents.forEach((existing) => {
      if (existing.id === newEvent.id) return;

      const existingStart = new Date(existing.startTime).getTime();
      const existingEnd = new Date(existing.endTime).getTime();

      if (newStart < existingEnd && newEnd > existingStart) {
        const overlapStart = Math.max(newStart, existingStart);
        const overlapEnd = Math.min(newEnd, existingEnd);
        const overlapDuration = Math.round((overlapEnd - overlapStart) / (1000 * 60));

        const sharedUsers = newEvent.assignedTo.filter((userId) =>
          existing.assignedTo.includes(userId)
        );

        if (sharedUsers.length > 0) {
          const isCommissionerInvolved = sharedUsers.includes("1");
          const severity: Conflict["severity"] = 
            existing.priority === "critical" || newEvent.priority === "critical"
              ? "critical"
              : isCommissionerInvolved
              ? "high"
              : "medium";

          detectedConflicts.push({
            id: `conflict-${Date.now()}-${Math.random()}`,
            severity,
            eventIds: [newEvent.id, existing.id],
            affectedUserIds: sharedUsers,
            type: isCommissionerInvolved ? "commissioner-priority" : "time-overlap",
            overlapDuration,
            isResolved: false,
          });
        }
      }
    });

    return detectedConflicts;
  }, []);

  const addEvent = useCallback(async (
    event: Omit<Event, "id" | "createdAt" | "updatedAt" | "responses" | "hasConflict" | "conflictIds" | "requiresJustification">,
    proceedDespiteConflict?: boolean,
    justification?: string
  ): Promise<{ success: boolean; conflicts?: Conflict[] }> => {
    const newEvent: Event = {
      ...event,
      id: `event-${Date.now()}`,
      responses: event.assignedTo.map((userId) => ({
        userId,
        status: "pending" as EventResponseStatus,
        timestamp: new Date().toISOString(),
      })),
      hasConflict: false,
      conflictIds: [],
      requiresJustification: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const detectedConflicts = detectConflicts(newEvent, events);

    if (detectedConflicts.length > 0 && !proceedDespiteConflict) {
      return { success: false, conflicts: detectedConflicts };
    }

    if (detectedConflicts.length > 0 && proceedDespiteConflict) {
      newEvent.hasConflict = true;
      newEvent.conflictIds = detectedConflicts.map((c) => c.id);
      newEvent.requiresJustification = true;
      newEvent.justification = justification;

      const updatedConflicts = [...conflicts, ...detectedConflicts];
      setConflicts(updatedConflicts);
      await AsyncStorage.setItem("conflicts", JSON.stringify(updatedConflicts));
    }

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));

    return { success: true };
  }, [events, conflicts, detectConflicts]);

  const updateEventResponse = useCallback(async (
    eventId: string,
    userId: string,
    status: EventResponseStatus,
    note?: string
  ) => {
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        const responses = event.responses.map((r) =>
          r.userId === userId
            ? { ...r, status, timestamp: new Date().toISOString(), note }
            : r
        );
        return { ...event, responses, updatedAt: new Date().toISOString() };
      }
      return event;
    });

    setEvents(updatedEvents);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));
  }, [events]);

  const updateEvent = useCallback(async (
    eventId: string,
    updates: Partial<Event>,
    proceedDespiteConflict?: boolean,
    justification?: string
  ): Promise<{ success: boolean; conflicts?: Conflict[] }> => {
    const eventToUpdate = events.find(e => e.id === eventId);
    if (!eventToUpdate) {
      return { success: false };
    }

    const updatedEvent = { ...eventToUpdate, ...updates, updatedAt: new Date().toISOString() };
    const otherEvents = events.filter(e => e.id !== eventId);
    
    const detectedConflicts = detectConflicts(updatedEvent, otherEvents);

    if (detectedConflicts.length > 0 && !proceedDespiteConflict) {
      return { success: false, conflicts: detectedConflicts };
    }

    if (detectedConflicts.length > 0 && proceedDespiteConflict) {
      updatedEvent.hasConflict = true;
      updatedEvent.conflictIds = detectedConflicts.map((c) => c.id);
      updatedEvent.requiresJustification = true;
      updatedEvent.justification = justification;

      const updatedConflicts = [...conflicts, ...detectedConflicts];
      setConflicts(updatedConflicts);
      await AsyncStorage.setItem("conflicts", JSON.stringify(updatedConflicts));
    } else {
      updatedEvent.hasConflict = false;
      updatedEvent.conflictIds = [];
      
      const updatedConflicts = conflicts.filter(
        (c) => !c.eventIds.includes(eventId)
      );
      setConflicts(updatedConflicts);
      await AsyncStorage.setItem("conflicts", JSON.stringify(updatedConflicts));
    }

    const updatedEvents = events.map((event) =>
      event.id === eventId ? updatedEvent : event
    );
    
    setEvents(updatedEvents);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));

    return { success: true };
  }, [events, conflicts, detectConflicts]);

  const deleteEvent = useCallback(async (eventId: string) => {
    const updatedEvents = events.filter((e) => e.id !== eventId);
    setEvents(updatedEvents);
    await AsyncStorage.setItem("events", JSON.stringify(updatedEvents));

    const updatedConflicts = conflicts.filter(
      (c) => !c.eventIds.includes(eventId)
    );
    setConflicts(updatedConflicts);
    await AsyncStorage.setItem("conflicts", JSON.stringify(updatedConflicts));
  }, [events, conflicts]);

  const myEvents = useMemo(() => {
    if (!currentUser) return [];
    return events.filter((event) => event.assignedTo.includes(currentUser.id));
  }, [events, currentUser]);

  const upcomingEvents = useMemo(() => {
    const now = new Date().getTime();
    return myEvents
      .filter((event) => new Date(event.startTime).getTime() > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 10);
  }, [myEvents]);

  const conflictingEvents = useMemo(() => {
    return events.filter((event) => event.hasConflict);
  }, [events]);

  const unresolvedConflicts = useMemo(() => {
    return conflicts.filter((c) => !c.isResolved);
  }, [conflicts]);

  return useMemo(() => ({
    events,
    conflicts,
    myEvents,
    upcomingEvents,
    conflictingEvents,
    unresolvedConflicts,
    isLoading,
    addEvent,
    updateEvent,
    updateEventResponse,
    deleteEvent,
  }), [
    events,
    conflicts,
    myEvents,
    upcomingEvents,
    conflictingEvents,
    unresolvedConflicts,
    isLoading,
    addEvent,
    updateEvent,
    updateEventResponse,
    deleteEvent,
  ]);
});
