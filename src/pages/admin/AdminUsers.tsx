import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ShieldOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Profile { id: string; user_id: string; name: string | null; email: string | null; }
interface Role { user_id: string; role: string; }
interface ProductAccess { user_id: string; product_id: string; }
interface Product { id: string; name: string; }

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accessDialogUser, setAccessDialogUser] = useState<Profile | null>(null);
  const [userAccess, setUserAccess] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    const [{ data: p }, { data: r }, { data: pr }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("products").select("id, name").order("name"),
    ]);
    setProfiles(p || []);
    setRoles(r || []);
    setProducts(pr || []);
  };

  useEffect(() => { fetchData(); }, []);

  const isAdmin = (userId: string) => roles.some(r => r.user_id === userId && r.role === "admin");

  const toggleAdmin = async (userId: string) => {
    if (isAdmin(userId)) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast({ title: "Admin removido" });
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      toast({ title: "Admin adicionado" });
    }
    fetchData();
  };

  const openAccessDialog = async (profile: Profile) => {
    setAccessDialogUser(profile);
    const { data } = await supabase.from("user_product_access").select("product_id").eq("user_id", profile.user_id);
    setUserAccess((data || []).map(a => a.product_id));
  };

  const toggleAccess = async (productId: string) => {
    if (!accessDialogUser) return;
    const userId = accessDialogUser.user_id;
    if (userAccess.includes(productId)) {
      await supabase.from("user_product_access").delete().eq("user_id", userId).eq("product_id", productId);
      setUserAccess(prev => prev.filter(id => id !== productId));
    } else {
      await supabase.from("user_product_access").insert({ user_id: userId, product_id: productId });
      setUserAccess(prev => [...prev, productId]);
    }
    toast({ title: "Acesso atualizado" });
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Usuários ({profiles.length})</h2>

      <div className="space-y-2">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{(p.name || "U")[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{p.name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openAccessDialog(p)} title="Gerenciar acesso">
              <Package className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toggleAdmin(p.user_id)} title={isAdmin(p.user_id) ? "Remover admin" : "Tornar admin"}>
              {isAdmin(p.user_id) ? <Shield className="w-4 h-4 text-primary" /> : <ShieldOff className="w-4 h-4 text-muted-foreground" />}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!accessDialogUser} onOpenChange={(o) => { if (!o) setAccessDialogUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Acesso de {accessDialogUser?.name || "Usuário"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {products.map((pr) => (
              <label key={pr.id} className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={userAccess.includes(pr.id)} onCheckedChange={() => toggleAccess(pr.id)} />
                <span className="text-sm text-foreground">{pr.name}</span>
              </label>
            ))}
            {products.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
