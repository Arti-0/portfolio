import { createGlassObject } from "./canvasui/GlassObjectVanilla.ts";
import { createLiquidObject } from "./canvasui/LiquidObjectVanilla.ts";

/**
 * canvas-ui 3D objects — this module carries Three.js (~500 KB raw), so it
 * only ever loads lazily when one of its canvases approaches the viewport
 * on a motion-enabled device.
 */

/* Glass Andoxa mark — left of the ANDOXA title. Lightly manipulable: drag
   to orbit, no zoom. */
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
      scale: 2.4,
      floatIntensity: 0.5,
      rotationIntensity: 0.4,
      floatSpeed: 0.8,
      orbit: true,
      zoom: false,
      autoRotate: false,
    }
  );
}

/* Liquid footer mark — the four field bars in liquid. Not manipulable:
   no orbit, no click splash; the liquid only answers the passing cursor. */
export function mountLiquidFooter(canvas) {
  return createLiquidObject(
    { canvas },
    {
      src: "/footer-mark.svg",
      depth: 0.28,
      bevel: 0.3,
      highlight: "#ff8552",
      tint: "",
      background: "",
      scale: 2.2,
      splash: 0,
      orbit: false,
      zoom: false,
    }
  );
}
