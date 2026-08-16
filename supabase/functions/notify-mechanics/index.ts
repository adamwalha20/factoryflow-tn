import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const publicVapidKey = "BJ8pAc_-tEVV0rui6uvgvY5v7byTGtdnwcUrGylkUoRqC_qE4H6IdtW4UCmP6AAcgMxyOWDxF87bzlaXZFpjvpE";
const privateVapidKey = "P_sCBScXz-Vo4EumR-tdlBKxguE1sCZxk2bnQCCStjg";

webpush.setVapidDetails(
  'mailto:contact@adpro.com',
  publicVapidKey,
  privateVapidKey
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { machineName, reason } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('role', 'Mechanic')

    if (error) throw error

    const payload = JSON.stringify({
      title: 'Alerte Panne',
      body: `Machine: ${machineName}\nType: ${reason}`,
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: { url: '/mechanic' }
    })

    const sendPromises = (subscriptions || []).map((sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }
      return webpush.sendNotification(pushSubscription, payload)
        .catch((e: any) => {
          if (e.statusCode === 410 || e.statusCode === 404) {
            return supabaseClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
          console.error("Push error:", e)
        })
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
