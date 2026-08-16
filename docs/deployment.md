# Automation, AI, Deployment & Onboarding Guides — FactoryFlow TN

## 1. n8n Automation Architecture (`docs/n8n.md`)
- **Webhook Endpoints:** Triggered on events like `OF_COMPLETED`, `LOW_STOCK_ALERT`, and `MACHINE_DOWNTIME_CRITICAL`.
- **Integrations:** Automated PDF dispatch to factory managers at 17:00 daily via WhatsApp/Telegram/Email.

---

## 2. AI Assistant Architecture (`docs/ai.md`)
- **LLM Engine:** Google Gemini (`@google/genai`).
- **Grounding Principle:** Strict retrieval of verified SQL production metrics; zero extrapolation of fictitious production statistics.
- **Features:** Shift digest generator, scrap root cause explainer, downtime pattern analysis.

---

## 3. Deployment & Environment Setup (`docs/deployment.md`)
- **Frontend Hosting:** Vercel / Netlify / Cloudflare Pages.
- **Backend & Database:** Supabase (`https://ospxrqlyesznvfajcdhm.supabase.co`).
- **Required Environment Variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GEMINI_API_KEY`

---

## 4. Multi-Tenant Onboarding Flow (`docs/onboarding.md`)
1. **Create Organization:** Factory name, slug, logo, contact information.
2. **Create Factory Site:** Address, working shifts, timezone (`Africa/Tunis`).
3. **Add Machines:** Assign codes, departments, and tablet IDs.
4. **Add Workers:** Generate quick PIN codes for operators.
5. **Add Articles / Raw Materials:** Import Excel catalogs or create initial SKUs.
6. **Launch Production:** Start first OF and monitor live dashboard.
