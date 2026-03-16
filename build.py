#!/usr/bin/env python3
"""
L30NEYN Dashboard Strategy - Build Script

Bundles all modules into a single file with L30NEYN branding.
Renames all window.HaCustom* to window.L30NEYN* for consistency.
"""

import os
import re
from pathlib import Path

DIST_DIR = Path('dist')
OUTPUT_FILE = DIST_DIR / 'l30neyn-dashboard-strategy.js'
VERSION = '2.2.0'

# Module loading order
MODULES = [
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
    'strategy.js',
]

def read_module(module_path):
    """Read a module file and return its content."""
    file_path = DIST_DIR / module_path
    if not file_path.exists():
        print(f"Warning: {module_path} not found, skipping...")
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import/export statements
    content = re.sub(r'^import .*?;\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^export .*?;\s*$', '', content, flags=re.MULTILINE)
    
    return content

def rebrand_content(content):
    """Rename HaCustom to L30NEYN throughout the code."""
    if content is None:
        return None
    
    # Rename class names and window objects
    replacements = [
        (r'HaCustomDashboardStrategy', 'L30NEYNDashboardStrategy'),
        (r'window\.HaCustom', 'window.L30NEYN'),
        (r'HaCustom(\w+)', r'L30NEYN\1'),
        (r"'ha_custom_", "'l30neyn_"),
        (r'"ha_custom_', '"l30neyn_'),
        (r'ha_custom_dashboard_config', 'l30neyn_dashboard_config'),
        (r'\[Strategy\]', '[L30NEYN Strategy]'),
        (r'\[Config Manager\]', '[L30NEYN Config]'),
        (r'\[Theme Manager\]', '[L30NEYN Theme]'),
        (r'\[Statistics', '[L30NEYN Statistics'),
        (r'\[Settings View\]', '[L30NEYN Settings]'),
        (r'\[Overview View\]', '[L30NEYN Overview]'),
        (r'\[Room View\]', '[L30NEYN Room]'),
        (r"'ll-strategy-ha-custom-dashboard'", "'ll-strategy-l30neyn-dashboard'"),
        (r'HA Custom Dashboard Strategy', 'L30NEYN Dashboard Strategy'),
        (r'HA-CUSTOM-DASHBOARD-STRATEGY', 'L30NEYN-DASHBOARD-STRATEGY'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    return content

def build_bundle():
    """Build the complete bundle."""
    print(f"Building L30NEYN Dashboard Strategy v{VERSION}...")
    
    # Header
    bundle = f'''/**
 * L30NEYN Dashboard Strategy - Complete Bundle v{VERSION}
 * 
 * A modular, performant Home Assistant dashboard strategy by L30NEYN.
 * Includes: Strategy, Views, Utils, Theme, Config, Statistics
 * 
 * @author L30NEYN (Leon Heyn)
 * @version {VERSION}
 * @license MIT
 * @homepage https://github.com/L30NEYN/L30NEYN-dashboard-strategy
 */

(function() {{
  'use strict';

  console.info(
    '%c L30NEYN-DASHBOARD-STRATEGY %c v{VERSION} ',
    'background: #41BDF5; color: #fff; font-weight: bold; padding: 3px 5px;',
    'background: #4CAF50; color: #fff; font-weight: bold; padding: 3px 5px;'
  );

'''

    # Load and bundle all modules
    for module in MODULES:
        print(f"  - Loading {module}...")
        content = read_module(module)
        if content:
            content = rebrand_content(content)
            bundle += f"\n  // ========== {module} ==========\n"
            bundle += content + "\n"
    
    # Footer
    bundle += '''\n}})();
'''
    
    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(bundle)
    
    print(f"\n✅ Bundle created: {OUTPUT_FILE}")
    print(f"   Size: {len(bundle)} bytes ({len(bundle) / 1024:.1f} KB)")
    print(f"   Version: {VERSION}")
    
    # Also update input helpers to use l30neyn_ prefix
    update_input_helpers()

def update_input_helpers():
    """Update input helpers YAML with L30NEYN prefix."""
    input_helpers_path = Path('examples/input_helpers.yaml')
    if not input_helpers_path.exists():
        print("Warning: input_helpers.yaml not found")
        return
    
    print("\nUpdating input_helpers.yaml with L30NEYN prefix...")
    
    with open(input_helpers_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace ha_custom with l30neyn
    content = content.replace('ha_custom_', 'l30neyn_')
    content = content.replace('ha-custom-', 'l30neyn-')
    content = content.replace('# HA Custom Dashboard Strategy', '# L30NEYN Dashboard Strategy')
    
    with open(input_helpers_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Input helpers updated")

if __name__ == '__main__':
    build_bundle()
    print("\n🎉 Build complete!")
    print("\nNext steps:")
    print(f"  1. Test the bundle: dist/l30neyn-dashboard-strategy.js")
    print(f"  2. Create GitHub release v{VERSION}")
    print(f"  3. Update CHANGELOG.md")
    print(f"  4. Submit to HACS if applicable")
