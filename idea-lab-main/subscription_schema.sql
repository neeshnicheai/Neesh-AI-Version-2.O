-- ============================================
-- Subscription System Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add subscription fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'FREE'
    CHECK (subscription_plan IN ('FREE', 'PRO', 'ENTERPRISE')),
  ADD COLUMN IF NOT EXISTS custom_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_branding_text TEXT;

-- 2. Create blog_promotions table
CREATE TABLE IF NOT EXISTS blog_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'REMOVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blog_id)
);

-- 3. Create promotion_tags table
CREATE TABLE IF NOT EXISTS promotion_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES blog_promotions(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
);

-- 4. Index for fast tag-based lookups
CREATE INDEX IF NOT EXISTS idx_promotion_tags_tag ON promotion_tags(tag);
CREATE INDEX IF NOT EXISTS idx_blog_promotions_status ON blog_promotions(status);
CREATE INDEX IF NOT EXISTS idx_blog_promotions_user ON blog_promotions(user_id);
