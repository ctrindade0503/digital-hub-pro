import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useAppColors } from "@/hooks/useAppColors";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import FeedPage from "./pages/FeedPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import PdfViewerPage from "./pages/PdfViewerPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminFeed from "./pages/admin/AdminFeed";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminColors from "./pages/admin/AdminColors";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import WhatsAppFab from "./components/WhatsAppFab";

const queryClient = new QueryClient();

const AppLayout = () => {
  useTheme();
  useAppColors();
  const location = useLocation();
  const isLogin = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");
  const isFullscreen = location.pathname === "/pdf-viewer" || location.pathname === "/video-player";
  const showNav = !isLogin && !isFullscreen;
  const showWhatsApp = !isLogin && !isAdmin && !isFullscreen;

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background relative">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/pdf-viewer" element={<PdfViewerPage />} />
        <Route path="/video-player" element={<VideoPlayerPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/products" replace />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="feed" element={<AdminFeed />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="colors" element={<AdminColors />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showWhatsApp && <WhatsAppFab />}
      {showNav && <BottomNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
