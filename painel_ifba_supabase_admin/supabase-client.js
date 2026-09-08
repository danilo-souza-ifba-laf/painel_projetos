(function () {
  "use strict";

  const config = window.IFBA_SUPABASE_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "")
    && /^(sb_publishable_|eyJ)/.test(config.publishableKey || "")
    && !String(config.url).includes("SEU-PROJETO")
    && !String(config.publishableKey).includes("SUBSTITUA");

  window.IFBA_SUPABASE_CONFIGURED = configured;
  window.IFBA_SUPABASE = configured && window.supabase && window.supabase.createClient
    ? window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;
})();

