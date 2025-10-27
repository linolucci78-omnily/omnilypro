import React from 'react';
import { Element, useEditor } from '@craftjs/core';
import {
  Sparkles,
  UtensilsCrossed,
  Box,
  Type,
  ImageIcon,
  MousePointerClick,
  LayoutGrid,
  FileText,
  Zap,
  Columns,
  Rows,
  Square,
  Mail,
  Images,
  Menu as MenuIcon
} from 'lucide-react';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Image } from '../components/Image';
import { Row } from '../components/Row';
import { Column } from '../components/Column';
import { Section } from '../components/Section';
import { ContactForm } from '../components/ContactForm';
import { Navigation } from '../components/Navigation';
import { HeroSection } from '../sections/HeroSection';
import { MenuSection } from '../sections/MenuSection';
import { FeaturesSection } from '../sections/FeaturesSection';
import { ContactSection } from '../sections/ContactSection';
import { GallerySection } from '../sections/GallerySection';
import { FooterSection } from '../sections/FooterSection';
import { LoyaltySection } from '../sections/LoyaltySection';

export const Toolbox: React.FC = () => {
  const { connectors } = useEditor();

  return (
    <div className="craft-toolbox">
      <div className="craft-panel-header">
        <h3>Componenti</h3>
      </div>

      <div className="craft-toolbox-content">
        {/* Sezioni Pre-fatte */}
        <div className="craft-toolbox-category">
          <h4>Sezioni</h4>
          <div className="craft-toolbox-items">
            {/* Hero Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={HeroSection}
                      title="Benvenuti nel Tuo Sito"
                      subtitle="Crea qualcosa di straordinario"
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Sparkles size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Hero</span>
            </div>

            {/* Menu Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={MenuSection}
                      title="Il Nostro Menu"
                      subtitle="Scopri le nostre specialità"
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <UtensilsCrossed size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Menu</span>
            </div>

            {/* Features Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={FeaturesSection}
                      title="Perché Sceglierci"
                      subtitle="Scopri cosa ci rende unici"
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Zap size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Features</span>
            </div>

            {/* Gallery Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={GallerySection}
                      title="Galleria"
                      subtitle="I nostri migliori momenti"
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Images size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Galleria</span>
            </div>

            {/* Contact Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={ContactSection}
                      title="Contattaci"
                      subtitle="Siamo qui per te"
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Mail size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Contatti</span>
            </div>

            {/* Footer Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={FooterSection}
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <FileText size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Footer</span>
            </div>

            {/* Loyalty Section */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element
                      is={LoyaltySection}
                      canvas
                    />
                  );
                }
              }}
              className="craft-toolbox-item"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                border: '2px solid #f59e0b',
                animation: 'glow 2s ease-in-out infinite'
              }}
            >
              <Sparkles size={20} className="craft-toolbox-icon" style={{ color: '#fff' }} />
              <span className="craft-toolbox-label" style={{ color: '#fff', fontWeight: '700' }}>Fidelity</span>
            </div>

            {/* Navigation Menu */}
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Navigation />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <MenuIcon size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Menu Nav</span>
            </div>

          </div>
        </div>

        {/* Componenti Base */}
        <div className="craft-toolbox-category">
          <h4>Layout</h4>
          <div className="craft-toolbox-items">
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element is={Section} canvas padding={40} />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Square size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Section</span>
            </div>

            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element is={Container} canvas padding={20} />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Box size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Container</span>
            </div>

            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element is={Row} canvas gap={20} />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Rows size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Row</span>
            </div>

            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Element is={Column} canvas gap={20} />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Columns size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Column</span>
            </div>
          </div>
        </div>

        <div className="craft-toolbox-category">
          <h4>Contenuto</h4>
          <div className="craft-toolbox-items">
            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Text text="Nuovo testo" fontSize={16} />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Type size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Testo</span>
            </div>

            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Image />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <ImageIcon size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Immagine</span>
            </div>

            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <Button text="Clicca qui" />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <MousePointerClick size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Bottone</span>
            </div>

            <div
              ref={(ref) => {
                if (ref) {
                  connectors.create(
                    ref,
                    <ContactForm />
                  );
                }
              }}
              className="craft-toolbox-item"
            >
              <Mail size={20} className="craft-toolbox-icon" />
              <span className="craft-toolbox-label">Form Contatto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
