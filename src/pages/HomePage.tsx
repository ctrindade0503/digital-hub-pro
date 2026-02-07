import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);

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

      setProducts(
        (prods || []).map((p) => ({
          ...p,
          purchased: accessIds.includes(p.id),
        }))
      );
    };
    load();
  }, []);

  return (
    <div className="pb-32">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary">M</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
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
