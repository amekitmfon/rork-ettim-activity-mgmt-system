import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Modal,
  Pressable,
  useWindowDimensions,
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
  Check,
} from "lucide-react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, Language } from "@/contexts/ThemeContext";
import LeftNavigation from "@/components/LeftNavigation";
import MobileHeader from "@/components/MobileHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { currentUser } = useAuth();
  const { themeMode, toggleTheme, language, changeLanguage, colors } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const loadNotificationSettings = React.useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("emailNotifications");
      const push = await AsyncStorage.getItem("pushNotifications");
      if (email !== null) setEmailNotifications(email === "true");
      if (push !== null) setPushNotifications(push === "true");
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  }, []);

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const handleEmailNotifications = React.useCallback(async (value: boolean) => {
    setEmailNotifications(value);
    await AsyncStorage.setItem("emailNotifications", String(value));
  }, []);

  const handlePushNotifications = React.useCallback(async (value: boolean) => {
    setPushNotifications(value);
    await AsyncStorage.setItem("pushNotifications", String(value));
  }, []);

  const handleLanguageSelect = React.useCallback(async (lang: Language) => {
    await changeLanguage(lang);
    setShowLanguageModal(false);
    Alert.alert("Success", `Language changed to ${lang === "en" ? "English" : "French"}`);
  }, [changeLanguage]);

  const renderSettingItem = React.useCallback((
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
        style={[styles.settingItem, { backgroundColor: colors.background.card, borderColor: colors.border.light }]}
        onPress={action === "navigate" ? onPress : undefined}
        disabled={action === "switch"}
      >
        <View style={[styles.settingIcon, { backgroundColor: colors.neutral.gray50 }]}>
          <Text>{icon}</Text>
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>
        </View>
        {action === "switch" && value !== undefined && onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: colors.neutral.gray200, true: colors.primary.main }}
            thumbColor={colors.background.card}
          />
        )}
        {action === "navigate" && (
          <ChevronRight color={colors.text.secondary} size={20} />
        )}
      </TouchableOpacity>
    );
  }, [colors]);

  const languageOptions: { value: Language; label: string }[] = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: isMobile ? 0 : insets.top, backgroundColor: colors.background.main }]}>
        {!isMobile && <LeftNavigation />}
        {isMobile && (
          <MobileNavDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
          />
        )}
        <View style={[styles.content, isMobile && styles.contentMobile]}>  
          {isMobile && (
            <MobileHeader
              title="Settings"
              onMenuPress={() => setDrawerVisible(true)}
            />
          )}
          {!isMobile && <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
            <View style={styles.titleRow}>
              <SettingsIcon color={colors.primary.main} size={28} />
              <Text style={[styles.title, { color: colors.text.primary }]}>Settings</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Manage your account and preferences
            </Text>
          </View>}

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Account</Text>
              {renderSettingItem(
                <User color={colors.primary.main} size={20} />,
                "Profile Information",
                `${currentUser?.name} - ${currentUser?.role}`,
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Profile editing coming soon")
              )}
              {renderSettingItem(
                <Mail color={colors.primary.main} size={20} />,
                "Email Address",
                currentUser?.email || "No email set",
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Email editing coming soon")
              )}
              {renderSettingItem(
                <Lock color={colors.primary.main} size={20} />,
                "Security",
                "Password, authentication settings",
                "navigate",
                undefined,
                undefined,
                () => Alert.alert("Info", "Security settings coming soon")
              )}
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Notifications</Text>
              {renderSettingItem(
                <Bell color={colors.accent.amber} size={20} />,
                "Push Notifications",
                "Get notified about events and updates",
                "switch",
                pushNotifications,
                handlePushNotifications
              )}
              {renderSettingItem(
                <Mail color={colors.accent.amber} size={20} />,
                "Email Notifications",
                "Receive email alerts for important events",
                "switch",
                emailNotifications,
                handleEmailNotifications
              )}
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Appearance</Text>
              {renderSettingItem(
                <Moon color={colors.status.info} size={20} />,
                "Dark Mode",
                "Switch between light and dark themes",
                "switch",
                themeMode === "dark",
                toggleTheme
              )}
              {renderSettingItem(
                <Globe color={colors.status.info} size={20} />,
                "Language",
                language === "en" ? "English" : "Français",
                "navigate",
                undefined,
                undefined,
                () => setShowLanguageModal(true)
              )}
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Permissions</Text>
              {renderSettingItem(
                <Shield color={colors.status.success} size={20} />,
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

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background.card }, Platform.OS === "web" && { maxWidth: 350 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Language</Text>
            <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
              Choose your preferred language
            </Text>

            {languageOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.languageOption,
                  { backgroundColor: colors.neutral.gray50, borderColor: colors.border.light },
                  language === option.value && { borderColor: colors.primary.main, backgroundColor: colors.primary.main + "10" },
                ]}
                onPress={() => handleLanguageSelect(option.value)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    { color: colors.text.primary },
                    language === option.value && { color: colors.primary.main, fontWeight: "600" as const },
                  ]}
                >
                  {option.label}
                </Text>
                {language === option.value && (
                  <Check color={colors.primary.main} size={20} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.neutral.gray100 }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    padding: 24,
    borderBottomWidth: 1,
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
  },
  subtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  languageOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
