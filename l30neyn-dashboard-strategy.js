/**
 * L30NEYN Dashboard Strategy
 * 
 * A modular, performant Home Assistant dashboard strategy by L30NEYN.
 * Features: Auto room detection, theme system, statistics, and settings panel.
 * 
 * @author L30NEYN (Leon Heyn)
 * @version 1.1.0
 * @license MIT
 * @see https://github.com/L30NEYN/ha-custom-dashboard-strategy
 */

(function() {
  'use strict';

  // Version and configuration
  const VERSION = '1.1.0';
  const STRATEGY_NAME = 'll-strategy-l30neyn-dashboard';
  const BASE_PATH = '/hacsfiles/l30neyn-dashboard-strategy';
  
  // Display load banner
  console.info(
    '%c L30NEYN-DASHBOARD %c v' + VERSION + ' ',
    'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px;',
    'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;'
  );

  // Module loading order (critical for dependencies)
  const modules = [
    // Core utilities first
    'dist/utils/entity-filter.js',
    'dist/utils/card-builders.js',
    'dist/utils/statistics-collectors.js',
    'dist/utils/statistics-card-builders.js',
    'dist/utils/theme-manager.js',
    'dist/utils/config-manager.js',
    
    // Views next
    'dist/views/overview-view.js',
    'dist/views/room-view.js',
    'dist/views/statistics-view.js',
    'dist/views/settings-view.js',
    
    // Main strategy last
    'dist/strategy.js'
  ];

  let modulesLoaded = 0;
  const totalModules = modules.length;

  /**
   * Load a single module script
   */
  function loadModule(modulePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = `${BASE_PATH}/${modulePath}?v=${VERSION}`;
      
      script.onload = () => {
        modulesLoaded++;
        console.debug(`[L30NEYN] Loaded ${modulesLoaded}/${totalModules}: ${modulePath}`);
        resolve();
      };
      
      script.onerror = (error) => {
        console.error(`[L30NEYN] Failed to load: ${modulePath}`, error);
        reject(new Error(`Failed to load ${modulePath}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Load all modules sequentially
   */
  async function loadAllModules() {
    console.debug(`[L30NEYN] Starting to load ${totalModules} modules...`);
    
    try {
      for (const module of modules) {
        await loadModule(module);
      }
      
      console.info(
        '%c L30NEYN-DASHBOARD %c Ready! ',
        'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;',
        'background: #2196F3; color: #fff; font-weight: bold; padding: 3px 5px;'
      );
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('l30neyn-dashboard-ready', {
        detail: { version: VERSION }
      }));
      
    } catch (error) {
      console.error('[L30NEYN] Failed to load strategy:', error);
      
      // Show user-friendly error
      const errorMsg = `L30NEYN Dashboard Strategy failed to load. Check browser console for details.`;
      if (window.customElements && customElements.get('hui-error-card')) {
        // Try to show error in dashboard
        console.error(errorMsg);
      }
    }
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllModules);
  } else {
    loadAllModules();
  }

})();
