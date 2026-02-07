import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link: string | null;
}

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from("banners")
      .select("id, image_url, title, link")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setBanners(data || []));
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => (banners.length ? (c + 1) % banners.length : 0));
  }, [banners.length]);

  const prev = () => {
    setCurrent((c) => (banners.length ? (c - 1 + banners.length) % banners.length : 0));
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (!banners.length) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-[16/8]">
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <a
            key={banner.id}
            href={banner.link || "#"}
            className="flex-shrink-0 w-full h-full relative"
          >
            <img
              src={banner.image_url}
              alt={banner.title || "Banner"}
              className="w-full h-full object-cover"
            />
            {banner.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-4">
                <p className="text-primary-foreground font-semibold text-sm">
                  {banner.title}
                </p>
              </div>
            )}
          </a>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? "bg-primary-foreground" : "bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
