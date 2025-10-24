/**
 * Directus Visual Editor Integration
 *
 * Helper functions to enable in-place editing of website content
 * directly from Directus Visual Editor.
 */

import { setAttr as directusSetAttr, apply } from '@directus/visual-editing';

/**
 * Helper to set data-directus attribute for editable elements
 *
 * @param collection - Directus collection name
 * @param item - Item ID or object with id
 * @param fields - Field name or array of field names
 * @param mode - Edit mode: 'drawer', 'modal', or 'popover'
 */
export function setAttr({
  collection,
  item,
  fields,
  mode = 'popover'
}: {
  collection: string;
  item: number | string | { id: number };
  fields: string | string[];
  mode?: 'drawer' | 'modal' | 'popover';
}): string {
  // Normalize item to ID
  const itemId = typeof item === 'object' && 'id' in item ? item.id : item;

  return directusSetAttr({
    collection,
    item: itemId,
    fields,
    mode
  });
}

/**
 * Initialize Visual Editor
 * Must be called on page load to enable visual editing
 */
export function initVisualEditor() {
  if (typeof window !== 'undefined') {
    apply();
  }
}

/**
 * Check if running in Visual Editor mode
 */
export function isVisualEditorMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if page is loaded inside Directus Visual Editor iframe
  return window.self !== window.top ||
         window.location.search.includes('directus-editor=true');
}
