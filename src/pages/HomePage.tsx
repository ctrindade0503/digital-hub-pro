import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const [appIconUrl, setAppIconUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "app_icon_url")
        .maybeSingle();
      if (data?.value) setAppIconUrl(data.value);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: prods } = await supabase
        .from("products")
        .select("id, name, description, image_url, type, purchase_link")
        .order("sort_order");

      let accessIds: string[] = [];
      if (userId) {
        const { data: access } = await supabase
          .from("user_product_access")
          .select("product_id")
          .eq("user_id", userId);
        accessIds = (access || []).map((a) => a.product_id);
      }

      const mapped = (prods || []).map((p) => ({
        ...p,
        purchased: accessIds.includes(p.id),
      }));
      mapped.sort((a, b) => {
        if (a.purchased !== b.purchased) return a.purchased ? -1 : 1;
        return 0;
      });
      setProducts(mapped);
    };
    load();
  }, []);

  const displayName = profile?.nickname && profile?.show_nickname
    ? profile.nickname
    : profile?.name || "Usuário";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="pb-32">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          {appIconUrl ? (
            <img src={appIconUrl} alt="Ícone" className="h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary">M</span>
            </div>
          )}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {displayName}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      <div className="px-4 mt-4">
        <BannerCarousel />
      </div>

      <div className="px-4 mt-6">
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
