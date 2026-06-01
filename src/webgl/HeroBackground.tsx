"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useScrollStore } from "./store";

// ─── Atmospheric fog field (domain-warped FBM) confined to the hero rect ─────

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uVelocity;
  uniform vec2  uMouse;
  uniform float uAspect;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5); p.x *= uAspect;
    float t = uTime * 0.04;

    vec2 q = vec2(fbm(p * 2.0 + t), fbm(p * 2.0 - t + 5.0));
    float f = fbm(p * 3.0 + q * 1.5 + vec2(0.0, -t * 1.5));

    vec3 ink   = vec3(0.039, 0.027, 0.020);
    vec3 brown = vec3(0.105, 0.052, 0.030);
    vec3 red   = vec3(0.910, 0.153, 0.118);

    vec3 col = mix(ink, brown, smoothstep(0.2, 0.85, f));

    // soft red glow behind the logo, drifting toward the cursor
    vec2 c = vec2(uMouse.x * 0.12, 0.04 + uMouse.y * 0.08);
    float d = length((uv - 0.5 - c) * vec2(uAspect, 1.0));
    float glow = smoothstep(0.78, 0.0, d);
    col += red * glow * (0.16 + 0.14 * f) * (1.0 + abs(uVelocity) * 0.015);

    // vignette + film grain
    col *= smoothstep(1.18, 0.22, length((uv - 0.5) * vec2(uAspect, 1.0)));
    col += hash(uv * 1000.0 + uTime) * 0.05 - 0.025;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

function trackToHero(
  mesh: THREE.Object3D | null,
  camera: THREE.Camera,
  size: { width: number; height: number },
  cover: boolean
) {
  const el = document.querySelector(".hero") as HTMLElement | null;
  if (!el || !mesh) return null;
  const r = el.getBoundingClientRect();
  const persp = camera as THREE.PerspectiveCamera;
  const visH = 2 * Math.tan(((persp.fov * Math.PI) / 180) / 2) * persp.position.z;
  const wpp = visH / size.height;
  mesh.position.x = (r.left + r.width / 2 - size.width / 2) * wpp;
  mesh.position.y = -(r.top + r.height / 2 - size.height / 2) * wpp;
  if (cover) {
    mesh.scale.x = r.width * wpp * 1.08;
    mesh.scale.y = r.height * wpp * 1.08;
  }
  mesh.visible = r.bottom > -60 && r.top < size.height + 60;
  return r;
}

export function HeroBackground() {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
    }),
    []
  );

  useFrame((state, dt) => {
    const r = trackToHero(mesh.current, camera, size, true);
    if (!r) return;
    uniforms.uTime.value += dt;
    uniforms.uVelocity.value = useScrollStore.getState().velocity;
    uniforms.uMouse.value.set(state.pointer.x, state.pointer.y);
    uniforms.uAspect.value = r.width / r.height || 1;
  });

  return (
    <mesh ref={mesh} position-z={-0.6} renderOrder={-2}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} depthWrite={false} />
    </mesh>
  );
}

// ─── Floating dust particles (parallax) ──────────────────────────────────────

export function HeroParticles() {
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const { camera, size } = useThree();

  const geometry = useMemo(() => {
    const n = 800;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state, dt) => {
    trackToHero(group.current, camera, size, false);
    if (group.current) {
      group.current.rotation.y = state.pointer.x * 0.12;
      group.current.rotation.x = -state.pointer.y * 0.08;
    }
    if (points.current) points.current.rotation.z += dt * 0.012;
  });

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry} renderOrder={-1}>
        <pointsMaterial
          size={0.02}
          color="#ffedd7"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
