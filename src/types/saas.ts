export interface PlanLimits {
  max_factories: number;
  max_machines: number;
  max_workers: number;
  max_users: number;
  history_days?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'starter' | 'professional' | 'enterprise';
  description: string;
  monthly_price: number;
  annual_price: number;
  currency: string;
  features: string[];
  limits: PlanLimits;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'annual';
  trial_start?: string;
  trial_end?: string;
  start_date: string;
  renewal_date?: string;
  cancelled_at?: string;
  provider: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export type OrgRole = 'OWNER' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'VIEWER';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
  created_at: string;
  user?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  legal_name?: string;
  industry?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  governorate?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  employee_count?: number;
  machine_count?: number;
  production_type?: string;
  timezone: string;
  default_language: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at?: string;
}

export interface Factory {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  factory_size?: string;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  created_at: string;
}
