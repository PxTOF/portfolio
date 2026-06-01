"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPower;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    float cursor = smoothstep(0.62, 0.0, distance(uv, uMouse));

    /* domain-warped double-FBM for organic fluid */
    vec2 q = vec2(
      fbm(uv * 1.8 + vec2(0.0, 0.0) + uTime * 0.038),
      fbm(uv * 1.8 + vec2(5.2, 1.3) + uTime * 0.035)
    );
    vec2 r = vec2(
      fbm(uv * 2.2 + 3.8 * q + vec2(1.7, 9.2) + uTime * 0.055 + cursor * 0.55),
      fbm(uv * 2.2 + 3.8 * q + vec2(8.3, 2.8) + uTime * 0.048 + cursor * 0.45)
    );
    float f = fbm(uv * 1.9 + r * (1.5 + uPower * 2.6));

    /* palette */
    vec3 ink   = vec3(0.010, 0.008, 0.007);
    vec3 red   = vec3(0.92,  0.028, 0.014);
    vec3 ember = vec3(1.0,   0.36,  0.10);
    vec3 cyan  = vec3(0.06,  0.90,  0.98);
    vec3 violet= vec3(0.64,  0.30,  0.96);

    /* base fluid */
    vec3 color = mix(ink, red, smoothstep(0.28, 0.84, f));

    /* ember hot-spots where fluid peaks */
    color = mix(color, ember, pow(max(0.0, f - 0.70), 2.4) * 1.6);

    /* subtle cyan trace at the fluid boundary */
    float boundary = smoothstep(0.60, 0.74, f) * (1.0 - smoothstep(0.74, 0.90, f));
    color += cyan * boundary * 0.10;

    /* violet ghost in dark pockets */
    float pocket = fbm(uv * 3.2 - uTime * 0.025) * (1.0 - f);
    color += violet * pocket * 0.055;

    /* cursor bloom */
    color += ember * pow(cursor, 2.1) * 0.50;
    color += vec3(1.0, 0.85, 0.7) * pow(cursor, 5.5) * 0.90;

    /* scan lines (subtle) */
    float scan = sin((uv.y + uTime * 0.055) * 44.0) * 0.022;
    color += scan * vec3(0.55, 0.02, 0.02) * (0.4 + f * 0.6);

    /* radial vignette — darkens corners, lifts center */
    float vignette = 1.0 - smoothstep(0.30, 1.05, length((uv - 0.5) * vec2(1.0, 1.35)));
    color = mix(ink * 0.45, color, 0.32 + vignette * 0.68);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function FluidHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    if (!canUseWebGL()) {
      mount.classList.add("webgl-fallback");
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      mount.classList.add("webgl-fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uPower: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let frame = 0;
    let targetPower = 0;
    const start = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      uniforms.uMouse.value.x = (event.clientX - rect.left) / rect.width;
      uniforms.uMouse.value.y = 1 - (event.clientY - rect.top) / rect.height;
      targetPower = 1;
    };

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const render = () => {
      uniforms.uTime.value = (performance.now() - start) / 1000;
      uniforms.uPower.value += (targetPower - uniforms.uPower.value) * 0.08;
      targetPower *= 0.94;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    mount.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onResize);
    render();

    return () => {
      cancelAnimationFrame(frame);
      mount.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="fluid-hero" ref={mountRef} aria-hidden="true" />;
}
