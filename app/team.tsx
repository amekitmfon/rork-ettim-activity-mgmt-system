import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Shield,
  Activity,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/contexts/EventsContext";
import LeftNavigation from "@/components/LeftNavigation";
import Colors from "@/constants/colors";
import { User, UserRole } from "@/types";

const ROLE_COLORS: Record<UserRole, string> = {
  commissioner: Colors.status.error,
  director: Colors.primary.dark,
  registry: Colors.status.info,
  external: Colors.neutral.gray400,
};

const ROLE_LABELS: Record<UserRole, string> = {
  commissioner: "Commissioner",
  director: "Director",
  registry: "Registry",
  external: "External",
};

export default function TeamManagement() {
  const insets = useSafeAreaInsets();
  const { allUsers, currentUser, hasPermission } = useAuth();
  const { events } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");

  const canAccessPage = hasPermission("director");
  const canManageUsers = hasPermission("director");

  if (!canAccessPage) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LeftNavigation />
        <View style={styles.content}>
          <View style={styles.accessDenied}>
            <Text style={styles.accessDeniedText}>Access Denied</Text>
            <Text style={styles.accessDeniedSubtext}>
              You do not have permission to access this page.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const filteredUsers = useMemo(() => {
    let filtered = allUsers;

    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.department.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allUsers, selectedRole, searchQuery]);

  const getUserStats = (userId: string) => {
    const userEvents = events.filter((event) =>
      event.assignedTo.includes(userId)
    );
    const totalEvents = userEvents.length;
    const attendingEvents = userEvents.filter((event) =>
      event.responses.find(
        (r) => r.userId === userId && r.status === "attending"
      )
    ).length;
    const pendingEvents = userEvents.filter((event) =>
      event.responses.find((r) => r.userId === userId && r.status === "pending")
    ).length;
    const declinedEvents = userEvents.filter((event) =>
      event.responses.find(
        (r) => r.userId === userId && r.status === "not-attending"
      )
    ).length;

    const attendanceRate =
      totalEvents > 0 ? Math.round((attendingEvents / totalEvents) * 100) : 0;

    return {
      totalEvents,
      attendingEvents,
      pendingEvents,
      declinedEvents,
      attendanceRate,
    };
  };

  const renderUserCard = (user: User) => {
    const stats = getUserStats(user.id);
    const isCurrentUser = user.id === currentUser?.id;

    return (
      <TouchableOpacity
        key={user.id}
        style={[
          styles.userCard,
          isCurrentUser && styles.userCardHighlighted,
        ]}
        onPress={() => {
          console.log("User selected:", user.name);
        }}
      >
        <View style={styles.userCardHeader}>
          <View style={styles.userInfo}>
            {user.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                {isCurrentUser && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>You</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Shield
                  color={ROLE_COLORS[user.role]}
                  size={12}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: ROLE_COLORS[user.role] },
                  ]}
                >
                  {ROLE_LABELS[user.role]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Calendar color={Colors.text.secondary} size={16} />
            <Text style={styles.statValue}>{stats.totalEvents}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle color={Colors.status.success} size={16} />
            <Text style={styles.statValue}>{stats.attendingEvents}</Text>
            <Text style={styles.statLabel}>Attending</Text>
          </View>
          <View style={styles.statItem}>
            <Clock color={Colors.accent.amber} size={16} />
            <Text style={styles.statValue}>{stats.pendingEvents}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Activity color={Colors.primary.main} size={16} />
            <Text style={styles.statValue}>{stats.attendanceRate}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
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
                <Users color={Colors.primary.main} size={28} />
                <Text style={styles.title}>Team Management</Text>
              </View>
              <Text style={styles.subtitle}>
                Manage department staff and view team performance
              </Text>
            </View>
            {canManageUsers && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  console.log("Add user");
                }}
              >
                <UserPlus color={Colors.text.inverse} size={20} />
                <Text style={styles.addButtonText}>Add User</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchContainer}>
              <Search color={Colors.text.secondary} size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, or department..."
                placeholderTextColor={Colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterContainer}>
              <Filter color={Colors.text.secondary} size={18} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedRole === "all" && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedRole("all")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedRole === "all" && styles.filterChipTextActive,
                    ]}
                  >
                    All ({allUsers.length})
                  </Text>
                </TouchableOpacity>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                  const count = allUsers.filter((u) => u.role === role).length;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.filterChip,
                        selectedRole === role && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedRole === role && styles.filterChipTextActive,
                        ]}
                      >
                        {ROLE_LABELS[role]} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.userGrid}>
              {filteredUsers.map((user) => renderUserCard(user))}
            </View>

            {filteredUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Users color={Colors.text.disabled} size={64} />
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your search or filters
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
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  toolbar: {
    padding: 16,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.neutral.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text.primary,
    outlineStyle: "none" as any,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  userGrid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  userCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: 20,
  },
  userCardHighlighted: {
    borderColor: Colors.primary.main,
    borderWidth: 2,
  },
  userCardHeader: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    gap: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.text.inverse,
    fontSize: 20,
    fontWeight: "600" as const,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  youBadge: {
    backgroundColor: Colors.primary.main + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary.main,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.neutral.gray50,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
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
  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
