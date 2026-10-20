/* =========================================
 * JavaScript Code & Config
 * External Dependencies:
 *  - https://cdn.tailwindcss.com
 * ========================================= */
/* Inline Script [id='tailwind-config'] */
tailwind.config={darkMode:"class",theme:{extend:{"colors":{"on-primary":"#ffffff","on-secondary-fixed-variant":"#7c2e00","tertiary-container":"#3b2700","inverse-primary":"#b7c6ed","surface-variant":"#dde3eb","on-tertiary":"#ffffff","surface-container-lowest":"#ffffff","error":"#ba1a1a","background":"#f6f9ff","error-container":"#ffdad6","on-secondary":"#ffffff","tertiary-fixed":"#ffdeab","on-error":"#ffffff","primary-fixed-dim":"#b7c6ed","on-tertiary-container":"#ac8d5b","surface-tint":"#505e80","surface-bright":"#f6f9ff","surface-container-low":"#eef4fc","outline":"#75777e","on-background":"#161c22","on-error-container":"#93000a","on-primary-container":"#8392b6","on-surface-variant":"#45464e","on-tertiary-fixed-variant":"#5a4318","secondary-fixed-dim":"#ffb595","primary-fixed":"#d9e2ff","primary-container":"#1b2a49","surface":"#f6f9ff","primary":"#041533","surface-container-highest":"#dde3eb","tertiary-fixed-dim":"#e4c18b","on-secondary-fixed":"#351000","on-tertiary-fixed":"#271900","outline-variant":"#c5c6cf","secondary-container":"#ff752b","inverse-on-surface":"#ebf1f9","on-surface":"#161c22","on-primary-fixed":"#0a1b39","secondary-fixed":"#ffdbcd","inverse-surface":"#2b3137","surface-container-high":"#e3e9f1","on-secondary-container":"#5f2200","tertiary":"#211400","surface-dim":"#d4dbe2","on-primary-fixed-variant":"#384667","secondary":"#a23f00","surface-container":"#e8eef6"},"borderRadius":{"DEFAULT":"0.25rem","lg":"0.5rem","xl":"0.75rem","full":"9999px"},"spacing":{"space-xs":"0.25rem","space-md":"1rem","gutter":"1.5rem","margin":"2rem","space-xl":"2.5rem","space-sm":"0.5rem","gutter-sm":"1rem","space-lg":"1.5rem","margin-mobile":"1rem"},"fontFamily":{"headline-sm":["Inter"],"body-lg":["Inter"],"numeric-currency-md":["Inter"],"display-lg":["Inter"],"headline-md":["Inter"],"body-md":["Inter"],"headline-lg":["Inter"],"label-md":["Inter"],"title-md":["Inter"],"headline-lg-mobile":["Inter"],"body-sm":["Inter"],"label-sm":["Inter"],"numeric-currency-lg":["Inter"]},"fontSize":{"headline-sm":["18px",{"lineHeight":"24px","fontWeight":"600"}],"body-lg":["16px",{"lineHeight":"24px","fontWeight":"400"}],"numeric-currency-md":["16px",{"lineHeight":"22px","fontWeight":"600"}],"display-lg":["36px",{"lineHeight":"44px","letterSpacing":"-0.02em","fontWeight":"700"}],"headline-md":["22px",{"lineHeight":"28px","letterSpacing":"-0.01em","fontWeight":"600"}],"body-md":["14px",{"lineHeight":"20px","fontWeight":"400"}],"headline-lg":["30px",{"lineHeight":"38px","letterSpacing":"-0.015em","fontWeight":"600"}],"label-md":["13px",{"lineHeight":"18px","letterSpacing":"0.01em","fontWeight":"500"}],"title-md":["16px",{"lineHeight":"22px","fontWeight":"600"}],"headline-lg-mobile":["24px",{"lineHeight":"32px","letterSpacing":"-0.01em","fontWeight":"600"}],"body-sm":["12px",{"lineHeight":"16px","fontWeight":"400"}],"label-sm":["11px",{"lineHeight":"14px","letterSpacing":"0.04em","fontWeight":"600"}],"numeric-currency-lg":["24px",{"lineHeight":"32px","letterSpacing":"-0.01em","fontWeight":"700"}]}}}}

/* Inline Script */
// Dynamic UI micro-interactions
  document.addEventListener('DOMContentLoaded', () => {
    // Neumorphic button press simulation feedback
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('mousedown', () => {
        btn.classList.add('scale-[0.98]');
      });
      btn.addEventListener('mouseup', () => {
        btn.classList.remove('scale-[0.98]');
      });
      btn.addEventListener('mouseleave', () => {
        btn.classList.remove('scale-[0.98]');
      });
    });
  });