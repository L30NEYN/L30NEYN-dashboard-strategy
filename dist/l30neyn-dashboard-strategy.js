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

// Display load banner
console.info(
  '%c L30NEYN-DASHBOARD %c v1.1.0 ',
  'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px;',
  'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;'
);

// Load utilities first (dependencies)
import './utils/entity-filter.js';
import './utils/card-builders.js';
import './utils/statistics-collectors.js';
import './utils/statistics-card-builders.js';
import './utils/theme-manager.js';
import './utils/config-manager.js';

// Load views
import './views/overview-view.js';
import './views/room-view.js';
import './views/statistics-view.js';
import './views/settings-view.js';

// Load main strategy (must be last)
import './strategy.js';

console.info(
  '%c L30NEYN-DASHBOARD %c Loaded! ',
  'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;',
  'background: #2196F3; color: #fff; font-weight: bold; padding: 3px 5px;'
);
