/** Atelier fiscal moderne — visuels SVG intégrés au bundle, sans téléchargement ni ressource distante. */

export function BrandSymbol({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={className}><rect x="12" y="8" width="40" height="48" rx="10" fill="#FDFCF7" stroke="#CAD8D3" strokeWidth="2" /><path d="M28 18h8v22h-8z" fill="#0F766E" /><path d="M38 33h7v7h-7z" fill="#C99A3E" /><path d="M22 46h20" stroke="#102A43" strokeWidth="3" strokeLinecap="round" /></svg>;
}

export function PrivacyShieldArt() {
  return <svg viewBox="0 0 640 520" role="img" aria-label="Dossier anonyme protégé" className="absolute inset-0 h-full w-full"><rect width="640" height="520" fill="#EAF0EC" /><path d="M0 410C160 350 290 500 640 380V520H0Z" fill="#D8E7E0" /><g transform="translate(235 86)"><path d="M84 0 192 42v95c0 91-60 151-108 170C36 288-24 228-24 137V42Z" fill="#0F766E" opacity=".16" /><path d="M84 18 172 52v80c0 73-46 123-88 142-42-19-88-69-88-142V52Z" fill="#FDFCF7" stroke="#0F766E" strokeWidth="4" /><rect x="21" y="79" width="126" height="143" rx="8" fill="#F8F3E6" stroke="#C99A3E" strokeWidth="3" /><path d="M42 113h84M42 142h63M42 171h76" stroke="#102A43" strokeWidth="5" strokeLinecap="round" opacity=".75" /><circle cx="126" cy="190" r="12" fill="#0F766E" /></g><circle cx="120" cy="104" r="16" fill="#C99A3E" opacity=".75" /><circle cx="522" cy="126" r="9" fill="#0F766E" opacity=".5" /></svg>;
}
