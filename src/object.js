import { createGlassObject } from "./canvasui/GlassObjectVanilla.ts";

/**
 * Glass Andoxa mark — canvas-ui GlassObject, loaded lazily because it
 * carries Three.js (~500 KB raw). This module only ever loads when the
 * Andoxa section approaches the viewport on a motion-enabled device.
 */
export function mountGlassLogo(canvas) {
  return createGlassObject(
    { canvas },
    {
      src: "/andoxa-mark.svg",
      depth: 0.22,
      bevel: 0.35,
      highlight: "#ff8552",
      tint: "",
      background: "",
      scale: 2.1,
      floatIntensity: 0.6,
      rotationIntensity: 0.5,
      floatSpeed: 0.8,
      orbit: false,
      zoom: false,
      autoRotate: false,
    }
  );
}
