"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Pause, Play } from "lucide-react";

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
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uHover;
  uniform float uReveal;
  uniform vec2 uMouse;
  uniform float uContainerAspect;
  uniform float uMediaAspect;

  void main() {
    /* cover fit */
    vec2 uv = vUv;
    if (uContainerAspect > uMediaAspect) {
      uv.y = (uv.y - 0.5) * (uMediaAspect / uContainerAspect) + 0.5;
    } else {
      uv.x = (uv.x - 0.5) * (uContainerAspect / uMediaAspect) + 0.5;
    }

    float d = distance(vUv, uMouse);
    vec2 dir = normalize(vUv - uMouse + 1e-4);

    /* ripple emanating from cursor */
    float ripple = sin(d * 26.0 - uTime * 3.4) * exp(-d * 5.5) * 0.045 * uHover;
    uv += dir * ripple;

    /* ambient liquid wobble on hover */
    uv += vec2(
      sin(uv.y * 9.0 + uTime * 1.2),
      cos(uv.x * 9.0 + uTime * 1.1)
    ) * 0.0045 * uHover;

    /* subtle push-in zoom on hover */
    uv = (uv - 0.5) * (1.0 - 0.07 * uHover) + 0.5;

    /* chromatic split, stronger away from cursor */
    float split = (0.006 + d * 0.018) * uHover;
    vec2 off = dir * split;
    vec3 col;
    col.r = texture2D(uTexture, uv + off).r;
    col.g = texture2D(uTexture, uv).g;
    col.b = texture2D(uTexture, uv - off).b;

    /* broadcast scanlines */
    float scan = sin((vUv.y + uTime * 0.18) * 620.0) * 0.025 * uHover;
    col -= scan;

    /* hover contrast/saturation lift */
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, 1.0 + 0.22 * uHover);
    col *= 1.0 + 0.06 * uHover;

    /* clip-style reveal from bottom */
    float edge = smoothstep(uReveal - 0.06, uReveal + 0.02, vUv.y);
    float a = 1.0 - edge;
    /* hot red scan-line riding the reveal edge */
    float line = smoothstep(0.012, 0.0, abs(vUv.y - (1.0 - uReveal)));
    col += vec3(0.95, 0.06, 0.03) * line * step(0.02, uReveal) * step(uReveal, 0.98);

    gl_FragColor = vec4(col, a);
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

type Props = {
  src: string;
  kind: "video" | "image";
  /** width / height of the source media, for cover math */
  mediaAspect?: number;
  alt?: string;
  title?: string;
};

export default function DistortionMedia({ src, kind, mediaAspect = 16 / 9, alt, title }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const useFallback = prefersReduced || !canUseWebGL();
    setReduced(useFallback);
    if (useFallback) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let mesh: THREE.Mesh | null = null;
    let texture: THREE.Texture | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.Camera | null = null;
    let frame = 0;
    let active = false;

    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uReveal: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uContainerAspect: { value: 1 },
      uMediaAspect: { value: mediaAspect },
    };

    let targetHover = 0;
    let targetReveal = 0;
    const start = performance.now();

    const setAspect = () => {
      uniforms.uContainerAspect.value = wrap.clientWidth / Math.max(1, wrap.clientHeight);
    };

    const render = () => {
      uniforms.uTime.value = (performance.now() - start) / 1000;
      uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.08;
      uniforms.uReveal.value += (targetReveal - uniforms.uReveal.value) * 0.07;
      if (renderer && scene && camera) renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    const buildTexture = () => {
      if (kind === "video") {
        const video = videoRef.current;
        if (!video) return null;
        const t = new THREE.VideoTexture(video);
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        return t;
      }
      const loader = new THREE.TextureLoader();
      const t = loader.load(src, (loaded) => {
        if (loaded.image && loaded.image.width) {
          uniforms.uMediaAspect.value = loaded.image.width / loaded.image.height;
        }
      });
      t.minFilter = THREE.LinearFilter;
      return t;
    };

    const init = () => {
      if (renderer) return;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setReduced(true);
        if (kind === "video") videoRef.current?.play().catch(() => {});
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      renderer.domElement.className = "distortion-canvas";
      wrap.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.Camera();
      texture = buildTexture();
      uniforms.uTexture.value = texture;

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
      });
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      setAspect();
      if (kind === "video") videoRef.current?.play().catch(() => {});
      render();
    };

    const teardown = () => {
      cancelAnimationFrame(frame);
      if (kind === "video") videoRef.current?.pause();
      texture?.dispose();
      material?.dispose();
      mesh?.geometry.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      renderer = null;
      material = null;
      mesh = null;
      texture = null;
      scene = null;
      camera = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      uniforms.uMouse.value.x = (e.clientX - rect.left) / rect.width;
      uniforms.uMouse.value.y = 1 - (e.clientY - rect.top) / rect.height;
    };
    const onEnter = () => (targetHover = 1);
    const onLeave = () => (targetHover = 0);

    const ro = new ResizeObserver(() => {
      if (renderer) {
        renderer.setSize(wrap.clientWidth, wrap.clientHeight);
        setAspect();
      }
    });
    ro.observe(wrap);

    /* lazy init only while on (or near) screen — keeps WebGL contexts low */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          active = true;
          init();
          targetReveal = 1;
          if (kind === "video" && playing) videoRef.current?.play().catch(() => {});
        } else if (active) {
          active = false;
          teardown();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(wrap);

    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      ro.disconnect();
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, kind, mediaAspect]);

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="distortion-media" data-cursor="view" ref={wrapRef}>
      {kind === "video" ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={title ? `${title} reel` : alt}
          className={reduced ? "" : "distortion-source"}
        />
      ) : reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} />
      ) : (
        <span className="distortion-poster" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />
      )}
      {kind === "video" && (
        <button className="video-toggle" type="button" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} ${title ?? "reel"}`}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
      )}
    </div>
  );
}
