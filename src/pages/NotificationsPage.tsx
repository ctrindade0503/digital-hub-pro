import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, CheckCheck, Mail, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, isLoading } = useNotifications();
  const { markRead, markAllRead } = useMarkNotificationRead();
  const hasUnread = notifications.some((n) => !n.read);

  const handleClick = async (n: typeof notifications[0]) => {
    if (!n.read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Notificações</h1>
        </div>
        {hasUnread && (
          <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" />
            Marcar todas
          </Button>
        )}
      </header>

      <div className="px-4 mt-4 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhuma notificação</p>
            <p className="text-xs text-muted-foreground mt-1">Você será notificado sobre atividades importantes.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                n.read
                  ? "bg-card border-border"
                  : "bg-accent/50 border-primary/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${n.read ? "text-muted-foreground" : "text-primary"}`}>
                  {n.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${n.read ? "text-foreground" : "text-primary"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  {n.type === "system" && (
                    <span className="inline-block mt-1.5 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      Sistema
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
