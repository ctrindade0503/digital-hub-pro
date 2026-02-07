import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MESSAGE = "Olá! Preciso de ajuda.";

const WhatsAppFab = () => {
  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
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
