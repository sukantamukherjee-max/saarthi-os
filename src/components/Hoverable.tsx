import React, { useState } from 'react';
import { sx } from './sx';

interface HoverableProps extends Omit<React.HTMLAttributes<HTMLElement>, 'style'> {
  as?: 'button' | 'label';
  style?: string;
  hoverStyle?: string;
  type?: string;
  title?: string;
  'aria-label'?: string;
}

// If the hover style overrides a longhand (e.g. borderColor) that the base
// style set via its shorthand (border), expand the shorthand first so React
// isn't asked to mix shorthand and longhand for the same property.
function expandBorderShorthand(base: Record<string, any>, hover?: Record<string, any>) {
  if (!hover || base.border == null) return base;
  const overridesLonghand = ['borderColor', 'borderWidth', 'borderStyle'].some(k => k in hover);
  if (!overridesLonghand) return base;
  const parts = String(base.border).trim().split(/\s+/);
  const { border, ...rest } = base;
  return { ...rest, borderWidth: parts[0], borderStyle: parts[1], borderColor: parts.slice(2).join(' ') };
}

/** Reproduces the design canvas's `style-hover="..."` attribute, which has no plain-CSS equivalent for inline styles. */
export default function Hoverable({ as = 'button', style, hoverStyle, children, onMouseEnter, onMouseLeave, ...rest }: HoverableProps) {
  const [hover, setHover] = useState(false);
  const base = expandBorderShorthand(sx(style) || {}, sx(hoverStyle));
  const hov = hover && hoverStyle ? sx(hoverStyle) : undefined;
  const Tag = as as any;
  return (
    <Tag
      {...rest}
      style={{ ...base, ...hov }}
      onMouseEnter={(e: React.MouseEvent) => { setHover(true); onMouseEnter?.(e as any); }}
      onMouseLeave={(e: React.MouseEvent) => { setHover(false); onMouseLeave?.(e as any); }}
    >
      {children}
    </Tag>
  );
}
