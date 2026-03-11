/**
 * L30NEYN Dashboard Strategy - Main Loader
 * 
 * A modular, performant Home Assistant dashboard strategy by L30NEYN.
 * Features: Auto room detection, theme system, statistics, and settings panel.
 * 
 * @author L30NEYN
 * @version 1.1.0
 * @license MIT
 * @see https://github.com/L30NEYN/L30NEYN-dashboard-strategy
 */

(function() {
  'use strict';

  const VERSION = '1.1.0';
  
  // Auto-detect base path from current script location
  const currentScript = document.currentScript || 
    Array.from(document.querySelectorAll('script')).find(s => s.src.includes('l30neyn-dashboard-strategy'));
  
  let BASE_PATH;
  if (currentScript && currentScript.src) {
    // Extract base path from script src (remove filename)
    BASE_PATH = currentScript.src.substring(0, currentScript.src.lastIndexOf('/'));
    console.debug('[L30NEYN] Auto-detected BASE_PATH:', BASE_PATH);
  } else {
    // Fallback to HACS standard path
    BASE_PATH = '/hacsfiles/l30neyn-dashboard-strategy';
    console.warn('[L30NEYN] Using fallback BASE_PATH:', BASE_PATH);
  }

  console.info(
    '%c L30NEYN-DASHBOARD %c v' + VERSION + ' ',
    'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px;',
    'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;'
  );

  // Module loading order
  const modules = [
    'utils/entity-filter.js',
    'utils/card-builders.js',
    'utils/statistics-collectors.js',
    'utils/statistics-card-builders.js',
    'utils/theme-manager.js',
    'utils/config-manager.js',
    'views/overview-view.js',
    'views/room-view.js',
    'views/statistics-view.js',
    'views/settings-view.js',
    'strategy.js'
  ];

  let modulesLoaded = 0;
  const totalModules = modules.length;

  function loadModule(modulePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = `${BASE_PATH}/${modulePath}?v=${VERSION}`;
      
      script.onload = () => {
        modulesLoaded++;
        console.debug(`[L30NEYN] ✓ ${modulesLoaded}/${totalModules}: ${modulePath}`);
        resolve();
      };
      
      script.onerror = (error) => {
        console.error(`[L30NEYN] ✗ Failed: ${modulePath}`);
        console.error(`[L30NEYN] URL: ${script.src}`);
        reject(new Error(`Failed to load ${modulePath}`));
      };
      
      document.head.appendChild(script);
    });
  }

  async function loadAllModules() {
    console.debug(`[L30NEYN] Loading ${totalModules} modules from: ${BASE_PATH}`);
    
    try {
      for (const module of modules) {
        await loadModule(module);
      }
      
      console.info(
        '%c L30NEYN-DASHBOARD %c Ready! ',
        'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;',
        'background: #2196F3; color: #fff; font-weight: bold; padding: 3px 5px;'
      );
      
      window.dispatchEvent(new CustomEvent('l30neyn-dashboard-ready', {
        detail: { version: VERSION }
      }));
      
    } catch (error) {
      console.error('[L30NEYN] Failed to load strategy:', error);
      console.error('[L30NEYN] BASE_PATH was:', BASE_PATH);
      console.error('[L30NEYN] Check if files exist at this location');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllModules);
  } else {
    loadAllModules();
  }

})();
