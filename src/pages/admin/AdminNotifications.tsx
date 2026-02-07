import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bell, Users, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const AdminNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState("all");
  const [selectedUser, setSelectedUser] = useState("");
  const [sending, setSending] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ["admin_profiles_notif"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, name, email");
      return data || [];
    },
  });

  const { data: history } = useQuery({
    queryKey: ["admin_notifications_history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", "manual")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }
    setSending(true);
    try {
      if (target === "all") {
        // Use DB function to notify all users
        const { error } = await supabase.rpc("notify_all_users", {
          _title: title,
          _message: message,
          _link: link || null,
          _type: "manual",
          _sender_id: user?.id || null,
        });
        if (error) throw error;
      } else {
        // Send to specific user
        const { error } = await supabase.from("notifications").insert({
          user_id: selectedUser,
          sender_id: user?.id,
          type: "manual",
          title,
          message,
          link: link || null,
        });
        if (error) throw error;
      }
      toast.success("Notificação enviada!");
      setTitle("");
      setMessage("");
      setLink("");
      queryClient.invalidateQueries({ queryKey: ["admin_notifications_history"] });
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Group history by title+message+created_at (batch sends)
  const uniqueHistory = history?.reduce<typeof history>((acc, n) => {
    const key = `${n.title}|${n.message}|${n.created_at?.slice(0, 19)}`;
    if (!acc.find((a: any) => `${a.title}|${a.message}|${a.created_at?.slice(0, 19)}` === key)) {
      acc.push(n);
    }
    return acc;
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Notificações</h2>

      {/* Send form */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Send className="w-4 h-4" />
          Enviar Notificação
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Destinatário</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Todos os usuários</span>
                </SelectItem>
                <SelectItem value="specific">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Usuário específico</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "specific" && (
            <div>
              <Label className="text-xs">Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.name || p.email || p.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Título</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Novidade na plataforma" />
          </div>

          <div>
            <Label className="text-xs">Mensagem</Label>
            <Textarea className="mt-1" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva a notificação..." rows={3} />
          </div>

          <div>
            <Label className="text-xs">Link (opcional)</Label>
            <Input className="mt-1" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/feed ou /community" />
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full">
            <Send className="w-4 h-4 mr-1.5" />
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <Bell className="w-4 h-4" />
          Histórico de envios
        </h3>
        {!uniqueHistory?.length ? (
          <div className="text-center text-muted-foreground py-8 bg-card rounded-xl border border-border">
            <p className="text-sm">Nenhuma notificação manual enviada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uniqueHistory.map((n: any) => (
              <div key={n.id} className="bg-card rounded-xl border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
