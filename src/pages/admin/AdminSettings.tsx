import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

const AdminSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [requireCommentApproval, setRequireCommentApproval] = useState(false);
  const [appIconUrl, setAppIconUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("app_settings").select("*");
      (data || []).forEach((s) => {
        if (s.key === "whatsapp_number") setWhatsappNumber(s.value);
        if (s.key === "whatsapp_message") setWhatsappMessage(s.value);
        if (s.key === "require_comment_approval") setRequireCommentApproval(s.value === "true");
        if (s.key === "app_icon_url") setAppIconUrl(s.value);
      });
    };
    fetch();
  }, []);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `app/icon.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      setAppIconUrl(urlData.publicUrl);
      toast({ title: "Ícone enviado! Salve para aplicar." });
    } catch {
      toast({ title: "Erro ao enviar ícone", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    await supabase.from("app_settings").update({ value: whatsappNumber }).eq("key", "whatsapp_number");
    await supabase.from("app_settings").update({ value: whatsappMessage }).eq("key", "whatsapp_message");
    await supabase.from("app_settings").update({ value: requireCommentApproval ? "true" : "false" }).eq("key", "require_comment_approval");
    await supabase.from("app_settings").update({ value: appIconUrl }).eq("key", "app_icon_url");
    toast({ title: "Configurações salvas" });
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Configurações</h2>
      <div className="space-y-4 bg-card rounded-xl border border-border p-4">
        {/* App Icon */}
        <div>
          <label className="text-sm font-medium text-foreground">Ícone da Área de Membros</label>
          <p className="text-xs text-muted-foreground mb-2">Exibido no topo da página inicial</p>
          <div className="flex items-center gap-3">
            {appIconUrl ? (
              <div className="relative">
                <img src={appIconUrl} alt="Ícone" className="w-14 h-14 rounded-full object-cover border border-border" />
                <button
                  onClick={() => setAppIconUrl("")}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-border">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Enviando..." : "Enviar ícone"}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-foreground">Número do WhatsApp</label>
          <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5511999999999" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Mensagem padrão</label>
          <Input value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} placeholder="Olá! Preciso de ajuda." className="mt-1" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <Label className="text-sm font-medium text-foreground">Aprovar comentários</Label>
            <p className="text-xs text-muted-foreground">Exigir aprovação de admin antes de exibir comentários</p>
          </div>
          <Switch checked={requireCommentApproval} onCheckedChange={setRequireCommentApproval} />
        </div>
        <Button onClick={save} className="w-full">Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
