
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'verifier');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Convenience: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- RLS: admins can view all roles, users can view their own
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

-- RLS: only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- RLS: only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- Add admin-level SELECT policies to existing tables for admin dashboard access

-- Admins can view all verification_submissions
CREATE POLICY "Admins can view all submissions"
ON public.verification_submissions FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update all verification_submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
ON public.verification_submissions FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all fraud_reports
CREATE POLICY "Admins can view all fraud reports"
ON public.fraud_reports FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update fraud_reports
CREATE POLICY "Admins can update fraud reports"
ON public.fraud_reports FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals"
ON public.appeals FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update appeals
CREATE POLICY "Admins can update appeals"
ON public.appeals FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update all profiles (ban/suspend)
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all stakes
CREATE POLICY "Admins can view all stakes"
ON public.stakes FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can view all habits
CREATE POLICY "Admins can view all habits"
ON public.habits FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Create an audit_log table for admin actions
CREATE TABLE public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());
