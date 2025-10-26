// @ts-nocheck
import React from 'react';

interface SelectionIndicatorProps {
  name: string;
  width: number;
  height: number;
  color?: string;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  name,
  width,
  height,
  color = '#3b82f6',
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-28px',
        left: '0',
        background: color,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'monospace',
        zIndex: 1000,
        pointerEvents: 'none',
        boxShadow: `0 2px 8px ${color}50`,
        whiteSpace: 'nowrap',
      }}
    >
      {name} • {width}px × {height}px
    </div>
  );
};

// Helper per gli stili di selezione
export const getSelectionStyles = (selected: boolean, baseBoxShadow?: string) => ({
  boxShadow: selected ? '0 0 0 3px #3b82f6' : baseBoxShadow || 'none',
  outline: selected ? '2px dashed #3b82f6' : 'none',
  outlineOffset: selected ? '4px' : '0',
  transition: 'all 0.2s ease',
});
