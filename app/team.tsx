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
  useWindowDimensions,
} from "react-native";
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
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { useTheme } from "@/contexts/ThemeContext";
import { User, UserRole } from "@/types";

export default function TeamManagement() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { allUsers, currentUser, hasPermission } = useAuth();
  const { events } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const { colors } = useTheme();

  const ROLE_COLORS: Record<UserRole, string> = {
    commissioner: colors.status.error,
    director: colors.primary.dark,
    registry: colors.status.info,
    external: colors.neutral.gray400,
  };

  const ROLE_LABELS: Record<UserRole, string> = {
    commissioner: "Commissioner",
    director: "Director",
    registry: "Registry",
    external: "External",
  };

  const canAccessPage = hasPermission("director");
  const canManageUsers = hasPermission("director");

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
          { backgroundColor: colors.background.card, borderColor: colors.border.light },
          isCurrentUser && { borderColor: colors.primary.main, borderWidth: 2 },
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
              <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary.main }]}>
                <Text style={[styles.avatarText, { color: colors.text.inverse }]}>{user.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: colors.text.primary }]}>{user.name}</Text>
                {isCurrentUser && (
                  <View style={[styles.youBadge, { backgroundColor: colors.primary.main + "20" }]}>
                    <Text style={[styles.youBadgeText, { color: colors.primary.main }]}>You</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.userEmail, { color: colors.text.secondary }]}>{user.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.neutral.gray50 }]}>
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

        <View style={[styles.statsRow, { borderTopColor: colors.border.light }]}>
          <View style={styles.statItem}>
            <Calendar color={colors.text.secondary} size={16} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.totalEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Events</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle color={colors.status.success} size={16} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.attendingEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Attending</Text>
          </View>
          <View style={styles.statItem}>
            <Clock color={colors.accent.amber} size={16} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.pendingEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Activity color={colors.primary.main} size={16} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>{stats.attendanceRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Rate</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!canAccessPage) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor: colors.background.main }]}>
          {!isMobile && <LeftNavigation />}
          {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
          <View style={[styles.content, isMobile && styles.contentMobile]}>
            {isMobile && <MobileHeader title="Team Management" onMenuPress={() => setDrawerVisible(true)} />}
            <View style={styles.accessDenied}>
              <Text style={[styles.accessDeniedText, { color: colors.text.primary }]}>Access Denied</Text>
              <Text style={[styles.accessDeniedSubtext, { color: colors.text.secondary }]}>
                You do not have permission to access this page.
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background.main }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && <MobileNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />}
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {isMobile ? (
            <MobileHeader
              title="Team Management"
              onMenuPress={() => setDrawerVisible(true)}
              rightButton={
                canManageUsers ? (
                  <TouchableOpacity onPress={() => console.log("Add user")}>
                    <UserPlus color={colors.primary.main} size={24} />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          ) : (
            <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
              <View>
                <View style={styles.titleRow}>
                  <Users color={colors.primary.main} size={28} />
                  <Text style={[styles.title, { color: colors.text.primary }]}>Team Management</Text>
                </View>
                <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                  Manage department staff and view team performance
                </Text>
              </View>
              {canManageUsers && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary.main }]}
                  onPress={() => {
                    console.log("Add user");
                  }}
                >
                  <UserPlus color={colors.text.inverse} size={20} />
                  <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>Add User</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={[styles.toolbar, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
            <View style={[styles.searchContainer, { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light }]}>
              <Search color={colors.text.secondary} size={18} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Search by name, email, or department..."
                placeholderTextColor={colors.text.disabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterContainer}>
              <Filter color={colors.text.secondary} size={18} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                    selectedRole === "all" && { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
                  ]}
                  onPress={() => setSelectedRole("all")}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: colors.text.secondary },
                      selectedRole === "all" && { color: colors.text.inverse, fontWeight: "600" as const },
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
                        { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                        selectedRole === role && { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: colors.text.secondary },
                          selectedRole === role && { color: colors.text.inverse, fontWeight: "600" as const },
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
                <Users color={colors.text.disabled} size={64} />
                <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>No users found</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.disabled }]}>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  toolbar: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
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
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
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
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  userEmail: {
    fontSize: 13,
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
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  statLabel: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
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
  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    textAlign: "center",
  },
});
