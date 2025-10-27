// @ts-nocheck
import React from 'react';
import { useEditor } from '@craftjs/core';
import { useConfirm } from '../../../../hooks/useConfirm';

export const SettingsPanel: React.FC = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  const { selected, isEnabled, actions } = useEditor((state, query) => {
    // state.events.selected is a Set, we need to get the first (and only) element
    const selectedSet = state.events.selected;
    const currentNodeId = selectedSet && selectedSet.size > 0 ? Array.from(selectedSet)[0] : null;

    console.log('🔍 SettingsPanel state:', {
      selectedSet,
      currentNodeId,
      hasNodes: Object.keys(state.nodes).length,
      isEnabled: query.getOptions().enabled
    });

    let selected;

    if (currentNodeId && state.nodes[currentNodeId]) {
      const currentNode = state.nodes[currentNodeId];

      console.log('📦 Current node details:', {
        id: currentNodeId,
        name: currentNode.data?.name,
        displayName: currentNode.data?.displayName,
        hasRelated: !!currentNode.related,
        relatedKeys: currentNode.related ? Object.keys(currentNode.related) : []
      });

      // Check if node exists and has data
      if (currentNode.data) {
        // Try both 'toolbar' and 'settings' for backwards compatibility
        const settingsComponent = currentNode.related?.toolbar || currentNode.related?.settings;

        selected = {
          id: currentNodeId,
          name: currentNode.data.displayName || currentNode.data.name,
          settings: settingsComponent,
          isDeletable: currentNodeId !== 'ROOT' &&
                      currentNode.data.name !== 'Website Root' &&
                      currentNode.data.name !== 'ROOT' &&
                      !currentNode.data.parent,
        };

        console.log('✅ Selected ready:', {
          name: selected.name,
          hasSettings: !!settingsComponent,
          isDeletable: selected.isDeletable
        });
      }
    }

    return {
      selected,
      isEnabled: query.getOptions().enabled
    };
  });

  return (
    <div className="craft-settings">
      <div className="craft-panel-header">
        <h3>⚙️ Impostazioni</h3>
      </div>

      <div className="craft-panel-content">
        {selected ? (
          <div className="craft-settings-content">
            <div className="craft-settings-item">
              <label className="craft-settings-label">Elemento selezionato:</label>
              <div className="craft-settings-value">{selected.name}</div>
            </div>

            {selected.settings && React.createElement(selected.settings)}

            {selected.isDeletable && (
              <div className="craft-settings-actions">
                <button
                  className="craft-btn craft-btn-danger craft-btn-sm"
                  onClick={() => {
                    confirm({
                      title: 'Elimina Elemento',
                      message: `Sei sicuro di voler eliminare "${selected.name}"? Questa azione non può essere annullata.`,
                      confirmText: 'Elimina',
                      cancelText: 'Annulla',
                      type: 'danger',
                      onConfirm: () => actions.delete(selected.id)
                    });
                  }}
                >
                  🗑️ Elimina Elemento
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="craft-settings-empty">
            <p>Seleziona un elemento per modificarne le impostazioni</p>
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
};
