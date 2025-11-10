import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, Bell } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface MobileHeaderProps {
  title: string;
  onMenuPress: () => void;
  rightButton?: React.ReactNode;
}

export default function MobileHeader({ title, onMenuPress, rightButton }: MobileHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, backgroundColor: colors.background.card, borderBottomColor: colors.border.light }]}>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        <Menu color={colors.text.primary} size={24} />
      </TouchableOpacity>
      
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      
      <View style={styles.rightContainer}>
        {rightButton}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  menuButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
});
