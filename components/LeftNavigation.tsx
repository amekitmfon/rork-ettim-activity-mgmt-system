import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Platform,
} from "react-native";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  Bell,
  BarChart3,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router, usePathname } from "expo-router";
import Colors from "@/constants/colors";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  route: string;
  children?: NavItem[];
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

export default function LeftNavigation() {
  const { currentUser, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const canAccessTeamAndAnalytics = hasPermission("director");

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route + "/");
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as any);
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const active = isActive(item.route);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);

    return (
      <View key={item.id}>
        <TouchableOpacity
          style={[
            styles.navItem,
            active && styles.navItemActive,
            { paddingLeft: 16 + level * 16 },
          ]}
          onPress={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else {
              handleNavigation(item.route);
            }
          }}
        >
          <View style={styles.navItemContent}>
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
          </View>
          {hasChildren && (
            <View>
              {isExpanded ? (
                <ChevronDown color={Colors.text.secondary} size={16} />
              ) : (
                <ChevronRight color={Colors.text.secondary} size={16} />
              )}
            </View>
          )}
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <View>
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ETTIM</Text>
        <Text style={styles.subtitle}>Department Portal</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color={Colors.text.secondary} size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.filter((item) => {
          if (item.id === "team" || item.id === "analytics") {
            return canAccessTeamAndAnalytics;
          }
          return true;
        }).map((item) => renderNavItem(item))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setShowProfile(!showProfile)}
        >
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
          <ChevronDown
            color={Colors.text.secondary}
            size={16}
            style={{ transform: [{ rotate: showProfile ? "180deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {showProfile && (
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => handleNavigation("/settings")}
            >
              <Settings color={Colors.text.secondary} size={18} />
              <Text style={styles.profileMenuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => handleNavigation("/notifications")}
            >
              <Bell color={Colors.text.secondary} size={18} />
              <Text style={styles.profileMenuText}>Notifications</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={handleLogout}
            >
              <LogOut color={Colors.status.error} size={18} />
              <Text style={[styles.profileMenuText, { color: Colors.status.error }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: "100%",
    backgroundColor: Colors.background.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border.light,
    flexDirection: "column",
    ...Platform.select({
      web: {
        display: 'flex' as any,
        position: "fixed" as any,
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
      },
      default: {
        display: 'flex',
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
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
  navList: {
    flex: 1,
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: Colors.primary.main + "10",
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  navItemTextActive: {
    color: Colors.primary.main,
    fontWeight: "600" as const,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 8,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  profileRole: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  profileMenu: {
    marginTop: 8,
    backgroundColor: Colors.neutral.gray50,
    borderRadius: 8,
    padding: 4,
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  profileMenuText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 4,
  },
});
