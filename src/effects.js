import { createForceField } from "./canvasui/ForceFieldVanilla.ts";

/**
 * Mount a canvas-ui ForceField as a decorative layer inside `section`.
 * The section itself is passed as `content`, so hover reveal and click
 * ripples react to the real DOM. Page capture (HTML-in-canvas) is a
 * progressive enhancement; without it the lattice renders standalone.
 * Returns null when WebGL2 is unavailable — the plain background stays.
 */
export function mountField(section, options) {
  const output = section.querySelector("[data-field-output]");
  const source = section.querySelector("[data-field-source]");
  if (!output || !source) return null;

  const instance = createForceField({ source, content: section, output }, options);
  if (!instance) return null;

  const onResize = () => instance.resize();
  const ro = new ResizeObserver(onResize);
  ro.observe(output);
  window.addEventListener("resize", onResize, { passive: true });

  return instance;
}
