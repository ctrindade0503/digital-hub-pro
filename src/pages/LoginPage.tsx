import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/home" },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Link enviado!", description: "Verifique seu e-mail para acessar." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col">
      <div className="flex justify-center pt-6 px-4">
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

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-extrabold text-primary">M</span>
            </div>
            <h1 className="text-xl font-bold text-card-foreground">
              Área de Membros
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sent ? "Verifique seu e-mail" : "Acesse sua conta"}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Enviamos um link mágico para <strong>{email}</strong>. Clique no link do e-mail para entrar.
              </p>
              <Button variant="outline" onClick={() => setSent(false)} className="w-full h-12 rounded-xl">
                Tentar outro e-mail
              </Button>
            </div>
          ) : (
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

              <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base" disabled={loading}>
                {loading ? "Enviando..." : "Entrar"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
