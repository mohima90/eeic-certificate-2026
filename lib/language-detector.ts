// Mirrors: landrok/language-detector in Laravel
// Detects Arabic by checking Unicode range U+0600–U+06FF
export function isArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text)
}
