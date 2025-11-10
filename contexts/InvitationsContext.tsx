import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Invitation, InvitationStatus } from "@/types";
import { useEvents } from "./EventsContext";

const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "inv-1",
    title: "Regional Conference on Education",
    description: "Annual regional conference discussing education policy and implementation",
    invitationDate: new Date().toISOString(),
    eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    eventTime: "09:00",
    location: "Regional Convention Center",
    organizer: "Ministry of Education",
    status: "pending",
    hasConflict: false,
    conflictingEventIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inv-2",
    title: "Community Leaders Forum",
    description: "Quarterly meeting with community leaders to discuss local initiatives",
    invitationDate: new Date().toISOString(),
    eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    eventTime: "14:00",
    location: "City Hall Auditorium",
    organizer: "Mayor's Office",
    status: "pending",
    hasConflict: false,
    conflictingEventIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const [InvitationsProvider, useInvitations] = createContextHook(() => {
  const { events } = useEvents();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvitations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("invitations");
      if (stored) {
        setInvitations(JSON.parse(stored));
      } else {
        setInvitations(INITIAL_INVITATIONS);
        await AsyncStorage.setItem("invitations", JSON.stringify(INITIAL_INVITATIONS));
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
      setInvitations(INITIAL_INVITATIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const checkInvitationConflicts = useCallback((invitation: Invitation) => {
    const invitationStart = new Date(`${invitation.eventDate}T${invitation.eventTime}`).getTime();
    const invitationEnd = invitationStart + 2 * 60 * 60 * 1000;

    const conflictingEventIds: string[] = [];

    events.forEach((event) => {
      const eventStart = new Date(event.startTime).getTime();
      const eventEnd = new Date(event.endTime).getTime();

      if (invitationStart < eventEnd && invitationEnd > eventStart) {
        conflictingEventIds.push(event.id);
      }
    });

    return conflictingEventIds;
  }, [events]);

  useEffect(() => {
    const updatedInvitations = invitations.map((invitation) => {
      const conflictingEventIds = checkInvitationConflicts(invitation);
      return {
        ...invitation,
        hasConflict: conflictingEventIds.length > 0,
        conflictingEventIds,
      };
    });

    if (JSON.stringify(updatedInvitations) !== JSON.stringify(invitations)) {
      setInvitations(updatedInvitations);
      AsyncStorage.setItem("invitations", JSON.stringify(updatedInvitations));
    }
  }, [events, invitations, checkInvitationConflicts]);

  const addInvitation = useCallback(async (
    invitation: Omit<Invitation, "id" | "createdAt" | "updatedAt" | "hasConflict" | "conflictingEventIds">
  ) => {
    const newInvitation: Invitation = {
      ...invitation,
      id: `inv-${Date.now()}`,
      hasConflict: false,
      conflictingEventIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conflictingEventIds = checkInvitationConflicts(newInvitation);
    newInvitation.hasConflict = conflictingEventIds.length > 0;
    newInvitation.conflictingEventIds = conflictingEventIds;

    const updatedInvitations = [...invitations, newInvitation];
    setInvitations(updatedInvitations);
    await AsyncStorage.setItem("invitations", JSON.stringify(updatedInvitations));
  }, [invitations, checkInvitationConflicts]);

  const updateInvitation = useCallback(async (
    invitationId: string,
    updates: Partial<Invitation>
  ) => {
    const updatedInvitations = invitations.map((invitation) => {
      if (invitation.id === invitationId) {
        const updated = { ...invitation, ...updates, updatedAt: new Date().toISOString() };
        if (updates.eventDate || updates.eventTime) {
          const conflictingEventIds = checkInvitationConflicts(updated);
          updated.hasConflict = conflictingEventIds.length > 0;
          updated.conflictingEventIds = conflictingEventIds;
        }
        return updated;
      }
      return invitation;
    });
    setInvitations(updatedInvitations);
    await AsyncStorage.setItem("invitations", JSON.stringify(updatedInvitations));
  }, [invitations, checkInvitationConflicts]);

  const updateInvitationStatus = useCallback(async (
    invitationId: string,
    status: InvitationStatus,
    notes?: string
  ) => {
    await updateInvitation(invitationId, { status, notes });
  }, [updateInvitation]);

  const deleteInvitation = useCallback(async (invitationId: string) => {
    const updatedInvitations = invitations.filter((inv) => inv.id !== invitationId);
    setInvitations(updatedInvitations);
    await AsyncStorage.setItem("invitations", JSON.stringify(updatedInvitations));
  }, [invitations]);

  const pendingInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.status === "pending");
  }, [invitations]);

  const acceptedInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.status === "accepted");
  }, [invitations]);

  const declinedInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.status === "declined");
  }, [invitations]);

  return useMemo(() => ({
    invitations,
    pendingInvitations,
    acceptedInvitations,
    declinedInvitations,
    isLoading,
    addInvitation,
    updateInvitation,
    updateInvitationStatus,
    deleteInvitation,
    checkInvitationConflicts,
  }), [
    invitations,
    pendingInvitations,
    acceptedInvitations,
    declinedInvitations,
    isLoading,
    addInvitation,
    updateInvitation,
    updateInvitationStatus,
    deleteInvitation,
    checkInvitationConflicts,
  ]);
});
