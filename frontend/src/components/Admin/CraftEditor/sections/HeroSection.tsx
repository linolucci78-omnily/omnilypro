import React from 'react';
import { useNode, Element } from '@craftjs/core';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { Button } from '../components/Button';

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  minHeight?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Benvenuti',
  subtitle = 'Il tuo sottotitolo',
  backgroundColor = '#667eea',
  minHeight = 400
}) => {
  const {
    connectors: { connect, drag }
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref as HTMLElement))}
      style={{
        background: `linear-gradient(135deg, ${backgroundColor} 0%, #764ba2 100%)`,
        minHeight: `${minHeight}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        position: 'relative',
      }}
    >
      <Element
        is={Container}
        canvas
        background="transparent"
        padding={20}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={20}
        custom={{ displayName: 'Hero Content' }}
      >
        <Text
          text={title}
          fontSize={48}
          fontWeight={700}
          color="#ffffff"
          textAlign="center"
        />
        <Text
          text={subtitle}
          fontSize={20}
          fontWeight={400}
          color="#ffffff"
          textAlign="center"
        />
        <Button
          text="Scopri di più"
          backgroundColor="#ffffff"
          color="#667eea"
        />
      </Element>
    </div>
  );
};

HeroSection.craft = {
  displayName: 'Hero Section',
  props: {
    title: 'Benvenuti',
    subtitle: 'Il tuo sottotitolo',
    backgroundColor: '#667eea',
    minHeight: 400,
  },
  related: {
    toolbar: () => {
      return (
        <div>
          <h4>Hero Section Settings</h4>
          <p>Configura background, altezza, etc.</p>
        </div>
      );
    }
  }
};
