import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Globe,
  Lock,
  ChevronRight,
  User,
  Shield,
  Mail,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import LeftNavigation from "@/components/LeftNavigation";
import Colors from "@/constants/colors";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const renderSettingItem = (
    icon: React.ReactElement,
    title: string,
    subtitle: string,
    action: "switch" | "navigate",
    value?: boolean,
    onToggle?: (value: boolean) => void,
    onPress?: () => void
  ) => {
    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={action === "navigate" ? onPress : undefined}
        disabled={action === "switch"}
      >
        <View style={styles.settingIcon}>
          <Text>{icon}</Text>
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
        {action === "switch" && value !== undefined && onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: Colors.neutral.gray200, true: Colors.primary.main }}
            thumbColor={Colors.background.card}
          />
        )}
        {action === "navigate" && (
          <ChevronRight color={Colors.text.secondary} size={20} />
        )}
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
            <View style={styles.titleRow}>
              <SettingsIcon color={Colors.primary.main} size={28} />
              <Text style={styles.title}>Settings</Text>
            </View>
            <Text style={styles.subtitle}>
              Manage your account and preferences
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              {renderSettingItem(
                <User color={Colors.primary.main} size={20} />,
                "Profile Information",
                `${currentUser?.name} - ${currentUser?.role}`,
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Profile editing coming soon")
              )}
              {renderSettingItem(
                <Mail color={Colors.primary.main} size={20} />,
                "Email Address",
                currentUser?.email || "No email set",
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Email editing coming soon")
              )}
              {renderSettingItem(
                <Lock color={Colors.primary.main} size={20} />,
                "Security",
                "Password, authentication settings",
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Security settings coming soon")
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              {renderSettingItem(
                <Bell color={Colors.accent.amber} size={20} />,
                "Push Notifications",
                "Get notified about events and updates",
                "switch",
                pushNotifications,
                setPushNotifications
              )}
              {renderSettingItem(
                <Mail color={Colors.accent.amber} size={20} />,
                "Email Notifications",
                "Receive email alerts for important events",
                "switch",
                emailNotifications,
                setEmailNotifications
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              {renderSettingItem(
                <Moon color={Colors.status.info} size={20} />,
                "Dark Mode",
                "Switch between light and dark themes",
                "switch",
                darkMode,
                (value) => {
                  setDarkMode(value);
                  Alert.alert("Info", "Theme switching coming soon");
                }
              )}
              {renderSettingItem(
                <Globe color={Colors.status.info} size={20} />,
                "Language",
                "English (US)",
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Language selection coming soon")
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Permissions</Text>
              {renderSettingItem(
                <Shield color={Colors.status.success} size={20} />,
                "Role & Access",
                `Current role: ${currentUser?.role}`,
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Contact administrator to change roles")
              )}
            </View>
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
    padding: 24,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },
});
