import React, { useState } from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import LeftNavigation from "./LeftNavigation";
import MobileNavDrawer from "./MobileNavDrawer";
import Colors from "@/constants/colors";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <View style={styles.container}>
      {!isMobile && <LeftNavigation />}
      {isMobile && (
        <MobileNavDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      )}
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...child.props,
              isMobile,
              onMenuPress: () => setDrawerVisible(true),
            } as any);
          }
          return child;
        })}
      </View>
    </View>
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
  contentMobile: {
    marginLeft: 0,
  },
});
