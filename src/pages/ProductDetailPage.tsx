import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, FileText, Video, Link as LinkIcon, Type, AppWindow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Module {
  id: string;
  title: string;
  sort_order: number;
  image_url: string | null;
  show_order: boolean;
}

interface ModuleContent {
  id: string;
  module_id: string;
  type: string;
  title: string;
  url: string | null;
  content: string | null;
  sort_order: number;
}

const contentTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  link: LinkIcon,
  text: Type,
  app: AppWindow,
};

const moduleColors = [
  "from-primary/20 to-primary/30",
  "from-accent to-accent/80",
  "from-secondary to-secondary/80",
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, description")
        .eq("id", id!)
        .maybeSingle();
      setProduct(prod);

      if (prod) {
        const { data: mods } = await supabase
          .from("modules")
          .select("*")
          .eq("product_id", prod.id)
          .order("sort_order");
        setModules(mods || []);

        if (mods && mods.length > 0) {
          const { data: conts } = await supabase
            .from("module_contents")
            .select("*")
            .in("module_id", mods.map((m) => m.id))
            .order("sort_order");
          setContents(conts || []);
        }
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleContentClick = (c: ModuleContent) => {
    if (c.type === "pdf" && c.url) {
      navigate(`/pdf-viewer?url=${encodeURIComponent(c.url)}&title=${encodeURIComponent(c.title)}`);
    } else if (c.type === "video" && c.url) {
      navigate(`/video-player?url=${encodeURIComponent(c.url)}&title=${encodeURIComponent(c.title)}`);
    } else if ((c.type === "link" || c.type === "app") && c.url) {
      window.open(c.url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      </header>

      <div className="px-4 mt-4">
        <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
        )}
      </div>

      {modules.length > 0 ? (
        <div className="px-4 mt-6 space-y-3">
          {modules.map((mod, index) => {
            const modContents = contents.filter((c) => c.module_id === mod.id);
            return (
              <Collapsible key={mod.id} open={openModules[mod.id]} onOpenChange={() => toggleModule(mod.id)}>
                <CollapsibleTrigger className="w-full">
                  <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-br ${moduleColors[index % moduleColors.length]} p-4 ${mod.image_url ? 'pl-0' : ''} shadow-sm overflow-hidden`}>
                    {mod.image_url && <img src={mod.image_url} alt={mod.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 -my-4 -ml-0" />}
                    {mod.show_order && <span className="text-lg font-bold text-foreground/80">{mod.sort_order}</span>}
                    <span className="text-sm font-semibold text-foreground flex-1 text-left">{mod.title}</span>
                    <span className="text-xs text-muted-foreground">{modContents.length} itens</span>
                    {openModules[mod.id] ? <ChevronDown className="w-4 h-4 text-foreground/60" /> : <ChevronRight className="w-4 h-4 text-foreground/60" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 mt-1 space-y-1">
                    {modContents.map((c) => {
                      const Icon = contentTypeIcons[c.type] || Type;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleContentClick(c)}
                          className="flex items-center gap-2 bg-card rounded-lg p-3 w-full text-left hover:bg-muted transition-colors border border-border"
                        >
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground flex-1">{c.title}</span>
                        </button>
                      );
                    })}
                    {modContents.length === 0 && (
                      <p className="text-xs text-muted-foreground p-2">Nenhum conteúdo neste módulo.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <div className="px-4 mt-6 text-center">
          <p className="text-muted-foreground text-sm">Conteúdo será exibido diretamente ao acessar.</p>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
