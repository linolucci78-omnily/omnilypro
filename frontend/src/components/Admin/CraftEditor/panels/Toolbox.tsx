import React from 'react';
import { Element, useEditor } from '@craftjs/core';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { HeroSection } from '../sections/HeroSection';

export const Toolbox: React.FC = () => {
  const { connectors } = useEditor();

  return (
    <div className="craft-toolbox">
      <div className="craft-panel-header">
        <h3>🧰 Componenti</h3>
      </div>

      <div className="craft-toolbox-content">
        {/* Sezioni Pre-fatte */}
        <div className="craft-toolbox-category">
          <h4>Sezioni</h4>
          <div className="craft-toolbox-items">
            <div
              ref={(ref) =>
                connectors.create(
                  ref as HTMLElement,
                  <Element
                    is={HeroSection}
                    title="Benvenuti"
                    subtitle="Il tuo sottotitolo"
                    canvas
                  />
                )
              }
              className="craft-toolbox-item"
            >
              <span className="craft-toolbox-icon">🏠</span>
              <span className="craft-toolbox-label">Hero</span>
            </div>
          </div>
        </div>

        {/* Componenti Base */}
        <div className="craft-toolbox-category">
          <h4>Layout</h4>
          <div className="craft-toolbox-items">
            <div
              ref={(ref) =>
                connectors.create(
                  ref as HTMLElement,
                  <Element is={Container} canvas padding={20} />
                )
              }
              className="craft-toolbox-item"
            >
              <span className="craft-toolbox-icon">📦</span>
              <span className="craft-toolbox-label">Container</span>
            </div>
          </div>
        </div>

        <div className="craft-toolbox-category">
          <h4>Contenuto</h4>
          <div className="craft-toolbox-items">
            <div
              ref={(ref) =>
                connectors.create(
                  ref as HTMLElement,
                  <Text text="Nuovo testo" fontSize={16} />
                )
              }
              className="craft-toolbox-item"
            >
              <span className="craft-toolbox-icon">🔤</span>
              <span className="craft-toolbox-label">Testo</span>
            </div>

            <div
              ref={(ref) =>
                connectors.create(
                  ref as HTMLElement,
                  <Button text="Clicca qui" />
                )
              }
              className="craft-toolbox-item"
            >
              <span className="craft-toolbox-icon">🔘</span>
              <span className="craft-toolbox-label">Bottone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
