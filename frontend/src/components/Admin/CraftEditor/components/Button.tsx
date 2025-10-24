import React from 'react';
import { useNode } from '@craftjs/core';

export interface ButtonProps {
  text?: string;
  backgroundColor?: string;
  color?: string;
  padding?: number;
  borderRadius?: number;
  fontSize?: number;
}

export const Button: React.FC<ButtonProps> = ({
  text = 'Click Me',
  backgroundColor = '#3b82f6',
  color = '#ffffff',
  padding = 12,
  borderRadius = 6,
  fontSize = 16
}) => {
  const {
    connectors: { connect, drag }
  } = useNode();

  return (
    <button
      ref={(ref) => connect(drag(ref as HTMLElement))}
      style={{
        backgroundColor,
        color,
        padding: `${padding}px ${padding * 2}px`,
        borderRadius: `${borderRadius}px`,
        fontSize: `${fontSize}px`,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
      }}
    >
      {text}
    </button>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text: 'Click Me',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  related: {
    toolbar: () => {
      return (
        <div>
          <h4>Button Settings</h4>
        </div>
      );
    }
  }
};
