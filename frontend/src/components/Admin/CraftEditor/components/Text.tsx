import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import ContentEditable from 'react-contenteditable';

export interface TextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  margin?: number;
}

export const Text: React.FC<TextProps> = ({
  text = 'Clicca per modificare',
  fontSize = 16,
  fontWeight = 400,
  color = '#000000',
  textAlign = 'left',
  margin = 0
}) => {
  const {
    connectors: { connect, drag },
    actions: { setProp }
  } = useNode();

  const [editable, setEditable] = useState(false);

  return (
    <div
      ref={(ref) => connect(drag(ref as HTMLElement))}
      onClick={() => setEditable(true)}
      style={{
        margin: `${margin}px`,
      }}
    >
      <ContentEditable
        html={text}
        disabled={!editable}
        onChange={(e) => {
          setProp((props: TextProps) => {
            props.text = e.target.value;
          });
        }}
        tagName="p"
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color,
          textAlign,
          cursor: editable ? 'text' : 'pointer',
          outline: 'none',
        }}
      />
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Clicca per modificare',
    fontSize: 16,
    fontWeight: 400,
    color: '#000000',
    textAlign: 'left',
    margin: 0,
  },
  related: {
    toolbar: () => {
      return (
        <div>
          <h4>Text Settings</h4>
        </div>
      );
    }
  }
};
