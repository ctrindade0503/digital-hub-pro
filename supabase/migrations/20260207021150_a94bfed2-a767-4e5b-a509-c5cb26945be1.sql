
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT NOT NULL DEFAULT 'simple' CHECK (type IN ('modules', 'simple')),
  purchase_link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User product access (which user bought which product)
CREATE TABLE public.user_product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Module contents table
CREATE TABLE public.module_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('pdf', 'video', 'link', 'text')),
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banners table
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feed posts table
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community posts table
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community post likes
CREATE TABLE public.community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Community post comments
CREATE TABLE public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_feed_posts_updated_at BEFORE UPDATE ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- ENABLE RLS
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles (only admins)
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Products (everyone can read, admins can manage)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User product access
CREATE POLICY "Users can view own access" ON public.user_product_access FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage access" ON public.user_product_access FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Modules
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage modules" ON public.modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Module contents
CREATE POLICY "Anyone can view contents" ON public.module_contents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage contents" ON public.module_contents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Banners
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Feed posts
CREATE POLICY "Anyone can view feed" ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage feed" ON public.feed_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Community posts
CREATE POLICY "Anyone can view community posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage community posts" ON public.community_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Community likes
CREATE POLICY "Anyone can view likes" ON public.community_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like" ON public.community_post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike" ON public.community_post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Community comments
CREATE POLICY "Anyone can view comments" ON public.community_post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can comment" ON public.community_post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.community_post_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage comments" ON public.community_post_comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- App settings
CREATE POLICY "Anyone can view settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default WhatsApp settings
INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_number', '5511999999999');
INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_message', 'Olá! Preciso de ajuda.');

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Admin can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
