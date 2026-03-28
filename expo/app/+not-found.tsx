import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { Home } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Home color={Colors.text.secondary} size={64} />
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/dashboard" style={styles.link}>
          <Text style={styles.linkText}>Go to Dashboard</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background.main,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginTop: 24,
  },
  link: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.inverse,
  },
});
