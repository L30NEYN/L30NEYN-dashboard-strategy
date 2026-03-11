/**
 * HA Custom Dashboard Strategy - Module Loader
 * 
 * Loads all strategy modules in the correct order.
 * Uses ES6 module imports for clean dependency management.
 * 
 * @version 1.0.0
 */

// Core modules
import './core/strategy.js';
import './core/editor.js';

// Utility modules
import './utils/helpers.js';
import './utils/data-collectors.js';
import './utils/badge-builder.js';
import './utils/section-builder.js';
import './utils/view-builder.js';

// View strategies
import './views/room.js';
import './views/lights.js';
import './views/covers.js';
import './views/security.js';
import './views/batteries.js';

// Custom cards
import './cards/summary-card.js';

console.info(
  '%c HA-CUSTOM-DASHBOARD-STRATEGY %c Loaded ',
  'background: #41BDF5; color: #fff; font-weight: bold;',
  'background: #4CAF50; color: #fff; font-weight: bold;'
);
