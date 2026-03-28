import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";

export type Language = "en" | "fr";
export type ThemeMode = "light" | "dark";

interface ThemeColors {
  primary: {
    main: string;
    dark: string;
    light: string;
  };
  secondary: {
    main: string;
    dark: string;
    light: string;
  };
  accent: {
    amber: string;
    orange: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  priority: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
  response: {
    attending: string;
    notAttending: string;
    maybe: string;
    pending: string;
  };
  neutral: {
    white: string;
    gray50: string;
    gray100: string;
    gray200: string;
    gray300: string;
    gray400: string;
    gray500: string;
    gray600: string;
    gray700: string;
    gray800: string;
    gray900: string;
    black: string;
  };
  background: {
    main: string;
    card: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    light: string;
    main: string;
    dark: string;
  };
}

const LIGHT_THEME: ThemeColors = {
  primary: {
    main: "#1e3a8a",
    dark: "#1e40af",
    light: "#3b82f6",
  },
  secondary: {
    main: "#64748b",
    dark: "#475569",
    light: "#94a3b8",
  },
  accent: {
    amber: "#f59e0b",
    orange: "#ea580c",
  },
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  priority: {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#f59e0b",
    low: "#64748b",
  },
  response: {
    attending: "#10b981",
    notAttending: "#ef4444",
    maybe: "#f59e0b",
    pending: "#94a3b8",
  },
  neutral: {
    white: "#ffffff",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827",
    black: "#000000",
  },
  background: {
    main: "#f9fafb",
    card: "#ffffff",
    elevated: "#ffffff",
  },
  text: {
    primary: "#111827",
    secondary: "#6b7280",
    disabled: "#9ca3af",
    inverse: "#ffffff",
  },
  border: {
    light: "#e5e7eb",
    main: "#d1d5db",
    dark: "#9ca3af",
  },
};

const DARK_THEME: ThemeColors = {
  primary: {
    main: "#3b82f6",
    dark: "#2563eb",
    light: "#60a5fa",
  },
  secondary: {
    main: "#94a3b8",
    dark: "#64748b",
    light: "#cbd5e1",
  },
  accent: {
    amber: "#fbbf24",
    orange: "#fb923c",
  },
  status: {
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
  },
  priority: {
    critical: "#f87171",
    high: "#fb923c",
    medium: "#fbbf24",
    low: "#94a3b8",
  },
  response: {
    attending: "#34d399",
    notAttending: "#f87171",
    maybe: "#fbbf24",
    pending: "#cbd5e1",
  },
  neutral: {
    white: "#000000",
    gray50: "#0f172a",
    gray100: "#1e293b",
    gray200: "#334155",
    gray300: "#475569",
    gray400: "#64748b",
    gray500: "#94a3b8",
    gray600: "#cbd5e1",
    gray700: "#e2e8f0",
    gray800: "#f1f5f9",
    gray900: "#f8fafc",
    black: "#ffffff",
  },
  background: {
    main: "#0f172a",
    card: "#1e293b",
    elevated: "#334155",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    disabled: "#64748b",
    inverse: "#0f172a",
  },
  border: {
    light: "#334155",
    main: "#475569",
    dark: "#64748b",
  },
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("themeMode");
      const storedLanguage = await AsyncStorage.getItem("language");
      
      if (storedTheme) {
        setThemeMode(storedTheme as ThemeMode);
      }
      if (storedLanguage) {
        setLanguage(storedLanguage as Language);
      }
    } catch (error) {
      console.error("Error loading theme settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleTheme = useCallback(async () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);
    await AsyncStorage.setItem("themeMode", newMode);
  }, [themeMode]);

  const setThemeModeValue = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem("themeMode", mode);
  }, []);

  const changeLanguage = useCallback(async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem("language", lang);
  }, []);

  const colors = useMemo(
    () => (themeMode === "light" ? LIGHT_THEME : DARK_THEME),
    [themeMode]
  );

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.body.style.backgroundColor = colors.background.main;
      document.documentElement.style.backgroundColor = colors.background.main;
    }
  }, [colors.background.main]);

  return useMemo(
    () => ({
      themeMode,
      colors,
      language,
      isLoading,
      toggleTheme,
      setThemeMode: setThemeModeValue,
      changeLanguage,
      isDark: themeMode === "dark",
    }),
    [themeMode, colors, language, isLoading, toggleTheme, setThemeModeValue, changeLanguage]
  );
});
