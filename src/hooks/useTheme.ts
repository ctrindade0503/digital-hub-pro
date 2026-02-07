import { useEffect } from "react";
import { useUserPreferences } from "./useUserPreferences";

export const useTheme = () => {
  const { preferences, isLoading } = useUserPreferences();

  useEffect(() => {
    if (isLoading) return;
    const isDark = preferences?.theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, [preferences?.theme, isLoading]);
};
