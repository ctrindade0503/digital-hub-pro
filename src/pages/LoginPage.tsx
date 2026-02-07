import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - goes to home
    navigate("/home");
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
              Acesse sua conta
            </p>
          </div>

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

            <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base">
              Entrar
            </Button>
          </form>

          <p className="text-center mt-6">
            <button
              onClick={() => navigate("/home")}
              className="text-sm text-primary font-medium hover:underline"
            >
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
