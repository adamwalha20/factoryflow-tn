# Authentication & Security — FactoryFlow TN

## 1. Authentication Layers

FactoryFlow TN supports a dual-tier authentication architecture:

1. **Management & Web Users:**
   - Authenticated via Supabase Auth (Email + Password / JWT tokens).
   - Profiles linked to `employees` or `users` table with tenant mapping (`organization_id`).

2. **Factory Tablet Operators:**
   - Rapid PIN Code authentication (`pin_code`) or direct machine station assignment (`assigned_tablet_id`).
   - Ensures workers wearing gloves can log into their machine line in under 2 seconds without typing complex passwords on virtual keyboards.

## 2. Token Claims & Row Level Security (RLS)

Each authenticated request provides `auth.uid()`. PostgreSQL functions (`get_current_org_id()` and `get_user_role()`) resolve the active tenant ID and enforce row-level tenant isolation across all 23 database tables.
