/**
 * HA Custom Dashboard Strategy - Editor
 * 
 * Provides a graphical configuration interface for the dashboard strategy.
 * Supports drag & drop, hierarchical entity management, and real-time updates.
 * 
 * @version 1.0.0
 */

import './editor/template.js';
import './editor/styles.js';
import './editor/handlers.js';

class HaCustomDashboardStrategyEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._expandedAreas = new Set();
    this._expandedDomains = new Map();
  }

  /**
   * Set the Home Assistant object
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  /**
   * Set the configuration
   * @param {Object} config - Strategy configuration
   */
  setConfig(config) {
    this._config = config || {};
    this.requestUpdate();
  }

  /**
   * Request a re-render
   */
  requestUpdate() {
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      requestAnimationFrame(() => {
        this._updateScheduled = false;
        this.render();
      });
    }
  }

  /**
   * Render the editor
   */
  render() {
    if (!this._hass) {
      this.innerHTML = '<div style="padding: 16px;">Loading...</div>';
      return;
    }

    try {
      // Get registries
      const areas = Object.values(this._hass.areas || {});
      const devices = Object.values(this._hass.devices || {});
      const entities = Object.values(this._hass.entities || {});

      // Build template
      const template = window.HaCustomEditorTemplate.build(
        this._config,
        areas,
        devices,
        entities,
        this._expandedAreas,
        this._expandedDomains
      );

      // Apply styles
      const styles = window.HaCustomEditorStyles.get();

      this.innerHTML = `
        <style>${styles}</style>
        ${template}
      `;

      // Attach event handlers
      window.HaCustomEditorHandlers.attach(this, this._config, () => {
        this.fireConfigChanged();
      });
    } catch (error) {
      console.error('[Editor] Render error:', error);
      this.innerHTML = `
        <div style="padding: 16px; color: red;">
          <strong>Editor Error:</strong> ${error.message}
        </div>
      `;
    }
  }

  /**
   * Fire config-changed event
   */
  fireConfigChanged() {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Toggle area expansion
   * @param {string} areaId - Area ID
   */
  toggleArea(areaId) {
    if (this._expandedAreas.has(areaId)) {
      this._expandedAreas.delete(areaId);
    } else {
      this._expandedAreas.add(areaId);
    }
    this.requestUpdate();
  }

  /**
   * Toggle domain expansion
   * @param {string} areaId - Area ID
   * @param {string} domain - Domain name
   */
  toggleDomain(areaId, domain) {
    const key = `${areaId}:${domain}`;
    if (!this._expandedDomains.has(areaId)) {
      this._expandedDomains.set(areaId, new Set());
    }
    const domains = this._expandedDomains.get(areaId);
    if (domains.has(domain)) {
      domains.delete(domain);
    } else {
      domains.add(domain);
    }
    this.requestUpdate();
  }
}

// Register the editor
customElements.define(
  'ha-custom-dashboard-strategy-editor',
  HaCustomDashboardStrategyEditor
);

console.info('[Editor] Custom element registered: ha-custom-dashboard-strategy-editor');
