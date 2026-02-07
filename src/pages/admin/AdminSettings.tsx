import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("app_settings").select("*");
      (data || []).forEach((s) => {
        if (s.key === "whatsapp_number") setWhatsappNumber(s.value);
        if (s.key === "whatsapp_message") setWhatsappMessage(s.value);
      });
    };
    fetch();
  }, []);

  const save = async () => {
    await supabase.from("app_settings").update({ value: whatsappNumber }).eq("key", "whatsapp_number");
    await supabase.from("app_settings").update({ value: whatsappMessage }).eq("key", "whatsapp_message");
    toast({ title: "Configurações salvas" });
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Configurações</h2>
      <div className="space-y-4 bg-card rounded-xl border border-border p-4">
        <div>
          <label className="text-sm font-medium text-foreground">Número do WhatsApp</label>
          <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5511999999999" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Mensagem padrão</label>
          <Input value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} placeholder="Olá! Preciso de ajuda." className="mt-1" />
        </div>
        <Button onClick={save} className="w-full">Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
