import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppColors {
  primary: string;
  background: string;
  foreground: string;
  card: string;
  accent: string;
  muted: string;
  destructive: string;
  border: string;
}

export const defaultColors: AppColors = {
  primary: "228 76% 58%",
  background: "210 20% 98%",
  foreground: "222 47% 11%",
  card: "0 0% 100%",
  accent: "228 76% 95%",
  muted: "220 14% 96%",
  destructive: "0 84% 60%",
  border: "220 13% 91%",
};

export const defaultDarkColors: AppColors = {
  primary: "228 76% 58%",
  background: "222 47% 6%",
  foreground: "210 40% 98%",
  card: "222 47% 9%",
  accent: "217 33% 17%",
  muted: "217 33% 17%",
  destructive: "0 63% 31%",
  border: "217 33% 17%",
};

export const presetPalettes: { name: string; colors: Partial<AppColors> }[] = [
  {
    name: "Azul (Padrão)",
    colors: { primary: "228 76% 58%", accent: "228 76% 95%" },
  },
  {
    name: "Esmeralda",
    colors: { primary: "160 84% 39%", accent: "160 84% 92%" },
  },
  {
    name: "Roxo",
    colors: { primary: "271 76% 53%", accent: "271 76% 93%" },
  },
  {
    name: "Laranja",
    colors: { primary: "25 95% 53%", accent: "25 95% 93%" },
  },
  {
    name: "Rosa",
    colors: { primary: "340 82% 52%", accent: "340 82% 93%" },
  },
];

const COLOR_KEYS: (keyof AppColors)[] = [
  "primary", "background", "foreground", "card", "accent", "muted", "destructive", "border",
];

export const useAppColors = () => {
  const query = useQuery({
    queryKey: ["app_colors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .like("key", "color_%");
      const colors: Partial<AppColors> = {};
      (data || []).forEach((s) => {
        const colorKey = s.key.replace("color_", "") as keyof AppColors;
        if (COLOR_KEYS.includes(colorKey)) {
          colors[colorKey] = s.value;
        }
      });
      return colors;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!query.data) return;
    const root = document.documentElement;
    COLOR_KEYS.forEach((key) => {
      const value = query.data[key];
      if (value) {
        root.style.setProperty(`--${key === "border" ? "border" : key}`, value);
        // Also set related variables
        if (key === "primary") {
          root.style.setProperty("--ring", value);
        }
        if (key === "card") {
          root.style.setProperty("--popover", value);
        }
        if (key === "foreground") {
          root.style.setProperty("--card-foreground", value);
          root.style.setProperty("--popover-foreground", value);
        }
        if (key === "background") {
          root.style.setProperty("--input", query.data.border || defaultColors.border);
        }
      }
    });
  }, [query.data]);

  return query;
};
