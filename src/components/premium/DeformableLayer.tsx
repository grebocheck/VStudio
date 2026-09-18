import React, { memo } from 'react';
import { MIYA_MESH, triangleTransform, type Deformation, type MeshPart } from './miyaMesh';

interface Props {
  part: MeshPart;
  sourceId: string;
  prefix: string;
  pose: Deformation;
}

/** SVG texture mesh: source artwork stays lossless, and exported poses use the exact same vertices. */
export const DeformableLayer = memo(function DeformableLayer({ part, sourceId, prefix, pose }: Props) {
  return (
    <g data-miya-mesh={part}>
      <defs>
        {MIYA_MESH[part].map((triangle, i) => (
          <clipPath key={i} id={`${prefix}-${part}-triangle-${i}`}>
            <polygon points={triangle.clip} />
          </clipPath>
        ))}
      </defs>
      {MIYA_MESH[part].map((triangle, i) => (
        <g key={i} data-miya-triangle={i} transform={triangleTransform(triangle, part, pose)}>
          <use href={`#${sourceId}`} clipPath={`url(#${prefix}-${part}-triangle-${i})`} />
        </g>
      ))}
    </g>
  );
});

type MeshBinding = { part: MeshPart; nodes: SVGGElement[] };
const bindings = new WeakMap<SVGSVGElement, MeshBinding[]>();

export function applyMiyaMesh(svg: SVGSVGElement, pose: Deformation) {
  let mesh = bindings.get(svg);
  if (!mesh || mesh.some((binding) => !svg.contains(binding.nodes[0]))) {
    mesh = Array.from(svg.querySelectorAll<SVGGElement>('[data-miya-mesh]'), (layer) => ({
      part: layer.dataset.miyaMesh as MeshPart,
      nodes: Array.from(layer.querySelectorAll<SVGGElement>('[data-miya-triangle]')),
    }));
    bindings.set(svg, mesh);
  }
  for (const { part, nodes } of mesh)
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('transform', triangleTransform(MIYA_MESH[part][i], part, pose));
    }
}
