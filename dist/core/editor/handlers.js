/**
 * HA Custom Dashboard Strategy - Editor Event Handlers
 * 
 * Handles all user interactions in the editor:
 * - Checkboxes (area, domain, entity)
 * - Expand/collapse buttons
 * - Drag & drop for reordering
 * 
 * @version 1.0.0
 */

window.HaCustomEditorHandlers = {
  /**
   * Attach event handlers to the editor
   * @param {HTMLElement} editor - Editor element
   * @param {Object} config - Configuration object (mutable)
   * @param {Function} onChange - Callback when config changes
   */
  attach(editor, config, onChange) {
    // Global options
    this.attachGlobalOptions(editor, config, onChange);

    // Area checkboxes
    this.attachAreaCheckboxes(editor, config, onChange);

    // Domain checkboxes
    this.attachDomainCheckboxes(editor, config, onChange);

    // Entity checkboxes
    this.attachEntityCheckboxes(editor, config, onChange);

    // Expand buttons
    this.attachExpandButtons(editor);

    // Drag & drop
    this.attachDragAndDrop(editor, config, onChange);
  },

  /**
   * Attach global option handlers
   */
  attachGlobalOptions(editor, config, onChange) {
    editor.querySelectorAll('[data-option]').forEach(input => {
      const option = input.getAttribute('data-option');

      input.addEventListener('change', () => {
        if (input.type === 'checkbox') {
          config[option] = input.checked;
        } else if (input.type === 'select-one') {
          config[option] = parseInt(input.value);
        }
        onChange();
      });
    });
  },

  /**
   * Attach area checkbox handlers
   */
  attachAreaCheckboxes(editor, config, onChange) {
    editor.querySelectorAll('[data-area-checkbox]').forEach(checkbox => {
      const areaId = checkbox.getAttribute('data-area-checkbox');

      checkbox.addEventListener('change', () => {
        if (!config.areas_display) {
          config.areas_display = { hidden: [], order: [] };
        }

        const hidden = config.areas_display.hidden || [];

        if (checkbox.checked) {
          // Remove from hidden
          const index = hidden.indexOf(areaId);
          if (index > -1) {
            hidden.splice(index, 1);
          }
        } else {
          // Add to hidden
          if (!hidden.includes(areaId)) {
            hidden.push(areaId);
          }
        }

        config.areas_display.hidden = hidden;
        onChange();
      });
    });
  },

  /**
   * Attach domain checkbox handlers
   */
  attachDomainCheckboxes(editor, config, onChange) {
    editor.querySelectorAll('[data-domain-checkbox]').forEach(checkbox => {
      const [areaId, domain] = checkbox
        .getAttribute('data-domain-checkbox')
        .split(':');

      checkbox.addEventListener('change', () => {
        if (!config.areas_options) {
          config.areas_options = {};
        }
        if (!config.areas_options[areaId]) {
          config.areas_options[areaId] = { groups_options: {} };
        }
        if (!config.areas_options[areaId].groups_options[domain]) {
          config.areas_options[areaId].groups_options[domain] = { hidden: [] };
        }

        const groupOptions = config.areas_options[areaId].groups_options[domain];

        if (checkbox.checked) {
          // Show all entities in this domain
          groupOptions.hidden = [];
        } else {
          // Hide all entities in this domain
          // Find all entities in this domain
          const entityCheckboxes = editor.querySelectorAll(
            `[data-entity-checkbox^="${areaId}:${domain}:"]`
          );
          const entityIds = Array.from(entityCheckboxes).map(cb =>
            cb.getAttribute('data-entity-checkbox').split(':')[2]
          );
          groupOptions.hidden = entityIds;
        }

        onChange();
      });
    });
  },

  /**
   * Attach entity checkbox handlers
   */
  attachEntityCheckboxes(editor, config, onChange) {
    editor.querySelectorAll('[data-entity-checkbox]').forEach(checkbox => {
      const [areaId, domain, entityId] = checkbox
        .getAttribute('data-entity-checkbox')
        .split(':');

      checkbox.addEventListener('change', () => {
        if (!config.areas_options) {
          config.areas_options = {};
        }
        if (!config.areas_options[areaId]) {
          config.areas_options[areaId] = { groups_options: {} };
        }
        if (!config.areas_options[areaId].groups_options[domain]) {
          config.areas_options[areaId].groups_options[domain] = { hidden: [] };
        }

        const hidden = config.areas_options[areaId].groups_options[domain].hidden;

        if (checkbox.checked) {
          // Remove from hidden
          const index = hidden.indexOf(entityId);
          if (index > -1) {
            hidden.splice(index, 1);
          }
        } else {
          // Add to hidden
          if (!hidden.includes(entityId)) {
            hidden.push(entityId);
          }
        }

        onChange();
      });
    });
  },

  /**
   * Attach expand button handlers
   */
  attachExpandButtons(editor) {
    // Area expand buttons
    editor.querySelectorAll('[data-expand-area]').forEach(button => {
      const areaId = button.getAttribute('data-expand-area');
      button.addEventListener('click', e => {
        e.stopPropagation();
        editor.toggleArea(areaId);
      });
    });

    // Domain expand buttons
    editor.querySelectorAll('[data-expand-domain]').forEach(button => {
      const [areaId, domain] = button.getAttribute('data-expand-domain').split(':');
      button.addEventListener('click', e => {
        e.stopPropagation();
        editor.toggleDomain(areaId, domain);
      });
    });
  },

  /**
   * Attach drag and drop handlers
   */
  attachDragAndDrop(editor, config, onChange) {
    const areaElements = editor.querySelectorAll('.editor-area');
    let draggedElement = null;

    areaElements.forEach(area => {
      const handle = area.querySelector('.editor-drag-handle');

      handle.addEventListener('dragstart', e => {
        draggedElement = area;
        area.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      handle.addEventListener('dragend', () => {
        draggedElement = null;
        area.classList.remove('dragging');
      });

      area.addEventListener('dragover', e => {
        e.preventDefault();
        if (draggedElement && draggedElement !== area) {
          area.classList.add('drag-over');
        }
      });

      area.addEventListener('dragleave', () => {
        area.classList.remove('drag-over');
      });

      area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('drag-over');

        if (draggedElement && draggedElement !== area) {
          // Get area IDs
          const draggedId = draggedElement.getAttribute('data-area-id');
          const targetId = area.getAttribute('data-area-id');

          // Update order in config
          if (!config.areas_display) {
            config.areas_display = { hidden: [], order: [] };
          }

          let order = config.areas_display.order || [];

          // Remove dragged from order
          order = order.filter(id => id !== draggedId);

          // Find target index
          let targetIndex = order.indexOf(targetId);
          if (targetIndex === -1) {
            // Target not in order yet, add it
            order.push(targetId);
            targetIndex = order.length - 1;
          }

          // Insert dragged before target
          order.splice(targetIndex, 0, draggedId);

          config.areas_display.order = order;
          onChange();
        }
      });
    });
  },
};

console.info('[Editor] Handlers module loaded');
