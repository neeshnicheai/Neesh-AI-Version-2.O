-- Create projects table matching Java backend structure
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  one_line_summary TEXT,
  introduction TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blogs table matching Java backend structure
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  heading TEXT,
  cover_image_url TEXT,
  introduction TEXT,
  content TEXT,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Create documents table for knowledge base matching Java backend structure
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_group_id UUID NOT NULL DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data (synced from auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_deleted ON public.projects(deleted);
CREATE INDEX idx_blogs_project_id ON public.blogs(project_id);
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_active ON public.documents(is_active);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id AND deleted = false);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- Public can view published projects (for public blog view)
CREATE POLICY "Public can view published projects"
  ON public.projects FOR SELECT
  USING (status = 'PUBLISHED' AND deleted = false);

-- Blogs RLS Policies
CREATE POLICY "Users can view blogs for their projects"
  ON public.blogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = blogs.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create blogs for their projects"
  ON public.blogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = blogs.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blogs for their projects"
  ON public.blogs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = blogs.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blogs for their projects"
  ON public.blogs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = blogs.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Public can view blogs for published projects
CREATE POLICY "Public can view published blogs"
  ON public.blogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = blogs.project_id 
      AND projects.status = 'PUBLISHED' 
      AND projects.deleted = false
    )
  );

-- Documents RLS Policies
CREATE POLICY "Users can view documents for their projects"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = documents.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for their projects"
  ON public.documents FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = documents.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for their projects"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = documents.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their projects"
  ON public.documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = documents.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique slugs
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_slug TEXT := base_slug;
  counter INTEGER := 1;
BEGIN
  -- Check if base slug exists
  WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = new_slug) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
    IF counter > 1000 THEN
      RAISE EXCEPTION 'Could not generate unique slug';
    END IF;
  END LOOP;
  RETURN new_slug;
END;
$$;

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();