import React from 'react';
import { useEditor } from '@craftjs/core';

export const SettingsPanel: React.FC = () => {
  const { selected } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related?.toolbar,
      };
    }

    return {
      selected,
    };
  });

  return (
    <div
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: '#f9fafb',
        borderLeft: '1px solid #e5e7eb',
        overflowY: 'auto',
        padding: '20px',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          Settings
        </h3>
      </div>

      {selected ? (
        <div>
          <div
            style={{
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
              Selected Component
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>
              {selected.name}
            </div>
          </div>

          {selected.settings && React.createElement(selected.settings)}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#9ca3af',
          }}
        >
          <p>Select a component to edit its settings</p>
        </div>
      )}
    </div>
  );
};
'14px'
              }}>
                Nessuna impostazione disponibile per questo elemento
              </div>
            )}

            {/* Delete Button */}
            {selected.isDeletable && (
              <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', marginTop: '16px' }}>
                <button
                  onClick={() => actions.delete(selected.id)}
                  className="craft-btn craft-btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Trash2 size={16} />
                  Elimina Elemento
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="craft-settings-empty" style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            <p>Clicca su un elemento per modificarne le impostazioni</p>
          </div>
        )}
      </div>
    </div>
  );
};
