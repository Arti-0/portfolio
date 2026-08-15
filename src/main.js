import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountField } from "./effects.js";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- canvas-ui ForceField layers ---------- */

if (!reducedMotion) {
  /* Hero — ultramarine hexagon lattice over the void, revealed by the cursor */
  mountField(document.getElementById("hero"), {
    shape: "hexagon",
    color: [0.106, 0.173, 0.757],
    edgeColor: [1.0, 0.522, 0.322],
    opacity: 0.55,
    cellScale: 22,
    lineWidth: 0.03,
    gridOpacity: 0.1,
    gridReveal: "both",
    gridRevealStrength: 1.4,
    gridRevealRadius: 320,
    flashSpeed: 0.6,
    flashIntensity: 0.25,
    flowScale: 3.5,
    flowSpeed: 0.5,
    flowIntensity: 0.7,
    edgeGlow: 0.7,
    edgeFalloff: 0.25,
    haze: 0.15,
    grain: 0.12,
    rippleIntensity: 2.2,
    hoverGlow: 0.8,
    hoverRadius: 260,
    pageReact: 0,
    tint: 0,
    dim: 0,
  });

  /* Contact — quiet bone triangles over the ultramarine block */
  mountField(document.getElementById("contact"), {
    shape: "triangle",
    color: [0.925, 0.918, 0.882],
    edgeColor: [1.0, 0.522, 0.322],
    opacity: 0.16,
    cellScale: 16,
    lineWidth: 0.02,
    gridOpacity: 0.12,
    gridReveal: "hover",
    gridRevealStrength: 1.0,
    gridRevealRadius: 300,
    flashSpeed: 0.3,
    flashIntensity: 0.12,
    flowScale: 2.5,
    flowSpeed: 0.3,
    flowIntensity: 0.4,
    edgeGlow: 0,
    haze: 0,
    grain: 0,
    rippleIntensity: 1.2,
    hoverGlow: 0.4,
    pageReact: 0,
    tint: 0,
    dim: 0,
  });
}

/* ---------- canvas-ui 3D objects (lazy — pull Three.js only when needed) ---------- */

const liquidCanvas = document.getElementById("contact-liquid");
const liquidWrap = liquidCanvas?.closest(".contact__title-wrap");

const lazyObjects = [
  { el: document.getElementById("andoxa-object"), mount: "mountGlassLogo", done: false },
  /* The liquid canvas starts display:none, and IntersectionObserver never
     fires on an element without a box — so we observe the wrap, reveal the
     canvas BEFORE mounting (the renderer needs a real clientWidth), and fall
     back to the text title if the mount fails. Skipped under 721px where the
     CSS hides the canvas anyway. */
  window.matchMedia("(min-width: 721px)").matches && liquidCanvas && liquidWrap
    ? {
        el: liquidCanvas,
        observe: liquidWrap,
        done: false,
        before: () => liquidWrap.classList.add("liquid-on"),
        load: (el) =>
          import("./liquid-text.js").then((mod) => mod.mountLiquidText(el, "/lets-build.svg")),
        onMounted: (el, instance) => {
          if (!instance) liquidWrap.classList.remove("liquid-on");
        },
      }
    : null,
].filter((o) => o && o.el);

if (lazyObjects.length && !reducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = lazyObjects.find((o) => (o.observe ?? o.el) === entry.target);
        if (!entry.isIntersecting || !item || item.done) return;
        item.done = true;
        io.unobserve(entry.target);
        item.before?.();
        const loading = item.load
          ? item.load(item.el)
          : import("./object.js").then((mod) => mod[item.mount](item.el));
        loading.then((instance) => item.onMounted?.(item.el, instance));
      });
    },
    { rootMargin: "600px" }
  );
  lazyObjects.forEach((o) => io.observe(o.observe ?? o.el));
}

/* ---------- Mobile menu (functional even with reduced motion) ---------- */

const menuBtn = document.getElementById("menu-btn");
const menu = document.getElementById("menu");

function setMenu(open) {
  document.documentElement.classList.toggle("menu-open", open);
  menuBtn?.setAttribute("aria-expanded", String(open));
  menuBtn?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu?.setAttribute("aria-hidden", String(!open));
}

menuBtn?.addEventListener("click", () => {
  setMenu(!document.documentElement.classList.contains("menu-open"));
});

menu?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => setMenu(false));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

/* ---------- Split display words into chars ---------- */

document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-hidden", "true");
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
  }
});

/* ---------- Decrypt-style scramble on mono labels ---------- */

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&/";

function scramble(el, duration = 850) {
  const original = el.textContent;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const keep = Math.ceil(p * original.length);
    let out = original.slice(0, keep);
    for (const ch of original.slice(keep)) {
      out += /\s/.test(ch) ? ch : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = original;
  };
  requestAnimationFrame(tick);
}

/* ---------- Manifesto: wrap words for scrubbed reveal ---------- */

const manifesto = document.querySelector("[data-lines]");
if (manifesto) {
  const wrap = (node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) {
        frag.appendChild(document.createTextNode(" "));
      } else {
        const w = document.createElement("span");
        w.className = "word";
        w.textContent = piece;
        frag.appendChild(w);
      }
    });
    node.replaceWith(frag);
  };
  [...manifesto.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) wrap(node);
    else [...node.childNodes].forEach(wrap);
  });
}

/* ---------- Motion ---------- */

const loader = document.getElementById("loader");

if (reducedMotion) {
  loader?.remove();
} else {
  const heroChars = document.querySelectorAll(".hero__word .char");
  const heroReveals = document.querySelectorAll(".hero [data-reveal]");

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  intro
    .to(".loader__fill", { scaleX: 1, duration: 0.85, ease: "power2.inOut" })
    .to(loader, {
      yPercent: -100,
      duration: 0.7,
      ease: "power4.inOut",
      onComplete: () => loader.remove(),
    })
    .to(
      heroChars,
      { y: 0, duration: 1.1, stagger: 0.045, ease: "power4.out" },
      "-=0.25"
    )
    .to(heroReveals, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, "-=0.7")
    .add(() => {
      const eyebrow = document.querySelector(".hero [data-scramble]");
      if (eyebrow) scramble(eyebrow);
    }, "-=0.9");

  /* Scroll reveals everywhere below the hero */
  document.querySelectorAll("main > :not(.hero) [data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
      onStart: () => {
        const label = el.querySelector("[data-scramble]") ?? (el.matches("[data-scramble]") ? el : null);
        if (label && !label.closest(".hero")) scramble(label, 700);
      },
    });
  });

  /* Manifesto: ink fills word by word as you scroll */
  if (manifesto) {
    gsap.fromTo(
      manifesto.querySelectorAll(".word"),
      { opacity: 0.6 },
      {
        opacity: 1,
        stagger: 0.06,
        ease: "none",
        scrollTrigger: {
          trigger: manifesto,
          start: "top 78%",
          end: "bottom 55%",
          scrub: 0.4,
        },
      }
    );
  }

  /* Big display words below the hero rise when reached */
  document
    .querySelectorAll(".andoxa__word .char, .contact__title .char")
    .forEach((char) => char.style.setProperty("transform", "translateY(115%)"));

  [".andoxa__title", ".contact__title"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.to(el.querySelectorAll(".char"), {
      y: 0,
      duration: 1,
      stagger: 0.04,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 82%" },
    });
  });

  /* Hero content drifts up slightly as it leaves */
  gsap.to(".hero__inner", {
    yPercent: -14,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "bottom bottom", end: "bottom 30%", scrub: true },
  });
}

/* ---------- Magnetic CTA (fine pointers only) ---------- */

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}
