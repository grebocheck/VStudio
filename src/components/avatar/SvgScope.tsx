import { createContext, useContext } from 'react';

/** SVG paint servers are document-global, even inside separate <svg> elements. */
export const createSvgScope = (prefix: string) => ({
  svgId: (id: string) => `${prefix}-${id}`,
  svgUrl: (value: string) => value.replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${prefix}-${id})`),
});

export const SvgScopeContext = createContext({
  svgId: (id: string) => id,
  svgUrl: (value: string) => value,
});

export const useSvgScope = () => useContext(SvgScopeContext);
