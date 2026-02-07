import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { MessageSquareOff, MessageSquare, Eye, EyeOff } from "lucide-react";

const CommunitySettingsTab = () => {
  const { profile, isLoading, updateProfile } = useProfile();

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  const showNickname = (profile as any)?.show_nickname ?? false;
  const notifyComments = (profile as any)?.notify_comments ?? true;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-4 px-1 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            {showNickname ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </div>
          <div>
            <Label className="text-sm font-medium">Exibir apelido</Label>
            <p className="text-xs text-muted-foreground">
              {showNickname ? "Seu apelido será exibido" : "Seu nome real será exibido"}
            </p>
          </div>
        </div>
        <Switch
          checked={showNickname}
          onCheckedChange={(v) => updateProfile.mutate({ show_nickname: v } as any)}
        />
      </div>

      <div className="flex items-center justify-between py-4 px-1">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            {notifyComments ? <MessageSquare className="w-5 h-5" /> : <MessageSquareOff className="w-5 h-5" />}
          </div>
          <div>
            <Label className="text-sm font-medium">Notificações de comentários</Label>
            <p className="text-xs text-muted-foreground">Receber avisos quando comentarem seus posts</p>
          </div>
        </div>
        <Switch
          checked={notifyComments}
          onCheckedChange={(v) => updateProfile.mutate({ notify_comments: v } as any)}
        />
      </div>
    </div>
  );
};

export default CommunitySettingsTab;
