/* =========================================
 * JavaScript Code & Config
 * External Dependencies:
 *  - https://cdn.tailwindcss.com
 * ========================================= */
/* Inline Script [id='tailwind-config'] */
tailwind.config = { darkMode: "class", theme: { extend: { colors: { "on-primary-fixed-variant": "#384667", "secondary-container": "#ff752b", "surface-variant": "#dde3eb", "on-background": "#161c22", "tertiary-fixed-dim": "#e4c18b", "on-secondary-container": "#5f2200", "on-tertiary-fixed-variant": "#5a4318", "on-tertiary-container": "#ac8d5b", "primary": "#041533", "secondary": "#a23f00", "inverse-surface": "#2b3137", "surface-container-low": "#eef4fc", "tertiary": "#211400", "surface-dim": "#d4dbe2", "on-secondary-fixed": "#351000", "on-secondary-fixed-variant": "#7c2e00", "surface-tint": "#505e80", "error-container": "#ffdad6", "tertiary-container": "#3b2700", "on-surface-variant": "#45464e", "inverse-on-surface": "#ebf1f9", "surface": "#f6f9ff", "on-primary-container": "#8392b6", "error": "#ba1a1a", "on-error-container": "#93000a", "on-primary": "#ffffff", "primary-fixed": "#d9e2ff", "primary-container": "#1b2a49", "surface-container": "#e8eef6", "surface-container-high": "#e3e9f1", "on-primary-fixed": "#0a1b39", "secondary-fixed-dim": "#ffb595", "inverse-primary": "#b7c6ed", "on-surface": "#161c22", "surface-container-highest": "#dde3eb", "surface-container-lowest": "#ffffff", "outline": "#75777e", "background": "#f6f9ff", "outline-variant": "#c5c6cf", "secondary-fixed": "#ffdbcd", "on-secondary": "#ffffff", "surface-bright": "#f6f9ff", "primary-fixed-dim": "#b7c6ed", "on-error": "#ffffff", "on-tertiary-fixed": "#271900", "tertiary-fixed": "#ffdeab", "on-tertiary": "#ffffff" }, borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, spacing: { "margin": "2rem", "gutter": "1.5rem", "space-sm": "0.5rem", "space-xl": "2.5rem", "space-xs": "0.25rem", "margin-mobile": "1rem", "gutter-sm": "1rem", "space-lg": "1.5rem", "space-md": "1rem" }, fontFamily: { "label-md": ["Inter"], "headline-md": ["Inter"], "body-sm": ["Inter"], "numeric-currency-lg": ["Inter"], "headline-lg-mobile": ["Inter"], "body-lg": ["Inter"], "title-md": ["Inter"], "numeric-currency-md": ["Inter"], "headline-sm": ["Inter"], "body-md": ["Inter"], "label-sm": ["Inter"], "display-lg": ["Inter"], "headline-lg": ["Inter"] }, fontSize: { "label-md": ["13px", { lineHeight: "18px", letterSpacing: "0.01em", fontWeight: "500" }], "headline-md": ["22px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }], "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }], "numeric-currency-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }], "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }], "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }], "title-md": ["16px", { lineHeight: "22px", fontWeight: "600" }], "numeric-currency-md": ["16px", { lineHeight: "22px", fontWeight: "600" }], "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }], "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }], "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "600" }], "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }], "headline-lg": ["30px", { lineHeight: "38px", letterSpacing: "-0.015em", fontWeight: "600" }] } } } };

/* Inline Script */
function approveQuote(cardId, clientName, amount) {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Animación de VoBo completado con feedback sensorial
    card.classList.add('scale-95', 'opacity-90');
    
    setTimeout(() => {
      card.innerHTML = `
        <div class="p-space-md rounded-xl bg-surface-container shadow-neu-sunken flex items-center justify-between text-secondary">
          <div class="flex items-center gap-space-sm">
            <div class="w-10 h-10 rounded-xl bg-surface shadow-neu-extruded-sm flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px] text-secondary">check_circle</span>
            </div>
            <div class="flex flex-col">
              <span class="font-label-md text-label-md font-bold text-on-surface">${clientName}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant">VoBo emitido por ${amount}</span>
            </div>
          </div>
          <span class="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">Aprobado</span>
        </div>
      `;
      card.classList.remove('scale-95', 'opacity-90');
    }, 250);
  }

  // Interacción selector de periodo
  document.getElementById('periodSelectorBtn')?.addEventListener('click', function() {
    this.classList.toggle('shadow-neu-sunken');
  });