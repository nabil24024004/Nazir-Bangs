-- 0. Set up Clerk User ID function 
CREATE OR REPLACE FUNCTION requesting_user_id() RETURNS text AS $$
    SELECT 
        CASE 
            WHEN current_setting('request.jwt.claims', true) IS NOT NULL 
            THEN (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
            ELSE NULL
        END;
$$ LANGUAGE sql STABLE;

-- 1. Create Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.reaction_type AS ENUM ('like', 'love', 'haha', 'wow', 'sad', 'angry');

-- 2. Create tables
CREATE TABLE public.profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  author_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL
);

CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.post_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, category_id)
);

CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL, -- optional link to profile if authenticated
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reaction_type reaction_type NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_id)
);

CREATE TABLE public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, visitor_id)
);

-- 3. Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up Admin Check Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- PROFILES
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (requesting_user_id() IS NOT NULL AND requesting_user_id() = user_id);

-- USER ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (requesting_user_id() = user_id);
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(requesting_user_id(), 'admin'));

-- POSTS
-- SELECT: Everyone can view non-hidden posts, authors can view their hidden, admins can see all
CREATE POLICY "View posts policy" ON public.posts FOR SELECT 
USING ((is_hidden = false) OR (requesting_user_id() = author_id) OR public.has_role(requesting_user_id(), 'admin'::app_role));

-- INSERT: Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT 
WITH CHECK (requesting_user_id() IS NOT NULL AND requesting_user_id() = author_id);

-- UPDATE/DELETE: Authors can edit/delete their own posts, Admins can edit/delete ANY post
CREATE POLICY "Authors and Admins can update posts" ON public.posts FOR UPDATE 
USING (requesting_user_id() = author_id OR public.has_role(requesting_user_id(), 'admin'::app_role));

CREATE POLICY "Authors and Admins can delete posts" ON public.posts FOR DELETE 
USING (requesting_user_id() = author_id OR public.has_role(requesting_user_id(), 'admin'::app_role));

-- CATEGORIES
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(requesting_user_id(), 'admin'::app_role));

-- POST_CATEGORIES
CREATE POLICY "Anyone can view post categories" ON public.post_categories FOR SELECT USING (true);
CREATE POLICY "Authors and admins can manage post categories" ON public.post_categories FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = post_categories.post_id 
    AND (posts.author_id = requesting_user_id() OR public.has_role(requesting_user_id(), 'admin'::app_role))
  )
);

-- COMMENTS
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.comments FOR INSERT
WITH CHECK (
  author_id IS NULL OR
  (requesting_user_id() IS NOT NULL AND requesting_user_id() = author_id)
);
-- Admins can delete any comment, authors can delete their own
CREATE POLICY "Delete comments policy" ON public.comments FOR DELETE 
USING (requesting_user_id() = author_id OR public.has_role(requesting_user_id(), 'admin'::app_role));

-- REACTIONS & VIEWS (tracked by visitor_id stored in LocalStorage, not authenticated user)
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add own reactions" ON public.post_reactions FOR INSERT
WITH CHECK (requesting_user_id() IS NOT NULL AND visitor_id = requesting_user_id());
CREATE POLICY "Authenticated users can update own reaction" ON public.post_reactions FOR UPDATE
USING (requesting_user_id() IS NOT NULL AND visitor_id = requesting_user_id())
WITH CHECK (requesting_user_id() IS NOT NULL AND visitor_id = requesting_user_id());
CREATE POLICY "Authenticated users can delete own reaction" ON public.post_reactions FOR DELETE
USING (requesting_user_id() IS NOT NULL AND visitor_id = requesting_user_id());

CREATE POLICY "Anyone can view post views" ON public.post_views FOR SELECT USING (true);
CREATE POLICY "Anyone can add views" ON public.post_views FOR INSERT WITH CHECK (true);

-- 7. Storage Policies
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND requesting_user_id() IS NOT NULL);

-- 8. Triggers (auto update timestamps)
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Insert default categories
INSERT INTO public.categories (name, slug) VALUES
  ('Technology', 'technology'),
  ('Lifestyle', 'lifestyle'),
  ('Travel', 'travel'),
  ('Food', 'food'),
  ('Health', 'health'),
  ('Business', 'business'),
  ('Entertainment', 'entertainment'),
  ('Science', 'science')
ON CONFLICT (name) DO NOTHING;
