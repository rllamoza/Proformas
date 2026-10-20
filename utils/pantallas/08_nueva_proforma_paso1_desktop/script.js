/* =========================================
 * JavaScript Code & Config
 * External Dependencies:
 *  - https://cdn.tailwindcss.com
 * ========================================= */
/* Inline Script [id='tailwind-config'] */
tailwind.config = { darkMode: "class", theme: { extend: { "colors": { "on-primary-container": "#8392b6", "outline-variant": "#c5c6cf", "on-tertiary-fixed-variant": "#5a4318", "surface-dim": "#d4dbe2", "on-primary-fixed-variant": "#384667", "on-error-container": "#93000a", "on-surface-variant": "#45464e", "on-tertiary-container": "#ac8d5b", "surface-container-highest": "#dde3eb", "on-primary-fixed": "#0a1b39", "on-secondary-container": "#5f2200", "primary": "#041533", "primary-fixed-dim": "#b7c6ed", "on-secondary-fixed-variant": "#7c2e00", "secondary": "#a23f00", "surface-container-low": "#eef4fc", "secondary-fixed-dim": "#ffb595", "primary-container": "#1b2a49", "tertiary-container": "#3b2700", "on-tertiary": "#ffffff", "surface-container": "#e8eef6", "inverse-primary": "#b7c6ed", "inverse-on-surface": "#ebf1f9", "tertiary-fixed-dim": "#e4c18b", "error": "#ba1a1a", "surface-container-lowest": "#ffffff", "on-primary": "#ffffff", "tertiary": "#211400", "inverse-surface": "#2b3137", "surface": "#f6f9ff", "outline": "#75777e", "primary-fixed": "#d9e2ff", "on-surface": "#161c22", "secondary-container": "#ff752b", "surface-tint": "#505e80", "background": "#f6f9ff", "on-secondary": "#ffffff", "error-container": "#ffdad6", "on-tertiary-fixed": "#271900", "tertiary-fixed": "#ffdeab", "on-background": "#161c22", "on-secondary-fixed": "#351000", "surface-bright": "#f6f9ff", "surface-container-high": "#e3e9f1", "surface-variant": "#dde3eb", "secondary-fixed": "#ffdbcd", "on-error": "#ffffff" }, "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, "spacing": { "space-xl": "2.5rem", "gutter": "1.5rem", "space-xs": "0.25rem", "space-lg": "1.5rem", "space-md": "1rem", "gutter-sm": "1rem", "margin": "2rem", "margin-mobile": "1rem", "space-sm": "0.5rem" }, "fontFamily": { "label-sm": ["Inter"], "body-lg": ["Inter"], "display-lg": ["Inter"], "body-sm": ["Inter"], "numeric-currency-md": ["Inter"], "body-md": ["Inter"], "headline-lg": ["Inter"], "headline-md": ["Inter"], "headline-lg-mobile": ["Inter"], "headline-sm": ["Inter"], "label-md": ["Inter"], "title-md": ["Inter"], "numeric-currency-lg": ["Inter"] }, "fontSize": { "label-sm": ["11px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "600" }], "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }], "display-lg": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }], "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }], "numeric-currency-md": ["16px", { "lineHeight": "22px", "fontWeight": "600" }], "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }], "headline-lg": ["30px", { "lineHeight": "38px", "letterSpacing": "-0.015em", "fontWeight": "600" }], "headline-md": ["22px", { "lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "headline-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }], "label-md": ["13px", { "lineHeight": "18px", "letterSpacing": "0.01em", "fontWeight": "500" }], "title-md": ["16px", { "lineHeight": "22px", "fontWeight": "600" }], "numeric-currency-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }] } } } };

/* Inline Script */
function selectClientType(type) {
    const btnRuc = document.getElementById('btnRuc');
    const btnDni = document.getElementById('btnDni');
    const docLabel = document.getElementById('docLabel');
    const docInput = document.getElementById('docNumber');

    if (type === 'ruc') {
      btnRuc.className = 'py-2 px-3 rounded-lg bg-primary-container text-on-primary font-title-md text-title-md font-semibold flex items-center justify-center gap-2 shadow-[-3px_-3px_7px_rgba(255,255,255,0.7),3px_3px_8px_rgba(27,42,73,0.4)] transition-all';
      btnDni.className = 'py-2 px-3 rounded-lg text-on-surface-variant font-title-md text-title-md font-medium flex items-center justify-center gap-2 hover:text-on-surface transition-all';
      docLabel.innerText = 'Número de RUC (11 dígitos)';
      docInput.value = '20601458921';
      docInput.placeholder = 'Ej. 20601458921';
    } else {
      btnDni.className = 'py-2 px-3 rounded-lg bg-primary-container text-on-primary font-title-md text-title-md font-semibold flex items-center justify-center gap-2 shadow-[-3px_-3px_7px_rgba(255,255,255,0.7),3px_3px_8px_rgba(27,42,73,0.4)] transition-all';
      btnRuc.className = 'py-2 px-3 rounded-lg text-on-surface-variant font-title-md text-title-md font-medium flex items-center justify-center gap-2 hover:text-on-surface transition-all';
      docLabel.innerText = 'Número de DNI (8 dígitos)';
      docInput.value = '45892134';
      docInput.placeholder = 'Ej. 45892134';
    }
  }

  function setCurrency(currency) {
    const btnPen = document.getElementById('btnPen');
    const btnUsd = document.getElementById('btnUsd');

    if (currency === 'PEN') {
      btnPen.className = 'px-4 py-1.5 rounded-lg bg-surface text-secondary font-title-md text-title-md font-bold shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_6px_rgba(255,117,43,0.35)] transition-all';
      btnUsd.className = 'px-4 py-1.5 rounded-lg text-on-surface-variant font-title-md text-title-md font-medium hover:text-on-surface transition-all';
    } else {
      btnUsd.className = 'px-4 py-1.5 rounded-lg bg-surface text-secondary font-title-md text-title-md font-bold shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_6px_rgba(255,117,43,0.35)] transition-all';
      btnPen.className = 'px-4 py-1.5 rounded-lg text-on-surface-variant font-title-md text-title-md font-medium hover:text-on-surface transition-all';
    }
  }

  function triggerSunatLookup() {
    const btn = document.getElementById('sunatBtn');
    const companyInput = document.getElementById('companyName');
    const originalContent = btn.innerHTML;
    
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Verificando...</span>';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] text-secondary">check_circle</span><span>Conectado</span>';
      companyInput.value = "INVERSIONES TECNOLÓGICAS DEL PACÍFICO S.A.C.";
      setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }, 1500);
    }, 800);
  }