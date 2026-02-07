import whatsappIcon from "@/assets/whatsapp-icon.jpg";
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
    const url = `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-transform"
      aria-label="Suporte via WhatsApp"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-cover" />
    </button>
  );
};

export default WhatsAppFab;
