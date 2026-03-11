const DICTIONARY = {
  en: {
    'common.on': 'On',
    'common.off': 'Off',
    'common.free': 'Free',
    'app.title': 'Stress Bubble',
    'app.subtitle': 'New tab calm, one pop at a time',
    'mode.classic': 'Classic',
    'mode.rage': 'Rage',
    'mode.zen': 'Zen',
    'action.play': 'Play',
    'action.shop': 'Shop',
    'action.settings': 'Settings',
    'action.back': 'Back',
    'action.buy': 'Buy',
    'action.equip': 'Equip',
    'action.equipped': 'Equipped',
    'action.replay': 'Replay',
    'action.copy': 'Copy',
    'action.share': 'Share',
    'action.home': 'Home',
    'action.open_fullscreen': 'Open Full Screen',
    'action.minimize': 'Extension View',
    'action.claim_plus': 'Claim +{value}',
    'stats.best_mode': 'Best ({mode})',
    'stats.coins': 'Coins',
    'stats.streak': 'Streak',
    'stats.total_pops': 'Total Pops',
    'stats.best_combo': 'Best Combo',
    'stats.golden_hits': 'Golden Hits',
    'stats.bomb_hits': 'Bomb Hits',
    'daily.none': 'Daily: -',
    'daily.pop_count': 'Daily: POP {target}',
    'daily.max_combo': 'Daily: COMBO x{target}',
    'daily.no_bomb': 'Daily: NO BOMB',
    'daily.score': 'Daily: SCORE {target}',
    'daily.miss_max': 'Daily: MISS <= {target}',
    'daily.golden_count': 'Daily: GOLDEN {target}',
    'settings.sfx': 'SFX',
    'settings.music': 'Music',
    'settings.vibe': 'Vibe',
    'settings.mute': 'Mute',
    'settings.reduced_motion': 'Reduced Motion',
    'settings.high_contrast': 'High Contrast',
    'settings.difficulty': 'Difficulty',
    'settings.music_style': 'Music Style',
    'settings.reset_data': 'Reset Data',
    'settings.sfx_volume': 'SFX Vol',
    'settings.music_volume': 'Music Vol',
    'difficulty.easy': 'Easy',
    'difficulty.normal': 'Normal',
    'difficulty.hard': 'Hard',
    'music_style.chill': 'Chill',
    'music_style.hiphop': 'HipHop',
    'music_style.minimal': 'Minimal',
    'tutorial.quick_tips': 'Quick Tips',
    'tutorial.tip_1': 'Pop bubbles fast to keep the timer calm.',
    'tutorial.tip_2': 'Combos boost your score rapidly.',
    'tutorial.tip_3': 'Special bubbles (fast, golden, bomb) have unique effects.',
    'tutorial.tap_anywhere': 'Tap anywhere to start',
    'shop.title': 'Shop',
    'shop.gameplay_preview': 'Gameplay Preview',
    'launcher.title': 'Stress Bubble',
    'launcher.subtitle': 'Open game only when you want to focus',
    'result.run_complete': 'Run Complete',
    'result.score': 'Score: {value}',
    'result.rank': 'Rank: {value}',
    'result.personal_best': 'Personal Best!',
    'result.coins_plus': 'Coins: +{value}',
    'result.next_rank': 'Next: {rank} ({score} pts)',
    'result.new_achievements': 'New Achievements',
    'result.next_goal_title': 'Next Goals',
    'result.goal_rank': '{value} pts to {rank}',
    'result.goal_daily': 'Daily: {value}',
    'result.goal_skin': '{value} coins to {skin}',
    'result.goal_daily_done': 'Daily complete',
    'result.goal_all_clear': 'All near-term goals cleared',
    'result.copy_success': 'Result copied',
    'result.copy_manual': 'Manual copy opened',
    'result.copy_error': 'Copy failed',
    'result.share_success': 'Share sent',
    'result.share_fallback_copy': 'Share unavailable, result copied',
    'result.share_manual': 'Share unavailable, manual copy opened',
  },
};

let currentLocale = 'en';

export function setLocale(locale) {
  currentLocale = DICTIONARY[locale] ? locale : 'en';
}

export function getLocale() {
  return currentLocale;
}

export function t(key, vars = null) {
  const table = DICTIONARY[currentLocale] || DICTIONARY.en;
  let text = table[key] || DICTIONARY.en[key] || key;
  if (!vars || typeof vars !== 'object') return text;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}
