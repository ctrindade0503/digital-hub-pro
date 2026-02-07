import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw, Palette } from "lucide-react";
import {
  AppColors,
  defaultColors,
  presetPalettes,
} from "@/hooks/useAppColors";

const COLOR_LABELS: Record<keyof AppColors, string> = {
  primary: "Cor Primária",
  background: "Fundo",
  foreground: "Texto",
  card: "Cards",
  accent: "Destaque",
  muted: "Secundário",
  destructive: "Erro/Perigo",
  border: "Bordas",
};

function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#4466cc";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const AdminColors = () => {
  const [colors, setColors] = useState<AppColors>({ ...defaultColors });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .like("key", "color_%");
      const loaded = { ...defaultColors };
      (data || []).forEach((s) => {
        const key = s.key.replace("color_", "") as keyof AppColors;
        if (key in loaded) loaded[key] = s.value;
      });
      setColors(loaded);
      setLoading(false);
    };
    load();
  }, []);

  const applyPreset = (preset: Partial<AppColors>) => {
    setColors((prev) => ({ ...prev, ...preset }));
  };

  const save = async () => {
    setLoading(true);
    const keys = Object.keys(colors) as (keyof AppColors)[];
    for (const key of keys) {
      const dbKey = `color_${key}`;
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", dbKey)
        .maybeSingle();
      if (existing) {
        await supabase.from("app_settings").update({ value: colors[key] }).eq("key", dbKey);
      } else {
        await supabase.from("app_settings").insert({ key: dbKey, value: colors[key] });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["app_colors"] });
    toast({ title: "Cores salvas com sucesso!" });
    setLoading(false);
  };

  const reset = () => {
    setColors({ ...defaultColors });
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Paleta de Cores</h2>

      {/* Presets */}
      <div className="bg-card rounded-xl border border-border p-4">
        <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4" /> Paletas Predefinidas
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {presetPalettes.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.colors)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
            >
              <div
                className="w-6 h-6 rounded-full border border-border shrink-0"
                style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
              />
              <span className="text-xs font-medium text-foreground">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Individual colors */}
      <div className="bg-card rounded-xl border border-border p-4">
        <Label className="text-sm font-semibold mb-3 block">Cores Individuais</Label>
        <div className="space-y-3">
          {(Object.keys(COLOR_LABELS) as (keyof AppColors)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{COLOR_LABELS[key]}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={hslToHex(colors[key])}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    setColors((prev) => ({ ...prev, [key]: hsl }));
                  }}
                  className="w-10 h-8 p-0.5 cursor-pointer border-border"
                />
                <span className="text-[10px] text-muted-foreground font-mono w-28 truncate">
                  {colors[key]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card rounded-xl border border-border p-4">
        <Label className="text-sm font-semibold mb-3 block">Prévia</Label>
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: `hsl(${colors.background})` }}>
          <div className="rounded-lg p-3" style={{ backgroundColor: `hsl(${colors.card})`, border: `1px solid hsl(${colors.border})` }}>
            <p style={{ color: `hsl(${colors.foreground})` }} className="text-sm font-medium">Título do card</p>
            <p style={{ color: `hsl(${colors.muted})` }} className="text-xs mt-1">Texto secundário</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: `hsl(${colors.primary})`, color: "white" }}>
              Botão Primário
            </div>
            <div className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: `hsl(${colors.accent})`, color: `hsl(${colors.foreground})` }}>
              Destaque
            </div>
            <div className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: `hsl(${colors.destructive})`, color: "white" }}>
              Perigo
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={reset} variant="outline" className="flex-1 gap-2">
          <RotateCcw className="w-4 h-4" /> Resetar
        </Button>
        <Button onClick={save} className="flex-1 gap-2" disabled={loading}>
          <Check className="w-4 h-4" /> Salvar Cores
        </Button>
      </div>
    </div>
  );
};

export default AdminColors;
