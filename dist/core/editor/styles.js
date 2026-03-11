/**
 * HA Custom Dashboard Strategy - Editor Styles
 * 
 * CSS styles for the configuration editor.
 * Provides a clean, hierarchical interface with visual feedback.
 * 
 * @version 1.0.0
 */

window.HaCustomEditorStyles = {
  /**
   * Get CSS styles
   * @returns {string} CSS
   */
  get() {
    return `
      .editor-container {
        padding: 16px;
        font-family: var(--primary-font-family, sans-serif);
      }

      .editor-header h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .editor-header p {
        margin: 0 0 24px 0;
        color: var(--secondary-text-color);
      }

      .editor-section {
        margin-bottom: 32px;
        padding: 16px;
        background: var(--card-background-color, #fff);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .editor-section h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .editor-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .editor-option {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .editor-option input[type="checkbox"] {
        cursor: pointer;
      }

      .editor-option select {
        margin-left: auto;
        padding: 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-areas {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .editor-area {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
        background: var(--card-background-color);
      }

      .editor-area-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--secondary-background-color, #f5f5f5);
        cursor: pointer;
        user-select: none;
      }

      .editor-area-header:hover {
        background: var(--divider-color);
      }

      .editor-drag-handle {
        cursor: move;
        color: var(--secondary-text-color);
        font-size: 18px;
      }

      .editor-checkbox {
        display: flex;
        align-items: center;
        cursor: pointer;
      }

      .editor-expand-button {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--primary-text-color);
        font-size: 14px;
        padding: 4px;
      }

      .editor-expand-button:hover {
        background: rgba(0,0,0,0.05);
        border-radius: 4px;
      }

      .editor-area-name {
        font-weight: 500;
        flex: 1;
      }

      .editor-entity-count {
        color: var(--secondary-text-color);
        font-size: 14px;
      }

      .editor-domain-groups {
        padding: 8px 12px 12px 40px;
      }

      .editor-domain-group {
        margin-bottom: 8px;
        border-left: 2px solid var(--divider-color);
        padding-left: 12px;
      }

      .editor-domain-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
      }

      .editor-domain-icon {
        flex: 1;
        font-size: 14px;
      }

      .editor-entity-list {
        padding: 8px 0 8px 24px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-entity-item {
        display: flex;
        align-items: center;
      }

      .editor-entity-name {
        font-size: 14px;
      }

      .editor-entity-id {
        color: var(--secondary-text-color);
        font-size: 12px;
        font-family: monospace;
        margin-left: 8px;
      }

      /* Indeterminate checkbox state */
      input[type="checkbox"][indeterminate] {
        opacity: 0.6;
      }

      /* Dragging styles */
      .editor-area.dragging {
        opacity: 0.5;
      }

      .editor-area.drag-over {
        border-top: 3px solid var(--primary-color);
      }
    `;
  },
};

console.info('[Editor] Styles module loaded');
