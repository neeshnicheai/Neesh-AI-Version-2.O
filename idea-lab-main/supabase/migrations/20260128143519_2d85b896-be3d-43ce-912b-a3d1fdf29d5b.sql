-- Create enum for persona types
CREATE TYPE public.audience_persona AS ENUM ('developer', 'marketer', 'investor', 'designer', 'entrepreneur', 'researcher', 'other');

-- Create table for audience members (visitors who interact)
CREATE TABLE public.audience_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  occupation TEXT,
  detected_persona audience_persona DEFAULT 'other',
  persona_confidence DECIMAL(3,2) DEFAULT 0.00,
  first_interaction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_interaction_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_questions INTEGER DEFAULT 0,
  total_feedback INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for persona insights (aggregated analysis)
CREATE TABLE public.persona_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  persona audience_persona NOT NULL,
  total_members INTEGER DEFAULT 0,
  common_questions JSONB DEFAULT '[]'::jsonb,
  confusion_points JSONB DEFAULT '[]'::jsonb,
  content_suggestions JSONB DEFAULT '[]'::jsonb,
  avg_engagement_score DECIMAL(5,2) DEFAULT 0.00,
  last_analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, persona)
);

-- Create table for audience questions (for analysis)
CREATE TABLE public.audience_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  member_id UUID REFERENCES public.audience_members(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  detected_topic TEXT,
  is_answered BOOLEAN DEFAULT false,
  asked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.audience_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for now, since no auth)
CREATE POLICY "Allow public read access to audience_members"
  ON public.audience_members FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to audience_members"
  ON public.audience_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to audience_members"
  ON public.audience_members FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to persona_insights"
  ON public.persona_insights FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to persona_insights"
  ON public.persona_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to persona_insights"
  ON public.persona_insights FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to audience_questions"
  ON public.audience_questions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to audience_questions"
  ON public.audience_questions FOR INSERT
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_audience_members_updated_at
  BEFORE UPDATE ON public.audience_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_persona_insights_updated_at
  BEFORE UPDATE ON public.persona_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();