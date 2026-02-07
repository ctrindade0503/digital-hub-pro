import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const VideoPlayerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Vídeo";

  if (!url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Nenhum vídeo especificado</p>
      </div>
    );
  }

  // Check if it's a YouTube/Vimeo embed
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = url.includes("vimeo.com");
  const isEmbed = isYoutube || isVimeo;

  const getEmbedUrl = (rawUrl: string) => {
    if (isYoutube) {
      const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : rawUrl;
    }
    if (isVimeo) {
      const match = rawUrl.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : rawUrl;
    }
    return rawUrl;
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-sm font-semibold text-foreground truncate flex-1">{title}</h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        {isEmbed ? (
          <iframe
            src={getEmbedUrl(url)}
            title={title}
            className="w-full h-full max-h-[80vh]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="w-full max-h-[80vh]"
          >
            Seu navegador não suporta a reprodução de vídeo.
          </video>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerPage;
