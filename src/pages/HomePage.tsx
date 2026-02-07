import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const { unreadCount } = useNotifications();

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
      // Purchased first (in admin sort_order), then non-purchased (in admin sort_order)
      mapped.sort((a, b) => {
        if (a.purchased !== b.purchased) return a.purchased ? -1 : 1;
        return 0; // already sorted by sort_order from DB
      });
      setProducts(mapped);
    };
    load();
  }, []);

  return (
    <div className="pb-32">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary">M</span>
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
