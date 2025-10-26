// @ts-nocheck
import React from 'react';
import { useNode } from '@craftjs/core';

export interface RowProps {
  gap?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
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

export const Row: React.FC<RowProps> = ({
  gap = 20,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  flexWrap = 'wrap',
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
        flexDirection: 'row',
        gap: `${gap}px`,
        alignItems,
        justifyContent,
        flexWrap,
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
        minHeight: minHeight !== undefined ? `${minHeight}px` : '60px',
        outline: selected ? '2px dashed #3b82f6' : 'none',
        outlineOffset: '2px',
        position: 'relative',
        width: '100%',
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
            width: '100%',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          Trascina qui i componenti →
        </div>
      )}
      {children}
    </div>
  );
};

// Settings Panel
const RowSettings: React.FC = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as RowProps,
  }));

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}>Row Settings</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            onChange={(e) => setProp((props: RowProps) => (props.gap = parseInt(e.target.value)))}
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
            onChange={(e) => setProp((props: RowProps) => (props.alignItems = e.target.value as any))}
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
            onChange={(e) => setProp((props: RowProps) => (props.justifyContent = e.target.value as any))}
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

        {/* Flex Wrap */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Flex Wrap
          </label>
          <select
            value={props.flexWrap}
            onChange={(e) => setProp((props: RowProps) => (props.flexWrap = e.target.value as any))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            <option value="nowrap">No Wrap</option>
            <option value="wrap">Wrap</option>
            <option value="wrap-reverse">Wrap Reverse</option>
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
            onChange={(e) => setProp((props: RowProps) => (props.background = e.target.value))}
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
            onChange={(e) => setProp((props: RowProps) => (props.padding = parseInt(e.target.value)))}
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
            onChange={(e) => setProp((props: RowProps) => (props.minHeight = parseInt(e.target.value)))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

Row.craft = {
  displayName: 'Row',
  props: {
    gap: 20,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
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
    settings: RowSettings,
  },
};
