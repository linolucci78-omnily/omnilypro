import React from 'react';
import { useEditor } from '@craftjs/core';

export const SettingsPanel: React.FC = () => {
  const { selected } = useEditor((state) => {
    const currentNodeId = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related?.toolbar,
        isDeletable: state.nodes[currentNodeId].data.name !== 'Website Root',
      };
    }

    return {
      selected,
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
                    const { actions } = (window as any).craftEditor;
                    if (actions) {
                      actions.delete(selected.id);
                    }
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
    </div>
  );
};
