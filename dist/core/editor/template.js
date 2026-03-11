/**
 * HA Custom Dashboard Strategy - Editor Template Builder
 * 
 * Builds the HTML template for the configuration editor.
 * Implements a three-level hierarchy: Area → Domain → Entity
 * 
 * @version 1.0.0
 */

window.HaCustomEditorTemplate = {
  /**
   * Build the editor template
   * @param {Object} config - Current configuration
   * @param {Array} areas - Available areas
   * @param {Array} devices - Available devices
   * @param {Array} entities - Available entities
   * @param {Set} expandedAreas - Set of expanded area IDs
   * @param {Map} expandedDomains - Map of expanded domains per area
   * @returns {string} HTML template
   */
  build(config, areas, devices, entities, expandedAreas, expandedDomains) {
    const hiddenAreas = config.areas_display?.hidden || [];
    const areaOrder = config.areas_display?.order || [];
    const areasOptions = config.areas_options || {};

    // Sort areas
    let sortedAreas = [...areas];
    if (areaOrder.length > 0) {
      const orderMap = new Map(areaOrder.map((id, i) => [id, i]));
      sortedAreas.sort((a, b) => {
        const orderA = orderMap.get(a.area_id) ?? 999;
        const orderB = orderMap.get(b.area_id) ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    } else {
      sortedAreas.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Build area-entity map
    const areaEntityMap = this.buildAreaEntityMap(areas, devices, entities);

    return `
      <div class="editor-container">
        <div class="editor-header">
          <h2>Dashboard Konfiguration</h2>
          <p>Verwalte Räume, Geräte und Sensoren für dein Dashboard</p>
        </div>

        <div class="editor-section">
          <h3>Globale Einstellungen</h3>
          <div class="editor-options">
            ${this.buildGlobalOptions(config)}
          </div>
        </div>

        <div class="editor-section">
          <h3>Räume & Bereiche</h3>
          <div class="editor-areas">
            ${sortedAreas
              .map(area =>
                this.buildAreaItem(
                  area,
                  hiddenAreas,
                  areasOptions,
                  areaEntityMap,
                  expandedAreas,
                  expandedDomains
                )
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Build global options section
   * @param {Object} config - Current configuration
   * @returns {string} HTML
   */
  buildGlobalOptions(config) {
    return `
      <label class="editor-option">
        <input
          type="checkbox"
          data-option="show_weather"
          ${config.show_weather !== false ? 'checked' : ''}
        />
        <span>Wetter-Karte anzeigen</span>
      </label>

      <label class="editor-option">
        <input
          type="checkbox"
          data-option="show_energy"
          ${config.show_energy !== false ? 'checked' : ''}
        />
        <span>Energie-Dashboard anzeigen</span>
      </label>

      <label class="editor-option">
        <input
          type="checkbox"
          data-option="show_subviews"
          ${config.show_subviews ? 'checked' : ''}
        />
        <span>Utility-Views anzeigen (Lichter, Rollos, etc.)</span>
      </label>

      <label class="editor-option">
        <input
          type="checkbox"
          data-option="show_covers_summary"
          ${config.show_covers_summary !== false ? 'checked' : ''}
        />
        <span>Rollo-Zusammenfassung anzeigen</span>
      </label>

      <label class="editor-option">
        <input
          type="checkbox"
          data-option="group_by_floors"
          ${config.group_by_floors ? 'checked' : ''}
        />
        <span>Räume nach Etagen gruppieren</span>
      </label>

      <label class="editor-option">
        <span>Zusammenfassungs-Layout:</span>
        <select data-option="summaries_columns">
          <option value="2" ${config.summaries_columns === 2 || !config.summaries_columns ? 'selected' : ''}>
            2x2 Grid
          </option>
          <option value="4" ${config.summaries_columns === 4 ? 'selected' : ''}>
            1x4 Reihe
          </option>
        </select>
      </label>
    `;
  },

  /**
   * Build area item
   * @param {Object} area - Area object
   * @param {Array} hiddenAreas - List of hidden area IDs
   * @param {Object} areasOptions - Areas options from config
   * @param {Map} areaEntityMap - Map of entities per area
   * @param {Set} expandedAreas - Set of expanded area IDs
   * @param {Map} expandedDomains - Map of expanded domains
   * @returns {string} HTML
   */
  buildAreaItem(
    area,
    hiddenAreas,
    areasOptions,
    areaEntityMap,
    expandedAreas,
    expandedDomains
  ) {
    const isHidden = hiddenAreas.includes(area.area_id);
    const isExpanded = expandedAreas.has(area.area_id);
    const entities = areaEntityMap.get(area.area_id) || [];
    const entityCount = entities.length;

    // Group entities by domain
    const domainGroups = this.groupEntitiesByDomain(entities);

    return `
      <div class="editor-area" data-area-id="${area.area_id}">
        <div class="editor-area-header">
          <span class="editor-drag-handle" draggable="true">☰</span>
          <label class="editor-checkbox">
            <input
              type="checkbox"
              data-area-checkbox="${area.area_id}"
              ${!isHidden ? 'checked' : ''}
            />
          </label>
          <button
            class="editor-expand-button"
            data-expand-area="${area.area_id}"
          >
            ${isExpanded ? '▼' : '▶'}
          </button>
          <span class="editor-area-name">${area.name}</span>
          <span class="editor-entity-count">(${entityCount})</span>
        </div>

        ${isExpanded ? this.buildDomainGroups(area, domainGroups, areasOptions, expandedDomains) : ''}
      </div>
    `;
  },

  /**
   * Build domain groups for an area
   * @param {Object} area - Area object
   * @param {Map} domainGroups - Map of entities grouped by domain
   * @param {Object} areasOptions - Areas options from config
   * @param {Map} expandedDomains - Map of expanded domains
   * @returns {string} HTML
   */
  buildDomainGroups(area, domainGroups, areasOptions, expandedDomains) {
    const areaOptions = areasOptions[area.area_id] || {};
    const groupsOptions = areaOptions.groups_options || {};
    const expandedSet = expandedDomains.get(area.area_id) || new Set();

    const domainLabels = {
      light: '💡 Beleuchtung',
      climate: '🌡️ Klima',
      cover: '🚪 Rollos & Vorhänge',
      switch: '🔌 Schalter',
      sensor: '🌡️ Sensoren',
      binary_sensor: '🚨 Binäre Sensoren',
      camera: '📹 Kameras',
      media_player: '📺 Media Player',
      lock: '🔒 Schlösser',
      vacuum: '🧹 Saugroboter',
      fan: '🌬️ Ventilatoren',
    };

    let html = '<div class="editor-domain-groups">';

    for (const [domain, entities] of domainGroups) {
      const domainOption = groupsOptions[domain] || {};
      const hiddenEntities = domainOption.hidden || [];
      const isExpanded = expandedSet.has(domain);

      const visibleCount = entities.filter(
        e => !hiddenEntities.includes(e.entity_id)
      ).length;
      const allHidden = visibleCount === 0;
      const someHidden = visibleCount > 0 && visibleCount < entities.length;

      html += `
        <div class="editor-domain-group" data-domain="${domain}">
          <div class="editor-domain-header">
            <label class="editor-checkbox">
              <input
                type="checkbox"
                data-domain-checkbox="${area.area_id}:${domain}"
                ${!allHidden ? 'checked' : ''}
                ${someHidden ? 'indeterminate' : ''}
              />
            </label>
            <span class="editor-domain-icon">${domainLabels[domain] || domain}</span>
            <span class="editor-entity-count">(${entities.length})</span>
            <button
              class="editor-expand-button"
              data-expand-domain="${area.area_id}:${domain}"
            >
              ${isExpanded ? '▼' : '▶'}
            </button>
          </div>

          ${isExpanded ? this.buildEntityList(area, domain, entities, hiddenEntities) : ''}
        </div>
      `;
    }

    html += '</div>';
    return html;
  },

  /**
   * Build entity list for a domain
   * @param {Object} area - Area object
   * @param {string} domain - Domain name
   * @param {Array} entities - List of entities
   * @param {Array} hiddenEntities - List of hidden entity IDs
   * @returns {string} HTML
   */
  buildEntityList(area, domain, entities, hiddenEntities) {
    let html = '<div class="editor-entity-list">';

    entities.forEach(entity => {
      const isHidden = hiddenEntities.includes(entity.entity_id);
      const friendlyName =
        entity.original_name || entity.entity_id.split('.')[1];

      html += `
        <div class="editor-entity-item">
          <label class="editor-checkbox">
            <input
              type="checkbox"
              data-entity-checkbox="${area.area_id}:${domain}:${entity.entity_id}"
              ${!isHidden ? 'checked' : ''}
            />
            <span class="editor-entity-name">${friendlyName}</span>
            <span class="editor-entity-id">(${entity.entity_id})</span>
          </label>
        </div>
      `;
    });

    html += '</div>';
    return html;
  },

  /**
   * Build area-entity map
   * @param {Array} areas - Available areas
   * @param {Array} devices - Available devices
   * @param {Array} entities - Available entities
   * @returns {Map} Map of area ID to entities
   */
  buildAreaEntityMap(areas, devices, entities) {
    const map = new Map();

    // Initialize map
    areas.forEach(area => map.set(area.area_id, []));

    // Build device-area map
    const deviceAreaMap = new Map();
    devices.forEach(device => {
      if (device.area_id) {
        deviceAreaMap.set(device.id, device.area_id);
      }
    });

    // Map entities to areas
    entities.forEach(entity => {
      // Direct area assignment
      if (entity.area_id && map.has(entity.area_id)) {
        map.get(entity.area_id).push(entity);
      }
      // Via device
      else if (entity.device_id) {
        const areaId = deviceAreaMap.get(entity.device_id);
        if (areaId && map.has(areaId)) {
          map.get(areaId).push(entity);
        }
      }
    });

    return map;
  },

  /**
   * Group entities by domain
   * @param {Array} entities - List of entities
   * @returns {Map} Map of domain to entities
   */
  groupEntitiesByDomain(entities) {
    const groups = new Map();

    entities.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      if (!groups.has(domain)) {
        groups.set(domain, []);
      }
      groups.get(domain).push(entity);
    });

    // Sort domains
    return new Map(
      [...groups.entries()].sort((a, b) => {
        const order = [
          'light',
          'climate',
          'cover',
          'switch',
          'sensor',
          'binary_sensor',
        ];
        const indexA = order.indexOf(a[0]);
        const indexB = order.indexOf(b[0]);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a[0].localeCompare(b[0]);
      })
    );
  },
};

console.info('[Editor] Template module loaded');
