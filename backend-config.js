(() => {
  const existing = window.LOL_MATCH_STORY_BACKEND || {};
  const functionsBase = typeof existing.functionsBase === 'string' && existing.functionsBase
    ? existing.functionsBase.replace(/\/$/, '')
    : 'https://bieihhaobdztjyoweewa.supabase.co/functions/v1';

  window.LOL_MATCH_STORY_BACKEND = Object.freeze({
    functionsBase,
    lolProfile: existing.lolProfile || functionsBase + '/public-lol-profile',
    source: 'zerotwo-gamer-supabase'
  });
})();