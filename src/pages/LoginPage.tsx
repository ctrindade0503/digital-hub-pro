import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginImageUrl, setLoginImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadLoginImage = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "login_image_url")
        .maybeSingle();
      if (data?.value) setLoginImageUrl(data.value);
    };
    loadLoginImage();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, authLoading, navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Force sign out any stale session (both in-memory and localStorage)
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-8 space-y-6">
        {/* Install button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => alert("Para instalar, use o menu do navegador: Adicionar à Tela Inicial")}
          >
            <Download className="w-4 h-4" />
            Instalar App
          </Button>
        </div>

        {/* Login image */}
        {loginImageUrl && (
          <div className="flex justify-center">
            <img src={loginImageUrl} alt="Login" className="max-h-32 object-contain" />
          </div>
        )}

        {/* Title */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-card-foreground">Área de Membros</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse sua conta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl"
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
