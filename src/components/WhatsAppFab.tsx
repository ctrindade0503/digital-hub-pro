import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppFab = () => {
  const [number, setNumber] = useState("5511999999999");
  const [message, setMessage] = useState("Olá! Preciso de ajuda.");

  useEffect(() => {
    supabase.from("app_settings").select("key, value").in("key", ["whatsapp_number", "whatsapp_message"]).then(({ data }) => {
      (data || []).forEach((s) => {
        if (s.key === "whatsapp_number" && s.value) setNumber(s.value);
        if (s.key === "whatsapp_message" && s.value) setMessage(s.value);
      });
    });
  }, []);

  const handleClick = () => {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-whatsapp flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-primary-foreground" />
    </button>
  );
};

export default WhatsAppFab;
