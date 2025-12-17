// Content Script - Main orchestrator
// Initializes the extension and coordinates all components

(function () {
  'use strict';

  console.log('[KripTik AI] Extension loaded');

  // Initialize platform detector
  PlatformDetector.init();

  const platform = PlatformDetector.getPlatform();

  if (!platform) {
    console.log('[KripTik AI] No supported platform detected');
    return;
  }

  console.log(`[KripTik AI] Detected platform: ${platform.name}`);

  // Create import button
  createImportButton(platform);

  /**
   * Create and inject the import button
   * @param {Object} platform - Platform configuration
   */
  function createImportButton(platform) {
    // Check if button already exists
    if (document.getElementById('kriptik-import-btn')) {
      return;
    }

    // Create button element
    const button = document.createElement('button');
    button.id = 'kriptik-import-btn';
    button.className = 'kriptik-import-button';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Import to KripTik AI</span>
    `;

    // Add click handler
    button.addEventListener('click', () => {
      Overlay.show(platform);
    });

    // Inject button into page
    document.body.appendChild(button);

    // Add styles
    injectButtonStyles();
  }

  /**
 * Inject button styles
 */
  function injectButtonStyles() {
    const styleId = 'kriptik-import-button-styles';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .kriptik-import-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999998;

        display: flex;
        align-items: center;
        gap: 10px;

        padding: 14px 24px;

        /* 3D Glass Effect */
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.15) 0%,
          rgba(255, 255, 255, 0.08) 100%
        );

        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 14px;

        /* Multi-layer shadows for depth */
        box-shadow:
          0 4px 16px rgba(0, 0, 0, 0.4),
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 2px rgba(255, 255, 255, 0.2),
          inset 0 -1px 2px rgba(0, 0, 0, 0.2);

        backdrop-filter: blur(12px);

        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-size: 14px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.3px;

        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        position: relative;
        overflow: hidden;
      }

      /* Shine animation */
      .kriptik-import-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.25) 50%,
          transparent 100%
        );
        transition: left 0.6s ease;
      }

      .kriptik-import-button:hover::before {
        left: 100%;
      }

      .kriptik-import-button:hover {
        transform: translateY(-3px);

        box-shadow:
          0 6px 24px rgba(0, 0, 0, 0.5),
          0 12px 48px rgba(0, 0, 0, 0.3),
          0 0 32px rgba(255, 153, 102, 0.3),
          inset 0 1px 2px rgba(255, 255, 255, 0.25);

        border-color: rgba(255, 153, 102, 0.4);

        background: linear-gradient(
          135deg,
          rgba(255, 153, 102, 0.2) 0%,
          rgba(255, 153, 102, 0.12) 100%
        );
      }

      .kriptik-import-button:active {
        transform: translateY(-1px);
      }

      .kriptik-import-button svg {
        width: 20px;
        height: 20px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      @media (max-width: 640px) {
        .kriptik-import-button {
          bottom: 16px;
          right: 16px;
          padding: 12px 18px;
          font-size: 13px;
        }

        .kriptik-import-button svg {
          width: 18px;
          height: 18px;
        }

        .kriptik-import-button span {
          display: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Initialize error scraper (starts intercepting console immediately)
  // This is already initialized in error-scraper.js

  console.log('[KripTik AI] Import button injected');

})();
