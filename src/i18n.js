import gsap from "gsap";

/* ============================================================
   FR/EN toggle — dictionary-driven swap, animated in place.
   FR copy is adapted, not word-for-word.
   Mono labels transition with the site's decrypt scramble;
   prose crossfades with a small rise.
   ============================================================ */

const STORAGE_KEY = "lang";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&/";

const translations = {
  en: {
    "doc.title": "Andréas Bodin — Developer, Designer, CTO",
    "nav.practice": "Practice",
    "nav.work": "Work",
    "hero.eyebrow": "Portfolio — 2026&ensp;/&ensp;Based in France",
    "hero.roles":
      "<span>DEV</span> — Web developer&ensp;·&ensp;<span>DSN</span> — UI/UX designer&ensp;·&ensp;<span>CTO</span> — Andoxa",
    "hero.scroll": "Scroll ↓",
    manifesto:
      "I build products end to end — the code, the interface, and the company around both. Three internships taught me how teams ship. <em>Andoxa</em> is teaching me how companies are built.",
    "practice.title": "Three hats,<br />one craft.",
    "role.dev.name": "Engineering",
    "role.dev.desc":
      "Full-stack web — TypeScript, React, Node and the infrastructure underneath. I care about systems that stay simple as they grow.",
    "role.dsn.desc":
      "UI/UX from first wireframe to living design system. I design the interfaces I build, so nothing gets lost in the handoff.",
    "role.cto.desc":
      "Technical leadership at Andoxa — architecture, roadmap and the hundred decisions that live between the lines of code.",
    "andoxa.eyebrow": "Currently — 2025 → now",
    "andoxa.role": "Co-founder &amp; CTO",
    "andoxa.desc":
      "I lead product and engineering at Andoxa, a B2B SaaS built on French public data — and I write all of it: two full product generations, from the first architecture diagram to production. Building a company turned out to be the deepest design problem I've found.",
    "andoxa.v1": "V1 source — Ciel ↗",
    "work.index": "Selected work",
    "work.title": "Built, shipped,<br />documented.",
    "work.01.desc":
      "Gov-data enrichment for B2B prospecting. Next.js 16, Convex, Clerk, an AI planning agent with hard cost caps, and GDPR-by-design data machinery. In production.",
    "work.02.desc":
      "A year of solo product engineering, source-visible: multi-tenant CRM on Postgres row-level security, Stripe billing, 29 Playwright suites, ~141k lines of TypeScript.",
    "work.03.name": "Agent orchestration platform",
    "work.03.desc":
      "Personal infrastructure that runs Claude Code jobs across my repos: disposable git worktrees, deterministic verify gates, multi-terminal SSE streaming, voice input. ~79k lines of TypeScript, a quarter of it tests.",
    "work.live": "Live ↗",
    "work.private": "Private",
    "work.oss": "Open source — production patterns:",
    "xp.index": "Experience",
    "xp.title": "The road here.",
    "xp.dipfab": "CTO, Data Scientist &amp; LLM Engineer",
    "xp.coxidev": "Back-end Developer &amp; UX/UI Designer",
    "xp.decrease": "Web Developer &amp; UX/UI Designer",
    "contact.eyebrow": "Open to ambitious projects",
    "footer.built": "Built by hand — canvas-ui &amp; GSAP",
  },

  fr: {
    "doc.title": "Andréas Bodin — Développeur, designer, CTO",
    "nav.practice": "Savoir-faire",
    "nav.work": "Projets",
    "hero.eyebrow": "Portfolio — 2026&ensp;/&ensp;Basé en France",
    "hero.roles":
      "<span>DEV</span> — Développeur web&ensp;·&ensp;<span>DSN</span> — Designer UI/UX&ensp;·&ensp;<span>CTO</span> — Andoxa",
    "hero.scroll": "Défiler ↓",
    manifesto:
      "Je construis des produits de bout en bout — le code, l'interface, et l'entreprise qui les porte. Trois stages m'ont appris comment une équipe livre un produit. <em>Andoxa</em> m'apprend comment on bâtit une entreprise.",
    "practice.title": "Trois casquettes,<br />un seul métier.",
    "role.dev.name": "Ingénierie",
    "role.dev.desc":
      "Full-stack web — TypeScript, React, Node et l'infrastructure en dessous. Ce qui m'importe&nbsp;: des systèmes qui restent simples en grandissant.",
    "role.dsn.desc":
      "UI/UX, du premier wireframe au design system vivant. Je conçois les interfaces que je code — rien ne se perd entre les deux.",
    "role.cto.desc":
      "Direction technique chez Andoxa — l'architecture, la roadmap, et la centaine de décisions qui se prennent entre les lignes de code.",
    "andoxa.eyebrow": "Actuellement — 2025 → aujourd'hui",
    "andoxa.role": "Co-fondateur &amp; CTO",
    "andoxa.desc":
      "Je pilote le produit et la technique chez Andoxa, un SaaS B2B construit sur la donnée publique française — et j'en écris chaque ligne&nbsp;: deux générations complètes du produit, du premier schéma d'architecture à la mise en production. Construire une entreprise s'est révélé être le problème de design le plus profond que j'aie rencontré.",
    "andoxa.v1": "Code de la V1 — Ciel ↗",
    "work.index": "Projets choisis",
    "work.title": "Construit, livré,<br />documenté.",
    "work.01.desc":
      "Enrichissement de données publiques pour la prospection B2B. Next.js 16, Convex, Clerk, un agent de planification IA aux coûts plafonnés, et une gestion des données pensée RGPD dès la conception. En production.",
    "work.02.desc":
      "Un an d'ingénierie produit en solo, code consultable&nbsp;: CRM multi-tenant sur du row-level security Postgres, facturation Stripe, 29 suites Playwright, ~141k lignes de TypeScript.",
    "work.03.name": "Plateforme d'orchestration d'agents",
    "work.03.desc":
      "L'infrastructure personnelle qui exécute des jobs Claude Code sur mes repos&nbsp;: worktrees git jetables, gates de vérification déterministes, streaming SSE multi-terminaux, commande vocale. ~79k lignes de TypeScript, dont un quart de tests.",
    "work.live": "En ligne ↗",
    "work.private": "Privé",
    "work.oss": "Open source — patterns de production&nbsp;:",
    "xp.index": "Expérience",
    "xp.title": "Le chemin jusqu'ici.",
    "xp.dipfab": "CTO, data scientist &amp; ingénieur LLM",
    "xp.coxidev": "Développeur back-end &amp; designer UX/UI",
    "xp.decrease": "Développeur web &amp; designer UX/UI",
    "contact.eyebrow": "Ouvert aux projets ambitieux",
    "footer.built": "Fait main — canvas-ui &amp; GSAP",
  },
};

let current = "en";
let hooks = {};

function decode(html) {
  const tmp = document.createElement("span");
  tmp.innerHTML = html;
  return tmp.textContent;
}

/* Scramble toward NEW text (the site's intro scramble reveals the same
   text — this one transitions between two strings). DOM writes are
   halved (every other frame) — each textContent write costs a layout */
function scrambleTo(el, html, duration = 420) {
  const target = decode(html);
  const token = (el._i18nToken = (el._i18nToken ?? 0) + 1);
  const start = performance.now();
  let frame = 0;
  const tick = (now) => {
    if (el._i18nToken !== token) return;
    const p = Math.min(1, (now - start) / duration);
    if (p < 1 && frame++ % 2) {
      requestAnimationFrame(tick);
      return;
    }
    const keep = Math.ceil(p * target.length);
    let out = target.slice(0, keep);
    for (const ch of target.slice(keep)) {
      out += /\s/.test(ch) ? ch : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}

/* No box (display:none nav, closed menu) or offscreen → swap without
   animating */
function nearViewport(el) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  return r.bottom > -80 && r.top < window.innerHeight + 80;
}

function setDom(el, html) {
  el._i18nToken = (el._i18nToken ?? 0) + 1; // cancel any running scramble
  el.innerHTML = html;
  if (el.hasAttribute("data-lines")) hooks.onManifestoSwap?.();
}

function applyLanguage(lang, { animate }) {
  current = lang;
  const dict = translations[lang];
  document.documentElement.lang = lang;
  document.title = dict["doc.title"];

  const prose = [];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const html = dict[el.dataset.i18n];
    if (html == null) return;

    if (!animate || !nearViewport(el)) {
      gsap.killTweensOf(el);
      setDom(el, html);
    } else if (el.childElementCount === 0 && (el.hasAttribute("data-scramble") || el.classList.contains("mono"))) {
      /* mono labels decrypt into the new language */
      scrambleTo(el, html);
    } else {
      prose.push([el, html]);
    }
  });

  /* prose crossfades with a small rise — one shared timeline, one reflow
     burst at the swap point (per-element timelines spread reflows over
     dozens of frames and janked on phones) */
  if (prose.length) {
    const els = prose.map(([el]) => el);
    gsap.killTweensOf(els);
    gsap
      .timeline()
      .to(els, { opacity: 0, y: -5, duration: 0.14, stagger: 0.006, ease: "power1.out" })
      .add(() => prose.forEach(([el, html]) => setDom(el, html)))
      .set(els, { y: 5 })
      .to(els, { opacity: 1, y: 0, duration: 0.22, stagger: 0.006, ease: "power3.out" });
  }

  document.querySelectorAll(".lang-toggle").forEach((t) => {
    t.classList.toggle("is-fr", lang === "fr");
    t.setAttribute("aria-label", lang === "fr" ? "English version" : "Version française");
  });

  hooks.onAfterSwap?.(animate);
}

export function initI18n(h = {}) {
  hooks = h;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {}
  const initial =
    stored === "fr" || stored === "en"
      ? stored
      : /^fr\b/i.test(navigator.language || "")
        ? "fr"
        : "en";
  /* Initial language applies instantly, before split/wrap/reveal setup —
     a French browser gets French content and lang="fr", so Chrome never
     offers its own (poor) auto-translation */
  if (initial !== "en") applyLanguage(initial, { animate: false });

  /* the whole pill is one switch — any click flips to the other language */
  document.querySelectorAll(".lang-toggle").forEach((t) => {
    t.addEventListener("click", () => {
      const lang = current === "fr" ? "en" : "fr";
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
      applyLanguage(lang, { animate: !reducedMotion });
    });
  });
}
