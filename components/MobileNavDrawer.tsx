import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Bell,
  BarChart3,
  X,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    route: "/dashboard",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    route: "/calendar",
  },
  {
    id: "events",
    label: "Events",
    icon: FileText,
    route: "/events",
  },
  {
    id: "invitations",
    label: "Invitations",
    icon: FileText,
    route: "/invitations",
  },
  {
    id: "team",
    label: "Team Management",
    icon: Users,
    route: "/team",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    route: "/analytics",
  },
];

interface MobileNavDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({ visible, onClose }: MobileNavDrawerProps) {
  const { currentUser, logout, hasPermission } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const canAccessTeamAndAnalytics = hasPermission("director");

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route + "/");
  };

  const handleNavigation = (route: string) => {
    router.push(route as any);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as any);
    onClose();
  };

  if (!currentUser) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.drawer, { backgroundColor: colors.background.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border.light }]}>
            <View>
              <Text style={[styles.logo, { color: colors.primary.main }]}>ETTIM</Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Department Portal</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X color={colors.text.secondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
            {NAV_ITEMS.filter((item) => {
              if (item.id === "team" || item.id === "analytics") {
                return canAccessTeamAndAnalytics;
              }
              return true;
            }).map((item) => {
              const active = isActive(item.route);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navItem, active && { backgroundColor: colors.primary.main + "10" }]}
                  onPress={() => handleNavigation(item.route)}
                >
                  <item.icon
                    color={active ? colors.primary.main : colors.text.secondary}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.navItemText,
                      { color: colors.text.secondary },
                      active && { color: colors.primary.main, fontWeight: "600" as const },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.divider, { backgroundColor: colors.border.light }]} />

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigation("/settings")}
            >
              <Settings color={colors.text.secondary} size={20} />
              <Text style={[styles.navItemText, { color: colors.text.secondary }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigation("/notifications")}
            >
              <Bell color={colors.text.secondary} size={20} />
              <Text style={[styles.navItemText, { color: colors.text.secondary }]}>Notifications</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border.light }]}>
            <View style={styles.profileInfo}>
              {currentUser.imageUrl ? (
                <Image
                  source={{ uri: currentUser.imageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary.main }]}>
                  <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                    {currentUser.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={[styles.profileName, { color: colors.text.primary }]} numberOfLines={1}>
                  {currentUser.name}
                </Text>
                <Text style={[styles.profileRole, { color: colors.text.secondary }]} numberOfLines={1}>
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.status.error + "10" }]} onPress={handleLogout}>
              <LogOut color={colors.status.error} size={20} />
              <Text style={[styles.logoutText, { color: colors.status.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  drawer: {
    width: "80%",
    maxWidth: 320,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  navList: {
    flex: 1,
    paddingVertical: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  navItemText: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  profileRole: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
