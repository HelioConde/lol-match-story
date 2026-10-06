(() => {
  const existing = window.LOL_MATCH_STORY_BACKEND || {};
  const functionsBase = typeof existing.functionsBase === 'string' && existing.functionsBase
    ? existing.functionsBase.replace(/\/$/, '')
    : 'https://bieihhaobdztjyoweewa.supabase.co/functions/v1';

  window.LOL_MATCH_STORY_BACKEND = Object.freeze({
    functionsBase,
    lolProfile: existing.lolProfile || functionsBase + '/public-lol-profile',
    lolMatchStory: existing.lolMatchStory || functionsBase + '/public-lol-match-story',
    lolStory: existing.lolStory || functionsBase + '/public-lol-story',
    lolStoryPage: existing.lolStoryPage || functionsBase + '/public-lol-story-page',
    lolFeedback: existing.lolFeedback || functionsBase + '/public-lol-feedback',
    source: 'zerotwo-gamer-supabase'
  });
})();