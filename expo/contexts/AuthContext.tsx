import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/types";

const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "H.E Francisca Tatchouop Belobe",
    email: "commissioner@ettim.gov",
    role: "commissioner",
    department: "ETTIM",
    imageUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    name: "Mme Ron Osman",
    email: "director@ettim.gov",
    role: "director",
    department: "ETTIM",
    imageUrl: "https://i.pravatar.cc/150?img=33",
  },
  {
    id: "3",
    name: "Wassie Aragaw",
    email: "registry@ettim.gov",
    role: "registry",
    department: "ETTIM",
    imageUrl: "https://i.pravatar.cc/150?img=45",
  },
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("currentUser");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const user = MOCK_USERS.find((u) => u.email === email);
    if (user) {
      await AsyncStorage.setItem("currentUser", JSON.stringify(user));
      setCurrentUser(user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("currentUser");
    setCurrentUser(null);
  }, []);

  const hasPermission = useCallback((requiredRole: User["role"]): boolean => {
    if (!currentUser) return false;
    const hierarchy = ["external", "registry", "director", "commissioner"];
    const userLevel = hierarchy.indexOf(currentUser.role);
    const requiredLevel = hierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  }, [currentUser]);

  return useMemo(() => ({
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    hasPermission,
    allUsers: MOCK_USERS,
  }), [currentUser, isLoading, login, logout, hasPermission]);
});
