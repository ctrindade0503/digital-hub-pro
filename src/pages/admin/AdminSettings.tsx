import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Download, Copy, Code } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const AdminSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [requireCommentApproval, setRequireCommentApproval] = useState(false);
  const [appIconUrl, setAppIconUrl] = useState("");
  const [loginImageUrl, setLoginImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingLogin, setUploadingLogin] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [schemaSql, setSchemaSql] = useState("");
  const [loadingSchema, setLoadingSchema] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("app_settings").select("*");
      (data || []).forEach((s) => {
        if (s.key === "whatsapp_number") setWhatsappNumber(s.value);
        if (s.key === "whatsapp_message") setWhatsappMessage(s.value);
        if (s.key === "require_comment_approval") setRequireCommentApproval(s.value === "true");
        if (s.key === "app_icon_url") setAppIconUrl(s.value);
        if (s.key === "login_image_url") setLoginImageUrl(s.value);
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

  const handleLoginImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogin(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `app/login-image.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      setLoginImageUrl(urlData.publicUrl);
      toast({ title: "Imagem enviada! Salve para aplicar." });
    } catch {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploadingLogin(false);
    }
  };

  const save = async () => {
    await supabase.from("app_settings").update({ value: whatsappNumber }).eq("key", "whatsapp_number");
    await supabase.from("app_settings").update({ value: whatsappMessage }).eq("key", "whatsapp_message");
    await supabase.from("app_settings").update({ value: requireCommentApproval ? "true" : "false" }).eq("key", "require_comment_approval");
    await supabase.from("app_settings").update({ value: appIconUrl }).eq("key", "app_icon_url");
    await supabase.from("app_settings").update({ value: loginImageUrl }).eq("key", "login_image_url");
    toast({ title: "Configurações salvas" });
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("export-csv", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw res.error;
      const tables = res.data as Record<string, string>;

      // Download each table as a separate CSV file
      for (const [tableName, csvContent] of Object.entries(tables)) {
        if (!csvContent || csvContent.startsWith("Error:")) continue;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tableName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({ title: "Exportação concluída", description: "Os arquivos CSV foram baixados." });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({ title: "Erro na exportação", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleLoadSchema = async () => {
    setLoadingSchema(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("export-schema", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw res.error;
      setSchemaSql(res.data?.sql || "Nenhum schema encontrado.");
      toast({ title: "Schema carregado" });
    } catch (err: any) {
      console.error("Schema error:", err);
      toast({ title: "Erro ao carregar schema", description: err.message, variant: "destructive" });
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaSql);
    toast({ title: "SQL copiado para a área de transferência" });
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

        {/* Login Image */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-foreground">Imagem da Tela de Login</label>
          <p className="text-xs text-muted-foreground mb-2">Exibida no topo da página de login</p>
          <div className="flex items-center gap-3">
            {loginImageUrl ? (
              <div className="relative">
                <img src={loginImageUrl} alt="Login" className="h-14 object-contain rounded border border-border" />
                <button
                  onClick={() => setLoginImageUrl("")}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-14 h-14 rounded bg-muted flex items-center justify-center border border-border">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => loginFileInputRef.current?.click()} disabled={uploadingLogin}>
              {uploadingLogin ? "Enviando..." : "Enviar imagem"}
            </Button>
            <input ref={loginFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLoginImageUpload} />
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

        {/* Export CSV */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-foreground">Exportar Dados</label>
          <p className="text-xs text-muted-foreground mb-2">Exportar todas as tabelas do banco de dados em CSV</p>
          <Button variant="outline" onClick={handleExportCsv} disabled={exporting} className="w-full gap-2">
            <Download className="w-4 h-4" />
            {exporting ? "Exportando..." : "Exportar CSV"}
          </Button>
        </div>

        {/* Schema SQL */}
        <div className="border-t border-border pt-4">
          <label className="text-sm font-medium text-foreground">SQL das Tabelas</label>
          <p className="text-xs text-muted-foreground mb-2">Gere o SQL de criação de todas as tabelas para migração</p>
          <Button variant="outline" onClick={handleLoadSchema} disabled={loadingSchema} className="w-full gap-2 mb-3">
            <Code className="w-4 h-4" />
            {loadingSchema ? "Carregando..." : "Gerar SQL"}
          </Button>
          {schemaSql && (
            <div className="space-y-2">
              <Textarea
                value={schemaSql}
                readOnly
                className="font-mono text-xs min-h-[200px] max-h-[400px] bg-muted"
              />
              <Button variant="outline" size="sm" onClick={handleCopySchema} className="w-full gap-2">
                <Copy className="w-4 h-4" />
                Copiar SQL
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
