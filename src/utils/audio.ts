export async function playLanguageAudio(
  text: string,
  languageCode: string,
  voiceName = 'Kore',
  rate = 1.0
): Promise<{ usedFallback: boolean }> {
  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text, languageCode, voiceName }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.playbackRate = rate;
        await audio.play();
        return { usedFallback: false };
      }
    }
  } catch {
    // Fall back to browser speech synthesis if available
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const bcpMap: Record<string, string> = {
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
      fr: 'fr-FR',
      de: 'de-DE',
      es: 'es-ES',
      nl: 'nl-NL',
      it: 'it-IT',
      pt: 'pt-BR',
      nb: 'nb-NO',
      sv: 'sv-SE',
      el: 'el-GR',
      tr: 'tr-TR',
      uz: 'uz-UZ',
      hi: 'hi-IN',
      ru: 'ru-RU',
      arz: 'ar-EG',
      sw: 'sw-KE',
      id: 'id-ID',
      pl: 'pl-PL',
      fi: 'fi-FI',
    };
    utter.lang = bcpMap[languageCode] || 'en-US';
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
  }
  return { usedFallback: true };
}
