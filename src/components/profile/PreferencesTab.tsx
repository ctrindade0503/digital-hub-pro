import { Sun, Moon, Bell, BellOff, Mail, MailX, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const PreferencesTab = () => {
  const { preferences, isLoading, updatePreferences } = useUserPreferences();

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  const items = [
    {
      icon: preferences?.theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      label: "Tema escuro",
      description: "Alternar entre tema claro e escuro",
      checked: preferences?.theme === "dark",
      onChange: (v: boolean) => {
        document.documentElement.classList.toggle("dark", v);
        updatePreferences.mutate({ theme: v ? "dark" : "light" });
      },
    },
    {
      icon: preferences?.notifications_enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />,
      label: "Notificações",
      description: "Receber notificações push",
      checked: preferences?.notifications_enabled ?? true,
      onChange: (v: boolean) => updatePreferences.mutate({ notifications_enabled: v }),
    },
    {
      icon: preferences?.email_notifications ? <Mail className="w-5 h-5" /> : <MailX className="w-5 h-5" />,
      label: "E-mails",
      description: "Receber atualizações por e-mail",
      checked: preferences?.email_notifications ?? true,
      onChange: (v: boolean) => updatePreferences.mutate({ email_notifications: v }),
    },
  ];

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-4 px-1 border-b border-border last:border-0">
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground">{item.icon}</div>
            <div>
              <Label className="text-sm font-medium">{item.label}</Label>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <Switch checked={item.checked} onCheckedChange={item.onChange} />
        </div>
      ))}

      <div className="flex items-center justify-between py-4 px-1">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <div>
            <Label className="text-sm font-medium">Idioma</Label>
            <p className="text-xs text-muted-foreground">Português (Brasil)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
