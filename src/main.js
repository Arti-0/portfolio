import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createField } from "./field.js";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- WebGL field (hero) ---------- */

createField(document.getElementById("field-canvas"), { reducedMotion });

/* ---------- Split display words into chars ---------- */

document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-hidden", "true");
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
  }
});

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
    .to(heroReveals, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, "-=0.7");

  /* Scroll reveals everywhere below the hero */
  document.querySelectorAll("main > :not(.hero) [data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
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
