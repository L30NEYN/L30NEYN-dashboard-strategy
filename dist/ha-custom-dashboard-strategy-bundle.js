/**
 * HA Custom Dashboard Strategy - Complete Bundle
 * 
 * Includes all modules: Strategy, Views, Utils, Theme, Config, Statistics
 * Version 1.1.0 - With Settings Panel, Theme Support, and Statistics
 * 
 * @author Leon Heyn
 * @license MIT
 */

// This would be the complete bundled version
// For now, we use dynamic script loading

(function() {
  'use strict';

  const BASE_PATH = '/local/ha-custom-dashboard-strategy/';
  const VERSION = '1.1.0';

  console.info(`%c HA-CUSTOM-DASHBOARD-STRATEGY %c v${VERSION} `, 
    'background: #41BDF5; color: #fff; font-weight: bold;',
    'background: #4CAF50; color: #fff; font-weight: bold;'
  );

  // Module loading order is critical
  const modules = [
    // Utilities first
    'utils/entity-filter.js',
    'utils/card-builders.js',
    'utils/statistics-collectors.js',
    'utils/statistics-card-builders.js',
    'utils/theme-manager.js',
    'utils/config-manager.js',
    
    // Views
    'views/overview-view.js',
    'views/room-view.js',
    'views/statistics-view.js',
    'views/settings-view.js',
    
    // Strategy last
    'strategy.js',
  ];

  // Load modules sequentially
  function loadModule(index) {
    if (index >= modules.length) {
      console.info('[Strategy] All modules loaded successfully');
      return;
    }

    const modulePath = BASE_PATH + modules[index];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = modulePath;
    
    script.onload = () => {
      console.debug(`[Strategy] Loaded: ${modules[index]}`);
      loadModule(index + 1);
    };
    
    script.onerror = () => {
      console.error(`[Strategy] Failed to load: ${modules[index]}`);
      // Continue loading other modules
      loadModule(index + 1);
    };
    
    document.head.appendChild(script);
  }

  // Start loading
  loadModule(0);

})();
