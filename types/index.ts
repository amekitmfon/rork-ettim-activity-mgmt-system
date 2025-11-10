export type UserRole = "commissioner" | "director" | "registry" | "external";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  imageUrl?: string;
}

export type EventPriority = "critical" | "high" | "medium" | "low";
export type EventResponseStatus = "attending" | "not-attending" | "maybe" | "pending";
export type ConflictSeverity = "critical" | "high" | "medium";

export interface EventResponse {
  userId: string;
  status: EventResponseStatus;
  timestamp: string;
  note?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  priority: EventPriority;
  createdBy: string;
  assignedTo: string[];
  responses: EventResponse[];
  hasConflict: boolean;
  conflictIds: string[];
  requiresJustification: boolean;
  justification?: string;
  tags: string[];
  commissionerRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conflict {
  id: string;
  severity: ConflictSeverity;
  eventIds: string[];
  affectedUserIds: string[];
  type: "time-overlap" | "resource" | "travel" | "commissioner-priority";
  overlapDuration: number;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type CalendarView = "month" | "week" | "day" | "agenda";

export type InvitationStatus = "pending" | "accepted" | "declined";

export interface Invitation {
  id: string;
  title: string;
  description: string;
  invitationDate: string;
  eventDate: string;
  eventTime: string;
  location: string;
  organizer: string;
  documentUri?: string;
  status: InvitationStatus;
  hasConflict: boolean;
  conflictingEventIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
