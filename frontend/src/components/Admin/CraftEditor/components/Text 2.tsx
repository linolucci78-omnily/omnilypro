// @ts-nocheck
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';

export interface TextProps {
  text?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export const Text: React.FC<TextProps> = ({
  text = 'Clicca per modificare',
  fontSize = 16,
  color = '#000000',
  fontWeight = 'normal',
  textAlign = 'left'
}) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        fontSize: `${fontSize}px`,
        color,
        fontWeight,
        textAlign,
        padding: '10px',
        cursor: 'move'
      }}
    >
      {text}
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Clicca per modificare',
    fontSize: 16,
    color: '#000000',
    fontWeight: 'normal',
    textAlign: 'left'
  },
  related: {
    toolbar: () => <div>Settings for Text</div>
  }
};
