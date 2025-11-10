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
import Colors from "@/constants/colors";

interface MobileHeaderProps {
  title: string;
  onMenuPress: () => void;
  rightButton?: React.ReactNode;
}

export default function MobileHeader({ title, onMenuPress, rightButton }: MobileHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        <Menu color={Colors.text.primary} size={24} />
      </TouchableOpacity>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.rightContainer}>
        {rightButton}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    color: Colors.text.primary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
});
