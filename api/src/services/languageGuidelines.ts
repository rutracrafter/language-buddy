// Linguistic guidelines for cross-language speech rate, mora/syllable timing, and adaptive scaffolding

export function getLanguagePacingGuidelines(
  nativeLanguage: string,
  targetLanguage: string,
  speechRate: number = 1.0
): string {
  const lang = targetLanguage.toLowerCase();

  let languageSpecificPacing = '';

  if (lang.includes('japan') || lang.includes('nihon') || lang.includes('日本語')) {
    languageSpecificPacing = `
JAPANESE PHONETIC & TEMPO RULES (CRITICAL):
- Japanese is a mora-timed language with an exceptionally high native syllable rate (~7.84 syllables/second, the fastest in the world according to linguistic research).
- To non-native and beginner/intermediate learners, unadjusted native Japanese sounds like an incomprehensible blur!
- YOU MUST DELIBERATELY CALIBRATE YOUR PACE:
  * Slow down significantly below native speed. Speak in a calm, clear, relaxed cadence.
  * Insert distinct, breathable pauses (0.5 to 1 second) between bunsetsu (grammatical phrase chunks) and after particles (は, が, を, に, で, と, も, へ, から, まで).
  * For learners at A1-B1, stick to clear polite form (です / ます). Avoid fast colloquial slang, long multi-clause sentences, or rapid contractions.
  * Speak at most 1 short sentence or question per turn. Give the learner ample time to parse what you said.`;
  } else if (lang.includes('spanish') || lang.includes('español')) {
    languageSpecificPacing = `
SPANISH PHONETIC & TEMPO RULES (CRITICAL):
- Native Spanish has one of the highest syllable velocities in the world (~7.82 syllables/second) with rapid vowel blending across words (sinalefa).
- YOU MUST DELIBERATELY CALIBRATE YOUR PACE:
  * Articulate distinct word boundaries rather than blending words into one continuous stream.
  * Pause slightly between clauses so the learner can distinguish verb endings and pronouns.
  * Enunciate clearly and avoid rapid colloquial elisions.`;
  } else if (lang.includes('french') || lang.includes('français')) {
    languageSpecificPacing = `
FRENCH PHONETIC & TEMPO RULES:
- Clearly enunciate liaisons and avoid dropping key grammatical words.
- Keep rhythm groups distinctly separated with clear pauses between thoughts.`;
  } else if (lang.includes('chinese') || lang.includes('mandarin') || lang.includes('中文')) {
    languageSpecificPacing = `
MANDARIN CHINESE PHONETIC & TEMPO RULES:
- Mandarin is syllable-dense with essential tonal contours (~5.18 syllables/second).
- Pronounce tones (1st, 2nd, 3rd, 4th, neutral) with exaggerated clarity and steady tempo.
- Leave clear pauses between topic and comment.`;
  } else {
    languageSpecificPacing = `
PACING & ENUNCIATION RULES:
- Speak clearly and distinctly, with noticeable pauses between phrases to allow auditory processing.`;
  }

  return `
SPEECH RATE & DYNAMIC ADAPTATION:
- Target baseline speech rate: ${speechRate}x speed.
${languageSpecificPacing}

DYNAMIC TEMPO & STRUGGLE DETECTION (THE GOLDEN RULE):
- If the learner is struggling, hesitating, pausing, using broken words, or asks what something means:
  -> IMMEDIATELY SLOW DOWN YOUR SPEECH RATE.
  -> Speak at a noticeably gentle, patient, and deliberate tempo.
  -> Add generous pauses between words and particles.
  -> Shorten your response to a single, simple sentence.
- If the learner is speaking fluently, comfortably, and accurately:
  -> You may gradually speed up toward normal everyday conversational tempo.
  -> HARD CAP: Never exceed normal everyday conversational tempo (1.0x). Never speak at rapid native blur.

SCAFFOLDING WITHOUT POLARIZATION (THE MIDDLE GROUND):
- DO NOT polarize between speaking rapid, complex ${targetLanguage} OR switching entirely to English lectures!
- When the learner struggles, use this 5-step scaffolding middle ground:
  1. Stay in ${targetLanguage}, but drastically simplify grammar and vocabulary to their floor level.
  2. Use shorter sentences with high-frequency core words.
  3. Offer binary choices or sentence frames (e.g. in Japanese: "A ですか？それとも B ですか？", in Spanish: "¿Prefieres A o B?").
  4. If ${nativeLanguage} support is needed, provide only a brief 1-to-2 word bridge or translation in parentheses (e.g. "どこ (where) に行きたい？"), rather than switching into an English monologue.
  5. Celebrate any partial attempt and warmly invite them to complete the thought.`;
}
