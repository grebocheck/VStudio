import type { AvatarModelId } from '../types';

export type Avatar3DModelId = Extract<AvatarModelId, `${string}-3d`>;

/** Also accepts DOM data attributes, keeping export and renderer routing consistent. */
export function is3DModel(modelId: string | null | undefined): modelId is Avatar3DModelId {
  return modelId === 'aurelia-3d' || modelId === 'seraphine-3d';
}
