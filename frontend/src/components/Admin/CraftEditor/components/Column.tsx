// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';

export interface ColumnProps {
  flex?: number;
  gap?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  background?: string;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  margin?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  minHeight?: number;
  children?: React.ReactNode;
}

export const Column: React.FC<ColumnProps> = ({
  flex = 1,
  gap = 20,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  background = 'transparent',
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  minHeight,
  children,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: flex,
        gap: `${gap}px`,
        alignItems,
        justifyContent,
        background,
        padding: padding !== undefined ? `${padding}px` : undefined,
        paddingTop: paddingTop !== undefined ? `${paddingTop}px` : undefined,
        paddingRight: paddingRight !== undefined ? `${paddingRight}px` : undefined,
        paddingBottom: paddingBottom !== undefined ? `${paddingBottom}px` : undefined,
        paddingLeft: paddingLeft !== undefined ? `${paddingLeft}px` : undefined,
        margin: margin !== undefined ? `${margin}px` : undefined,
        marginTop: marginTop !== undefined ? `${marginTop}px` : undefined,
        marginRight: marginRight !== undefined ? `${marginRight}px` : undefined,
        marginBottom: marginBottom !== undefined ? `${marginBottom}px` : undefined,
        marginLeft: marginLeft !== undefined ? `${marginLeft}px` : undefined,
        minHeight: minHeight !== undefined ? `${minHeight}px` : '100px',
        outline: selected ? '2px dashed #10b981' : 'none',
        outlineOffset: '2px',
        position: 'relative',
      }}
    >
      {!children && (
        <div
          style={{
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          ↓ Trascina qui
        </div>
      )}
      {children}
    </div>
  );
};

// Settings Panel
const ColumnSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ColumnProps,
  }));

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}>Column Settings</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Flex */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Flex: {props.flex}
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={props.flex}
            onChange={(e) => setProp((props: ColumnProps) => (props.flex = parseFloat(e.target.value)))}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Flex: 1 = equal width, 2 = double width, etc.
          </p>
        </div>

        {/* Gap */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Gap: {props.gap}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={props.gap}
            onChange={(e) => setProp((props: ColumnProps) => (props.gap = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Align Items */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Align Items
          </label>
          <select
            value={props.alignItems}
            onChange={(e) => setProp((props: ColumnProps) => (props.alignItems = e.target.value as any))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>

        {/* Justify Content */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Justify Content
          </label>
          <select
            value={props.justifyContent}
            onChange={(e) => setProp((props: ColumnProps) => (props.justifyContent = e.target.value as any))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <option value="flex-start">Start</option>
            <option value="center">Center</option>
            <option value="flex-end">End</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
            <option value="space-evenly">Space Evenly</option>
          </select>
        </div>

        {/* Background */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Background
          </label>
          <input
            type="color"
            value={props.background === 'transparent' ? '#ffffff' : props.background}
            onChange={(e) => setProp((props: ColumnProps) => (props.background = e.target.value))}
            style={{ width: '100%', height: '40px', borderRadius: '6px', border: 'none' }}
          />
        </div>

        {/* Padding */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Padding: {props.padding || 0}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={props.padding || 0}
            onChange={(e) => setProp((props: ColumnProps) => (props.padding = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Min Height */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Min Height: {props.minHeight || 0}px
          </label>
          <input
            type="range"
            min="0"
            max="800"
            step="10"
            value={props.minHeight || 0}
            onChange={(e) => setProp((props: ColumnProps) => (props.minHeight = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

Column.craft = {
  displayName: 'Column',
  props: {
    flex: 1,
    gap: 20,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    background: 'transparent',
    padding: 0,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ColumnSettings,
  },
};
