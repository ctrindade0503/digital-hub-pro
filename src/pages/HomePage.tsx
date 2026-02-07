import { Bell } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/mockData";

const HomePage = () => {
  return (
    <div className="pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary">M</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      {/* Banner Carousel */}
      <div className="px-4 mt-4">
        <BannerCarousel />
      </div>

      {/* Products Grid */}
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
