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
import { router, usePathname } from "expo-router";
import Colors from "@/constants/colors";
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
        <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View>
              <Text style={styles.logo}>ETTIM</Text>
              <Text style={styles.subtitle}>Department Portal</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X color={Colors.text.secondary} size={24} />
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
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => handleNavigation(item.route)}
                >
                  <item.icon
                    color={active ? Colors.primary.main : Colors.text.secondary}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.navItemText,
                      active && styles.navItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigation("/settings")}
            >
              <Settings color={Colors.text.secondary} size={20} />
              <Text style={styles.navItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigation("/notifications")}
            >
              <Bell color={Colors.text.secondary} size={20} />
              <Text style={styles.navItemText}>Notifications</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.profileInfo}>
              {currentUser.imageUrl ? (
                <Image
                  source={{ uri: currentUser.imageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {currentUser.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {currentUser.name}
                </Text>
                <Text style={styles.profileRole} numberOfLines={1}>
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut color={Colors.status.error} size={20} />
              <Text style={styles.logoutText}>Logout</Text>
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
    backgroundColor: Colors.background.card,
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
    borderBottomColor: Colors.border.light,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logo: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary.main,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
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
  navItemActive: {
    backgroundColor: Colors.primary.main + "10",
  },
  navItemText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  navItemTextActive: {
    color: Colors.primary.main,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
    marginHorizontal: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
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
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  profileRole: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.status.error + "10",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.status.error,
  },
});
