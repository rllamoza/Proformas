/* =========================================
 * JavaScript Code & Config
 * External Dependencies:
 *  - https://cdn.tailwindcss.com
 * ========================================= */
/* Inline Script [id='tailwind-config'] */
tailwind.config = { darkMode: "class", theme: { extend: { "colors": { "surface-variant": "#dde3eb", "secondary-fixed-dim": "#ffb595", "primary-fixed": "#d9e2ff", "on-primary": "#ffffff", "primary-fixed-dim": "#b7c6ed", "error-container": "#ffdad6", "inverse-primary": "#b7c6ed", "secondary-container": "#ff752b", "surface-dim": "#d4dbe2", "on-tertiary-fixed": "#271900", "on-error-container": "#93000a", "inverse-surface": "#2b3137", "on-secondary-fixed": "#351000", "on-primary-container": "#8392b6", "on-tertiary-fixed-variant": "#5a4318", "on-secondary-fixed-variant": "#7c2e00", "surface-container-low": "#eef4fc", "surface-tint": "#505e80", "primary-container": "#1b2a49", "on-surface-variant": "#45464e", "on-error": "#ffffff", "on-primary-fixed-variant": "#384667", "on-tertiary": "#ffffff", "surface-container-high": "#e3e9f1", "on-secondary-container": "#5f2200", "surface-container-lowest": "#ffffff", "primary": "#041533", "tertiary-container": "#3b2700", "on-primary-fixed": "#0a1b39", "error": "#ba1a1a", "tertiary-fixed": "#ffdeab", "on-secondary": "#ffffff", "on-surface": "#161c22", "on-background": "#161c22", "tertiary": "#211400", "surface-container-highest": "#dde3eb", "surface-bright": "#f6f9ff", "secondary": "#a23f00", "outline": "#75777e", "surface": "#f6f9ff", "inverse-on-surface": "#ebf1f9", "tertiary-fixed-dim": "#e4c18b", "on-tertiary-container": "#ac8d5b", "background": "#f6f9ff", "outline-variant": "#c5c6cf", "secondary-fixed": "#ffdbcd", "surface-container": "#e8eef6" }, "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, "spacing": { "space-xl": "2.5rem", "margin-mobile": "1rem", "space-lg": "1.5rem", "space-xs": "0.25rem", "space-sm": "0.5rem", "gutter": "1.5rem", "gutter-sm": "1rem", "margin": "2rem", "space-md": "1rem" }, "fontFamily": { "headline-lg-mobile": ["Inter"], "body-md": ["Inter"], "label-md": ["Inter"], "display-lg": ["Inter"], "headline-lg": ["Inter"], "body-lg": ["Inter"], "headline-sm": ["Inter"], "body-sm": ["Inter"], "numeric-currency-lg": ["Inter"], "title-md": ["Inter"], "headline-md": ["Inter"], "label-sm": ["Inter"], "numeric-currency-md": ["Inter"] }, "fontSize": { "headline-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }], "label-md": ["13px", { "lineHeight": "18px", "letterSpacing": "0.01em", "fontWeight": "500" }], "display-lg": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }], "headline-lg": ["30px", { "lineHeight": "38px", "letterSpacing": "-0.015em", "fontWeight": "600" }], "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }], "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }], "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }], "numeric-currency-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }], "title-md": ["16px", { "lineHeight": "22px", "fontWeight": "600" }], "headline-md": ["22px", { "lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "600" }], "label-sm": ["11px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "600" }], "numeric-currency-md": ["16px", { "lineHeight": "22px", "fontWeight": "600" }] } } } };

/* Inline Script */
function togglePassVisibility() {
    const passInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passInput.type === 'password') {
      passInput.type = 'text';
      eyeIcon.textContent = 'visibility_off';
    } else {
      passInput.type = 'password';
      eyeIcon.textContent = 'visibility';
    }
  }

  function setRole(email) {
    const emailField = document.getElementById('email');
    emailField.value = email;
    // Animate subtle focus
    emailField.focus();
  }

  function triggerAuthFeedback() {
    const alertBox = document.getElementById('alertBox');
    alertBox.classList.remove('hidden');
    // Subtle shake animation
    alertBox.animate([
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 250,
      iterations: 1
    });
  }