import { createGlassObject } from "./canvasui/GlassObjectVanilla.ts";
import { createLiquidObject } from "./canvasui/LiquidObjectVanilla.ts";

/**
 * canvas-ui 3D objects — this module carries Three.js (~500 KB raw), so it
 * only ever loads lazily when one of its canvases approaches the viewport
 * on a motion-enabled device.
 */

/* Glass Andoxa mark — left of the ANDOXA title. Thick glass; lightly
   manipulable (drag to orbit, no zoom). The passive motion is a pendulum
   turntable: the swing speed follows a sine, so the mark drifts one way,
   slows, and swings back — combined with the built-in float and rocking it
   never reads as a plain spin. */
export function mountGlassLogo(canvas) {
  const instance = createGlassObject(
    { canvas },
    {
      src: "/andoxa-mark.svg",
      depth: 0.22,
      bevel: 0.35,
      thickness: 0.85,
      ior: 1.52,
      dispersion: 0.5,
      highlight: "#ff8552",
      tint: "",
      background: "",
      scale: 2.4,
      floatIntensity: 0.7,
      rotationIntensity: 0.75,
      floatSpeed: 1.3,
      orbit: true,
      zoom: false,
      autoRotate: true,
      autoRotateSpeed: 0,
    }
  );
  if (instance) {
    const start = performance.now();
    const swing = (now) => {
      instance.setOptions({
        autoRotateSpeed: Math.sin(((now - start) / 1000) * 0.75) * 3.4,
      });
      requestAnimationFrame(swing);
    };
    requestAnimationFrame(swing);
  }
  return instance;
}

/* Liquid LET'S BUILD — the title itself, flat, carrying the liquid.
   Near-zero extrusion, long-lens camera (fov 14) so there is no visible
   perspective, low gloss and neutral lighting: it should read as the same
   typographic title, only liquid under the cursor. Not manipulable. */
export function mountLiquidTitle(canvas) {
  return createLiquidObject(
    { canvas },
    {
      src: "/lets-build.svg",
      depth: 0.02,
      bevel: 0,
      gloss: 0.2,
      environmentIntensity: 0.9,
      fov: 14,
      scale: 2.7,
      highlight: "#ff8552",
      tint: "",
      background: "",
      splash: 0,
      orbit: false,
      zoom: false,
    }
  );
}
