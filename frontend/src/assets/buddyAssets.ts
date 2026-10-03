// Direct typed imports of Buddy character PNG states for Vite asset bundling
import buddyWavingHappy from './images/buddy_waving_happy.png';
import buddyListeningSleepy from './images/buddy_listening_sleepy.png';
import buddyTalkingExcited from './images/buddy_talking_excited.png';
import buddyHeroCardBanner from './images/buddy_hero_card_banner.png';

export const BUDDY_ASSETS = {
  wavingHappy: buddyWavingHappy,
  listeningSleepy: buddyListeningSleepy,
  talkingExcited: buddyTalkingExcited,
  heroBanner: buddyHeroCardBanner,
} as const;

export type BuddyState = 'waving' | 'listening' | 'talking' | 'hero';
