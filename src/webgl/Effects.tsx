"use client";

import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { Vector2 } from "three";

// Post-processing for the WebGL layer. Bloom is additive (preserves the
// transparent overlay), chromatic aberration is kept tiny so it reads as a
// premium edge fringe rather than a glitch. No Vignette/Noise here — those
// would darken the transparent regions and bleed over the DOM.
export default function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.3}
        radius={0.72}
        mipmapBlur
      />
      <ChromaticAberration offset={new Vector2(0.0009, 0.0009)} radialModulation modulationOffset={0.3} />
    </EffectComposer>
  );
}
