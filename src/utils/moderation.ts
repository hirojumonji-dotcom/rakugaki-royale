const NG_WORDS = [
  '死ね', '殺す', '殺せ', 'ころす', 'しね',
  '障害者', 'ガイジ', 'きちがい',
  'レイプ', '強姦',
];

export function containsNGWord(text: string): boolean {
  const lower = text.toLowerCase();
  return NG_WORDS.some(word => lower.includes(word));
}

export function sanitizeCustomTopic(text: string): { valid: boolean; message?: string } {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'お題を入力してください' };
  }
  if (trimmed.length > 50) {
    return { valid: false, message: '50文字以内にしてください' };
  }
  if (containsNGWord(trimmed)) {
    return { valid: false, message: '不適切な表現が含まれています' };
  }

  return { valid: true };
}
