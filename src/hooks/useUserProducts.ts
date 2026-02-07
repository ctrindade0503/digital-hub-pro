import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserProduct {
  id: string;
  product_id: string;
  granted_at: string;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    type: string;
  };
}

export const useUserProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_product_access")
        .select("id, product_id, granted_at, products(id, name, image_url, type)")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        granted_at: item.granted_at,
        product: item.products,
      })) as UserProduct[];
    },
    enabled: !!user,
  });
};
