import React from 'react';
import { useNode } from '@craftjs/core';

export interface ContainerProps {
  background?: string;
  padding?: number;
  margin?: number;
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: number;
  children?: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  background = '#ffffff',
  padding = 20,
  margin = 0,
  flexDirection = 'column',
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  gap = 10,
  children
}) => {
  const {
    connectors: { connect, drag }
  } = useNode();

  return (
    <div
      ref={(ref) => connect(drag(ref as HTMLElement))}
      style={{
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        display: 'flex',
        flexDirection,
        alignItems,
        justifyContent,
        gap: `${gap}px`,
        minHeight: '50px',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    background: '#ffffff',
    padding: 20,
    margin: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 10,
  },
  related: {
    toolbar: () => {
      return (
        <div>
          <h4>Container Settings</h4>
        </div>
      );
    }
  }
};
