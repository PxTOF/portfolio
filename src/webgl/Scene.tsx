"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshDistortMaterial,
  Preload,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { useDomSync } from "./track";
import { useScrollStore } from "./store";
import { HeroBackground, HeroParticles } from "./HeroBackground";
import Effects from "./Effects";

const LOGO_URL = "/assets/models/snag-logo.glb";

type DistortMat = THREE.MeshPhysicalMaterial & { distort: number; speed: number };

// The actual extruded "Snag" wordmark as cursor-reactive LIQUID CHROME.
// The GLB is low-poly + has no normals, so we make it non-indexed, tessellate
// it for smooth distortion, and recompute normals. The metal reflects the
// studio Lightformer env (cream + red) → premium liquid-metal, no muddy glass.
function HeroLogo() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const matRef = useRef<DistortMat>(null);
  const prevPointer = useRef(new THREE.Vector2());
  const gltf = useGLTF(LOGO_URL);

  const geometry = useMemo(() => {
    const mesh = gltf.nodes["geometry_0"] as THREE.Mesh;
    let g = mesh.geometry.clone().toNonIndexed();
    g.center();
    // subdivide so the noise distortion reads as smooth liquid, not faceted
    g = new TessellateModifier(0.03, 8).modify(g);
    g.computeVertexNormals();
    return g;
  }, [gltf]);

  useDomSync(".hero-view", group, { scaleMode: "width", base: 1, pad: 0.8 });

  useFrame((state, dt) => {
    const g = inner.current;
    if (!g) return;
    const k = Math.min(1, dt * 3);

    // lean toward the cursor (kept gentle so the wordmark stays readable)
    g.rotation.y += (state.pointer.x * 0.4 - g.rotation.y) * k;
    g.rotation.x += (-state.pointer.y * 0.24 - g.rotation.x) * k;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.015;

    // gloop: distortion ramps up with cursor speed + scroll velocity, relaxes when still
    const p = state.pointer;
    const moveSpeed = Math.hypot(p.x - prevPointer.current.x, p.y - prevPointer.current.y) / Math.max(dt, 0.001);
    prevPointer.current.copy(p);
    const vel = Math.abs(useScrollStore.getState().velocity);
    const target = THREE.MathUtils.clamp(0.16 + moveSpeed * 0.05 + vel * 0.006, 0.16, 0.4);
    if (matRef.current) {
      matRef.current.distort = THREE.MathUtils.lerp(matRef.current.distort, target, Math.min(1, dt * 4));
    }
  });

  return (
    <group ref={group}>
      <group ref={inner}>
        <mesh geometry={geometry}>
          <MeshDistortMaterial
            ref={matRef as never}
            color="#2a2a31"
            metalness={1}
            roughness={0.13}
            clearcoat={1}
            clearcoatRoughness={0.18}
            envMapIntensity={2.3}
            distort={0.16}
            speed={1.8}
            radius={1}
          />
        </mesh>
      </group>
    </group>
  );
}
useGLTF.preload(LOGO_URL);

// Studio reflections without an external HDR — bakes once for performance.
function StudioEnv() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer intensity={2.2} position={[0, 2, 4]} scale={[10, 4, 1]} color="#ffedd7" />
      <Lightformer intensity={1.6} position={[-5, 1, 1]} scale={[3, 8, 1]} color="#ffffff" />
      <Lightformer intensity={3} position={[5, -1, 1]} scale={[3, 8, 1]} color="#e8271e" />
      <Lightformer intensity={1.2} position={[0, -4, 2]} scale={[10, 3, 1]} color="#ff7a40" />
    </Environment>
  );
}

export default function Scene({ eventSource }: { eventSource: RefObject<HTMLElement | null> }) {
  // R3F's mount-time ResizeObserver occasionally misses; nudge the buffer.
  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="webgl-layer">
      <Canvas
        eventSource={eventSource as RefObject<HTMLElement>}
        eventPrefix="client"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 40 }}
        onCreated={(state) => state.setSize(window.innerWidth, window.innerHeight)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 4]} intensity={1.8} color="#ffedd7" />
        <directionalLight position={[-4, -2, 2]} intensity={1} color="#e8271e" />
        <HeroBackground />
        <HeroParticles />
        <Suspense fallback={null}>
          <StudioEnv />
          <HeroLogo />
          <Preload all />
        </Suspense>
        <Effects />
      </Canvas>
    </div>
  );
}
