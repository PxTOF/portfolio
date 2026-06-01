import { useThree, useFrame } from "@react-three/fiber";
import { type RefObject } from "react";
import * as THREE from "three";

type ScaleMode = "min" | "width" | "height" | "none";

/**
 * Positions (and optionally scales) a 3D object so it overlays a DOM element
 * (by selector) every frame. The canvas is a fixed full-viewport layer, so
 * getBoundingClientRect (viewport px) maps directly to the camera's z=0 plane.
 *
 * - scaleMode "width"  → object spans the element's width  (good for the logo)
 * - scaleMode "min"    → object spans the smaller dimension (good for blobs)
 * - base = geometry size (world units) along the scaling axis
 * - pad  = multiplier on the fitted size
 */
export function useDomSync(
  selector: string,
  ref: RefObject<THREE.Object3D | null>,
  opts: { scaleMode?: ScaleMode; base?: number; pad?: number } = {}
) {
  const { camera, size } = useThree();
  const { scaleMode = "min", base = 1, pad = 0.42 } = opts;

  useFrame(() => {
    const el = document.querySelector(selector) as HTMLElement | null;
    const obj = ref.current;
    if (!el || !obj) return;
    const r = el.getBoundingClientRect();
    const persp = camera as THREE.PerspectiveCamera;
    const vFov = (persp.fov * Math.PI) / 180;
    const visibleH = 2 * Math.tan(vFov / 2) * persp.position.z;
    const worldPerPx = visibleH / size.height;

    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    obj.position.x = (cx - size.width / 2) * worldPerPx;
    obj.position.y = -(cy - size.height / 2) * worldPerPx;

    if (scaleMode !== "none") {
      const px =
        scaleMode === "width" ? r.width : scaleMode === "height" ? r.height : Math.min(r.width, r.height);
      const world = px * worldPerPx;
      if (world > 0) obj.scale.setScalar((world / base) * pad);
    }

    obj.visible = r.bottom > -80 && r.top < size.height + 80;
  });
}
