import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const PdfViewerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "PDF";

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nenhum PDF especificado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-sm font-semibold text-foreground truncate flex-1">{title}</h1>
      </header>
      <iframe
        src={url}
        title={title}
        className="flex-1 w-full border-none"
        allow="fullscreen"
      />
    </div>
  );
};

export default PdfViewerPage;
