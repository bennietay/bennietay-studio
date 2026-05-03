-- Supabase Schema for Bennie Tay Studio

-- 1. Users/Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'client' CHECK (role IN ('super_admin', 'business_admin', 'client', 'affiliate', 'staff')),
  business_id UUID,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  industry TEXT,
  business_nature TEXT,
  location TEXT,
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_secret_key TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret TEXT,
  stripe_connected_account_id TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  early_subscription_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  ai_credits INTEGER DEFAULT 10,
  ai_credits_used INTEGER DEFAULT 0,
  referred_by_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  marketing_plan TEXT DEFAULT 'none' CHECK (marketing_plan IN ('none', 'active')),
  marketing_trial_ends_at TIMESTAMPTZ,
  marketing_status TEXT DEFAULT 'inactive' CHECK (marketing_status IN ('active', 'trialing', 'inactive')),
  ga_measurement_id TEXT,
  meta_pixel_id TEXT,
  tracking_scripts_header TEXT,
  tracking_scripts_footer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist for existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS marketing_plan TEXT DEFAULT 'none';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS marketing_trial_ends_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS marketing_status TEXT DEFAULT 'inactive';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tracking_scripts_header TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tracking_scripts_footer TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 10;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_model_config JSONB DEFAULT '{
  "synthesis": "gemini-3-flash-preview",
  "seo": "gemini-3-flash-preview",
  "chatbot": "gemini-3.1-flash-lite-preview",
  "blog": "gemini-3-flash-preview",
  "marketing": "gemini-3-flash-preview"
}';

-- 14. AI Usage Logs table for scaling and auditing
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  use_case TEXT NOT NULL,
  model_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  estimated_cost FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance at scale
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_business_id ON ai_usage_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- AI Usage tracking function optimized for scaling
CREATE OR REPLACE FUNCTION increment_ai_usage(biz_id UUID, amount INTEGER, use_case_name TEXT DEFAULT 'synthesis', model_name TEXT DEFAULT 'unknown')
RETURNS VOID AS $$
DECLARE
  v_cost FLOAT;
BEGIN
  v_cost := amount * 0.002; -- Basic cost estimation

  UPDATE businesses 
  SET ai_credits_used = ai_credits_used + amount 
  WHERE id = biz_id;
  
  -- Log individual usage for auditing and trends (better for scale than single row contention)
  INSERT INTO ai_usage_logs (business_id, use_case, model_id, amount, estimated_cost)
  VALUES (biz_id, use_case_name, model_name, amount, v_cost);

  -- Log metrics (we keep this for quick aggregate view, but logs allow historical analysis)
  INSERT INTO settings (id, content, updated_at)
  VALUES ('ai_metrics', 
    jsonb_build_object(
      'totalGenerations', amount,
      'estimatedCost', v_cost
    ),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    content = jsonb_build_object(
      'totalGenerations', COALESCE((settings.content->>'totalGenerations')::int, 0) + amount,
      'estimatedCost', COALESCE((settings.content->>'estimatedCost')::float, 0.0) + v_cost
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Websites table
CREATE TABLE IF NOT EXISTS websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  theme JSONB NOT NULL,
  pages JSONB NOT NULL,
  seo JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Blog Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT NOT NULL,
  config JSONB,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, -- e.g., 'landing_page', 'plans'
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default archetype config if not exists
INSERT INTO settings (id, content)
VALUES ('archetype_config', '{
  "enabledStyles": ["modern", "neumorphic", "glassmorphic", "brutalist", "editorial", "action", "immersive", "authority", "corporate"],
  "enabledThemes": ["Authority Master", "Lead Multiplier", "Visual Narrative", "Minimalist Clean", "Corporate Pro", "Midnight Glass", "Scandinavian"]
}')
ON CONFLICT (id) DO NOTHING;

-- 9. Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Support Messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('lead', 'appointment', 'payout', 'system', 'billing')),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('published', 'pending', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  stock TEXT DEFAULT 'Unlimited',
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Orders table (Product Sales)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'paid')),
  stripe_session_id TEXT,
  items JSONB NOT NULL, -- [{ productId, name, quantity, price }]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Revenue Analytics Helper
CREATE OR REPLACE VIEW revenue_by_business AS
SELECT 
  business_id,
  SUM(total_amount) as total_revenue,
  COUNT(id) as order_count,
  DATE_TRUNC('month', created_at) as month
FROM orders
WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
GROUP BY business_id, month;

-- 17. Traffic Analytics table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL, -- Client-side generated unique ID
  session_id TEXT NOT NULL, -- Current session identifier
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-performance aggregations
CREATE INDEX IF NOT EXISTS idx_page_views_business_id ON page_views(business_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);

-- RLS Policies for page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert page views" ON page_views;
DROP POLICY IF EXISTS "Business admins can view own analytics" ON page_views;
DROP POLICY IF EXISTS "Super Admins can view all analytics" ON page_views;

CREATE POLICY "Public can insert page views" ON page_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Business admins can view own analytics" ON page_views FOR SELECT USING (is_business_admin(business_id));
CREATE POLICY "Super Admins can view all analytics" ON page_views FOR SELECT USING (is_super_admin());

-- 18. Analytics Helper Function for Super Admin
CREATE OR REPLACE FUNCTION get_platform_traffic_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  unique_visitors BIGINT,
  avg_views_per_visitor NUMERIC,
  page_path TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT visitor_id) as uniques
    FROM page_views
    WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
  ),
  top_pages AS (
    SELECT 
      pv.page_path,
      COUNT(*) as cnt
    FROM page_views pv
    WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY pv.page_path
    ORDER BY cnt DESC
    LIMIT 10
  )
  SELECT 
    ds.total,
    ds.uniques,
    (ds.total::NUMERIC / NULLIF(ds.uniques, 0))::NUMERIC(10,2),
    tp.page_path,
    tp.cnt
  FROM daily_stats ds, top_pages tp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Daily Traffic Trend Function
CREATE OR REPLACE FUNCTION get_daily_traffic_trend(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  date TEXT,
  views BIGINT,
  uniques BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(created_at, 'YYYY-MM-DD') as day,
    COUNT(*) as daily_views,
    COUNT(DISTINCT visitor_id) as daily_uniques
  FROM page_views
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY day
  ORDER BY day ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Migration helper (Run these if you have an existing database)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'business_admin', 'client', 'affiliate'));

-- Helper function to check if user is super admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's business_id safely
CREATE OR REPLACE FUNCTION get_auth_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT business_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is business admin
CREATE OR REPLACE FUNCTION is_business_admin(target_business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  caller_role TEXT;
  caller_biz_id UUID;
BEGIN
  SELECT role, business_id INTO caller_role, caller_biz_id
  FROM profiles WHERE id = auth.uid();
  
  IF caller_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  RETURN caller_biz_id = target_business_id AND caller_role IN ('business_admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper for business_id_matches to avoid recursion
CREATE OR REPLACE FUNCTION business_id_matches(target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT business_id FROM profiles WHERE id = auth.uid()) = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Business members can view each other" ON profiles;
DROP POLICY IF EXISTS "Business admins can update business profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can delete all profiles" ON profiles;

DROP POLICY IF EXISTS "Owners can view own business" ON businesses;
DROP POLICY IF EXISTS "Business members can view own business" ON businesses;
DROP POLICY IF EXISTS "Owners can insert business" ON businesses;
DROP POLICY IF EXISTS "Owners can update own business" ON businesses;
DROP POLICY IF EXISTS "Business admins can update own business" ON businesses;
DROP POLICY IF EXISTS "Owners can delete own business" ON businesses;
DROP POLICY IF EXISTS "Super Admins can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Super Admins can manage all businesses" ON businesses;
DROP POLICY IF EXISTS "Public can view basic business info" ON businesses;

DROP POLICY IF EXISTS "Business members can view own websites" ON websites;
DROP POLICY IF EXISTS "Business admins can insert websites" ON websites;
DROP POLICY IF EXISTS "Business admins can update own websites" ON websites;
DROP POLICY IF EXISTS "Business admins can delete own websites" ON websites;
DROP POLICY IF EXISTS "Business admins can manage websites" ON websites;
DROP POLICY IF EXISTS "Super Admins can manage all websites" ON websites;
DROP POLICY IF EXISTS "Public can view published websites" ON websites;

DROP POLICY IF EXISTS "Business members can view own leads" ON leads;
DROP POLICY IF EXISTS "Public can insert leads" ON leads;
DROP POLICY IF EXISTS "Business members can update own leads" ON leads;
DROP POLICY IF EXISTS "Business members can delete own leads" ON leads;
DROP POLICY IF EXISTS "Business members can manage own leads" ON leads;
DROP POLICY IF EXISTS "Super Admins can manage all leads" ON leads;

DROP POLICY IF EXISTS "Public can view published posts" ON posts;
DROP POLICY IF EXISTS "Business members can view all posts" ON posts;
DROP POLICY IF EXISTS "Business admins can insert posts" ON posts;
DROP POLICY IF EXISTS "Business admins can update own posts" ON posts;
DROP POLICY IF EXISTS "Business admins can delete own posts" ON posts;
DROP POLICY IF EXISTS "Super Admins can manage all posts" ON posts;
DROP POLICY IF EXISTS "Business admins can manage posts" ON posts;

DROP POLICY IF EXISTS "Business members can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Business members can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Business members can delete own appointments" ON appointments;
DROP POLICY IF EXISTS "Super Admins can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Business members can manage own appointments" ON appointments;

DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Authenticated read shared settings" ON settings;
DROP POLICY IF EXISTS "Super Admin write settings" ON settings;

DROP POLICY IF EXISTS "Users can manage own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super Admins can manage all tickets" ON support_tickets;

DROP POLICY IF EXISTS "Users can manage messages for own tickets" ON support_messages;
DROP POLICY IF EXISTS "Super Admins can manage all messages" ON support_messages;

DROP POLICY IF EXISTS "Public can view templates" ON templates;
DROP POLICY IF EXISTS "Super Admins can manage templates" ON templates;

DROP POLICY IF EXISTS "Public can view geo pricing" ON geo_pricing;
DROP POLICY IF EXISTS "Admins can manage geo pricing" ON geo_pricing;

DROP POLICY IF EXISTS "Public can view active programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Business admins can manage own program" ON affiliate_programs;
DROP POLICY IF EXISTS "Affiliates can view their business program" ON affiliate_programs;

DROP POLICY IF EXISTS "Affiliates can view their earnings" ON affiliates;
DROP POLICY IF EXISTS "Public can check referral code" ON affiliates;
DROP POLICY IF EXISTS "Business admins can manage business affiliates" ON affiliates;

DROP POLICY IF EXISTS "Affiliates can view their referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Business admins can manage referrals" ON affiliate_referrals;

DROP POLICY IF EXISTS "Affiliates can view their payouts" ON affiliate_payouts;
DROP POLICY IF EXISTS "Affiliates can insert payout requests" ON affiliate_payouts;
DROP POLICY IF EXISTS "Business admins can manage payouts" ON affiliate_payouts;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Super Admins can manage all notifications" ON notifications;

DROP POLICY IF EXISTS "Public can view published reviews" ON reviews;
DROP POLICY IF EXISTS "Business members can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Public can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Business admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Super Admins can manage all reviews" ON reviews;

DROP POLICY IF EXISTS "Business members can view own products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Business admins can manage products" ON products;
DROP POLICY IF EXISTS "Super Admins can manage all products" ON products;

-- Profiles: Users can read/write their own profile, Business members can see each other.
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Business members can view each other" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Business admins can update business profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super Admins can delete all profiles" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Business members can view each other" ON profiles FOR SELECT USING (is_business_admin(business_id));
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Business admins can update business profiles" ON profiles FOR UPDATE 
USING (is_business_admin(business_id))
WITH CHECK (
  is_business_admin(business_id) AND 
  (role != 'super_admin' OR is_super_admin())
);
CREATE POLICY "Super Admins can view all profiles" ON profiles FOR SELECT USING (is_super_admin());
CREATE POLICY "Super Admins can update all profiles" ON profiles FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super Admins can delete all profiles" ON profiles FOR DELETE USING (is_super_admin());

DROP POLICY IF EXISTS "Anyone can create an order" ON orders;
DROP POLICY IF EXISTS "Business members can view own orders" ON orders;
DROP POLICY IF EXISTS "Super Admins can manage all orders" ON orders;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create an order" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Business members can view own orders" ON orders FOR SELECT USING (is_business_admin(business_id));
CREATE POLICY "Super Admins can manage all orders" ON orders FOR ALL USING (is_super_admin());

-- Businesses: Members can view, Admins can update.
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members can view own business" ON businesses FOR SELECT USING (
  auth.uid() = owner_id OR business_id_matches(id)
);
-- Public can only see basic business info if they have a published website
CREATE POLICY "Public can view basic business info" ON businesses FOR SELECT USING (
  EXISTS (SELECT 1 FROM websites WHERE business_id = businesses.id AND status = 'published')
);

-- AI Credit Management
CREATE OR REPLACE FUNCTION deduct_ai_credits(p_business_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE businesses
  SET 
    ai_credits = ai_credits - p_amount,
    ai_credits_used = ai_credits_used + p_amount
  WHERE id = p_business_id AND ai_credits >= p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sum_unpaid_earnings()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(unpaid_earnings), 0) FROM affiliates);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reward_affiliate(aff_id UUID, amount DECIMAL, sale_val DECIMAL)
RETURNS VOID AS $$
BEGIN
  -- 1. Update Affiliate Balance
  UPDATE affiliates SET 
    total_earnings = total_earnings + amount,
    unpaid_earnings = unpaid_earnings + amount,
    total_referrals = total_referrals + 1
  WHERE id = aff_id;

  -- 2. Log Referral
  INSERT INTO affiliate_referrals (affiliate_id, status, commission_amount, sale_amount)
  VALUES (aff_id, 'converted', amount, sale_val);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION process_payout(p_payout_id UUID)
RETURNS VOID AS $$
DECLARE
  v_affiliate_id UUID;
  v_amount DECIMAL;
BEGIN
  -- 1. Get payout info
  SELECT affiliate_id, amount INTO v_affiliate_id, v_amount
  FROM affiliate_payouts
  WHERE id = p_payout_id AND status = 'pending';

  IF v_affiliate_id IS NOT NULL THEN
    -- 2. Update payout status
    UPDATE affiliate_payouts SET 
      status = 'processed',
      processed_at = NOW()
    WHERE id = p_payout_id;

    -- 3. Deduct from affiliate unpaid earnings
    UPDATE affiliates SET 
      unpaid_earnings = unpaid_earnings - v_amount
    WHERE id = v_affiliate_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geo-Pricing Table
CREATE TABLE IF NOT EXISTS geo_pricing (
  country_code TEXT PRIMARY KEY, -- ISO 2-letter country code (e.g., 'IN', 'PH', 'BR')
  country_name TEXT,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 90),
  stripe_coupon_id TEXT, -- Optional: Real Stripe Coupon ID for this country
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE geo_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view geo pricing" ON geo_pricing;
CREATE POLICY "Public can view geo pricing" ON geo_pricing FOR SELECT USING (is_enabled = TRUE);
DROP POLICY IF EXISTS "Admins can manage geo pricing" ON geo_pricing;
CREATE POLICY "Admins can manage geo pricing" ON geo_pricing FOR ALL USING (is_super_admin());

-- Seed Geo Pricing
INSERT INTO geo_pricing (country_code, country_name, discount_percentage)
VALUES 
  ('IN', 'India', 40),
  ('BR', 'Brazil', 30),
  ('PH', 'Philippines', 35),
  ('ID', 'Indonesia', 35),
  ('EG', 'Egypt', 45),
  ('PK', 'Pakistan', 50),
  ('NG', 'Nigeria', 40),
  ('US', 'United States', 0),
  ('GB', 'United Kingdom', 0),
  ('CA', 'Canada', 0),
  ('AU', 'Australia', 0),
  ('SG', 'Singapore', 0)
ON CONFLICT (country_code) DO NOTHING;

DROP POLICY IF EXISTS "Owners can insert business" ON businesses;
DROP POLICY IF EXISTS "Business admins can update own business" ON businesses;
DROP POLICY IF EXISTS "Owners can delete own business" ON businesses;
DROP POLICY IF EXISTS "Super Admins can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Super Admins can manage all businesses" ON businesses;
DROP POLICY IF EXISTS "Business members can view own business" ON businesses;
DROP POLICY IF EXISTS "Public can view basic business info" ON businesses;

CREATE POLICY "Business members can view own business" ON businesses FOR SELECT USING (
  auth.uid() = owner_id OR business_id_matches(id)
);
CREATE POLICY "Public can view basic business info" ON businesses FOR SELECT USING (
  EXISTS (SELECT 1 FROM websites WHERE business_id = businesses.id AND status = 'published')
);
CREATE POLICY "Owners can insert business" ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Business admins can update own business" ON businesses FOR UPDATE USING (
  auth.uid() = owner_id OR is_business_admin(id)
);
CREATE POLICY "Owners can delete own business" ON businesses FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Super Admins can view all businesses" ON businesses FOR SELECT USING (is_super_admin());
CREATE POLICY "Super Admins can manage all businesses" ON businesses FOR ALL USING (is_super_admin());

-- Websites: Business members can view, Admins can manage, Public can view published.
DROP POLICY IF EXISTS "Public can view published websites" ON websites;
DROP POLICY IF EXISTS "Business members can view own websites" ON websites;
DROP POLICY IF EXISTS "Business admins can manage websites" ON websites;
DROP POLICY IF EXISTS "Super Admins can manage all websites" ON websites;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published websites" ON websites FOR SELECT USING (status = 'published');
CREATE POLICY "Business members can view own websites" ON websites FOR SELECT USING (
  is_business_admin(business_id)
);
CREATE POLICY "Business admins can manage websites" ON websites FOR ALL USING (
  is_business_admin(business_id)
);
CREATE POLICY "Super Admins can manage all websites" ON websites FOR ALL USING (is_super_admin());

-- Leads: Business members can view/manage, Public can insert.
DROP POLICY IF EXISTS "Business members can view own leads" ON leads;
DROP POLICY IF EXISTS "Public can insert leads" ON leads;
DROP POLICY IF EXISTS "Business members can manage own leads" ON leads;
DROP POLICY IF EXISTS "Super Admins can manage all leads" ON leads;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business members can view own leads" ON leads FOR SELECT USING (
  is_business_admin(business_id)
);
CREATE POLICY "Public can insert leads" ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Business members can manage own leads" ON leads FOR ALL USING (
  is_business_admin(business_id)
);
CREATE POLICY "Super Admins can manage all leads" ON leads FOR ALL USING (is_super_admin());

-- Posts: Public can view published, Business members can view all, Admins can manage.
DROP POLICY IF EXISTS "Public can view published posts" ON posts;
DROP POLICY IF EXISTS "Business members can view all posts" ON posts;
DROP POLICY IF EXISTS "Business admins can manage posts" ON posts;
DROP POLICY IF EXISTS "Super Admins can manage all posts" ON posts;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Business members can view all posts" ON posts FOR SELECT USING (
  is_business_admin(business_id)
);
CREATE POLICY "Business admins can manage posts" ON posts FOR ALL USING (
  is_business_admin(business_id)
);
CREATE POLICY "Super Admins can manage all posts" ON posts FOR ALL USING (is_super_admin());

-- Appointments: Business members can view/manage, Public can insert.
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business members can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Business members can manage own appointments" ON appointments;
DROP POLICY IF EXISTS "Super Admins can manage all appointments" ON appointments;

CREATE POLICY "Business members can view own appointments" ON appointments FOR SELECT USING (
  is_business_admin(business_id)
);
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Business members can manage own appointments" ON appointments FOR ALL USING (
  is_business_admin(business_id)
);

-- Settings: Public read for specific non-sensitive IDs, Super Admin write.
DROP POLICY IF EXISTS "Authenticated read shared settings" ON settings;
DROP POLICY IF EXISTS "Super Admin write settings" ON settings;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read shared settings" ON settings FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    id LIKE 'landing_page%' OR 
    id LIKE 'business_policies_%' OR 
    id = 'plans' OR 
    id = 'marketing_hub_config' OR
    id = 'platform_public' OR
    id = 'archetype_config'
  )
);
CREATE POLICY "Super Admin write settings" ON settings FOR ALL USING (is_super_admin());

-- Support Tickets: Users can manage own, Super Admins can manage all.
DROP POLICY IF EXISTS "Users can manage own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super Admins can manage all tickets" ON support_tickets;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tickets" ON support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Super Admins can manage all tickets" ON support_tickets FOR ALL USING (is_super_admin());

-- Support Messages: Users can manage messages for their own tickets, Super Admins can manage all.
DROP POLICY IF EXISTS "Users can manage messages for own tickets" ON support_messages;
DROP POLICY IF EXISTS "Super Admins can manage all messages" ON support_messages;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage messages for own tickets" ON support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Super Admins can manage all messages" ON support_messages FOR ALL USING (is_super_admin());

-- Templates: Public read, Super Admin manage.
DROP POLICY IF EXISTS "Public can view templates" ON templates;
DROP POLICY IF EXISTS "Super Admins can manage templates" ON templates;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view templates" ON templates FOR SELECT USING (TRUE);
CREATE POLICY "Super Admins can manage templates" ON templates FOR ALL USING (is_super_admin());

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_websites_updated_at ON websites;
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Affiliate Tables
CREATE TABLE IF NOT EXISTS affiliate_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  base_commission_rate DECIMAL(5,2) DEFAULT 0.1,
  payout_minimum DECIMAL(10,2) DEFAULT 50.0,
  cookie_duration_days INTEGER DEFAULT 30,
  terms_and_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES affiliate_programs ON DELETE CASCADE,
  name TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  requirement_type TEXT CHECK (requirement_type IN ('total_sales', 'referral_count', 'revenue_generated')),
  requirement_value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid UUID REFERENCES auth.users ON DELETE CASCADE,
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  total_earnings DECIMAL(10,2) DEFAULT 0.0,
  unpaid_earnings DECIMAL(10,2) DEFAULT 0.0,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(uid, business_id)
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates ON DELETE CASCADE,
  lead_id UUID REFERENCES leads ON DELETE SET NULL,
  referred_user_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled')),
  commission_amount DECIMAL(10,2) DEFAULT 0.0,
  sale_amount DECIMAL(10,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  payment_method TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Business admins can manage own program" ON affiliate_programs;
DROP POLICY IF EXISTS "Affiliates can view their business program" ON affiliate_programs;

DROP POLICY IF EXISTS "Affiliates can view their earnings" ON affiliates;
DROP POLICY IF EXISTS "Public can check referral code" ON affiliates;
DROP POLICY IF EXISTS "Business admins can manage business affiliates" ON affiliates;

DROP POLICY IF EXISTS "Affiliates can view their referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "Business admins can manage referrals" ON affiliate_referrals;

DROP POLICY IF EXISTS "Affiliates can view their payouts" ON affiliate_payouts;
DROP POLICY IF EXISTS "Affiliates can insert payout requests" ON affiliate_payouts;
DROP POLICY IF EXISTS "Business admins can manage payouts" ON affiliate_payouts;

CREATE POLICY "Public can view active programs" ON affiliate_programs FOR SELECT USING (is_enabled = TRUE);
CREATE POLICY "Business admins can manage own program" ON affiliate_programs FOR ALL USING (is_business_admin(business_id));
CREATE POLICY "Affiliates can view their business program" ON affiliate_programs FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE uid = auth.uid() AND business_id = affiliate_programs.business_id)
);

CREATE POLICY "Affiliates can view their earnings" ON affiliates FOR SELECT USING (uid = auth.uid());
CREATE POLICY "Public can check referral code" ON affiliates FOR SELECT USING (status = 'active');
CREATE POLICY "Business admins can manage business affiliates" ON affiliates FOR ALL USING (is_business_admin(business_id));

CREATE POLICY "Affiliates can view their referrals" ON affiliate_referrals FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_referrals.affiliate_id AND uid = auth.uid())
);
CREATE POLICY "Business admins can manage referrals" ON affiliate_referrals FOR ALL USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_referrals.affiliate_id AND is_business_admin(business_id))
);

-- Payouts Policies
CREATE POLICY "Affiliates can view their payouts" ON affiliate_payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_payouts.affiliate_id AND uid = auth.uid())
);
CREATE POLICY "Affiliates can insert payout requests" ON affiliate_payouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_payouts.affiliate_id AND uid = auth.uid())
);
CREATE POLICY "Business admins can manage payouts" ON affiliate_payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_payouts.affiliate_id AND is_business_admin(business_id))
);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Super Admins can manage all notifications" ON notifications;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  auth.uid() = user_id OR is_business_admin(business_id)
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  auth.uid() = user_id OR is_business_admin(business_id)
);
CREATE POLICY "Super Admins can manage all notifications" ON notifications FOR ALL USING (is_super_admin());

-- 21. Performance Indexes for Scaling (1,000+ Customers)
-- Scoped by business_id for multi-tenant isolation performance
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_websites_business_id ON websites(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_posts_business_id ON posts(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_business_id ON affiliates(business_id);

-- Date based indexes for charts/dashboards per business
CREATE INDEX IF NOT EXISTS idx_orders_business_created ON orders(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_business_created ON leads(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- End of schema
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id FROM businesses WHERE id = NEW.business_id;
  
  INSERT INTO notifications (user_id, business_id, title, message, type, metadata)
  VALUES (
    v_owner_id, 
    NEW.business_id, 
    'New Lead Received', 
    'You have a new lead: ' || NEW.name || ' (' || NEW.email || ')',
    'lead',
    jsonb_build_object('lead_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_lead ON leads;
CREATE TRIGGER trigger_notify_new_lead
AFTER INSERT ON leads
FOR EACH ROW EXECUTE PROCEDURE notify_new_lead();

CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id FROM businesses WHERE id = NEW.business_id;
  
  INSERT INTO notifications (user_id, business_id, title, message, type, metadata)
  VALUES (
    v_owner_id, 
    NEW.business_id, 
    'New Appointment Booked', 
    'A new appointment has been booked by ' || NEW.customer_name || ' for ' || NEW.date || ' at ' || NEW.time,
    'appointment',
    jsonb_build_object('appointment_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_appointment ON appointments;
CREATE TRIGGER trigger_notify_new_appointment
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE PROCEDURE notify_new_appointment();

CREATE OR REPLACE FUNCTION notify_new_payout_request()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_business_id UUID;
BEGIN
  SELECT business_id INTO v_business_id FROM affiliates WHERE id = NEW.affiliate_id;
  SELECT owner_id INTO v_owner_id FROM businesses WHERE id = v_business_id;
  
  INSERT INTO notifications (user_id, business_id, title, message, type, metadata)
  VALUES (
    v_owner_id, 
    v_business_id, 
    'New Payout Request', 
    'An affiliate has requested a payout of $' || NEW.amount,
    'payout',
    jsonb_build_object('payout_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_payout_request ON affiliate_payouts;
CREATE TRIGGER trigger_notify_new_payout_request
AFTER INSERT ON affiliate_payouts
FOR EACH ROW EXECUTE PROCEDURE notify_new_payout_request();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Realtime and Triggers
DO $$
BEGIN
  -- Realtime tables
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE websites;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
