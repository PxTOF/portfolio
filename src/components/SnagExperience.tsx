"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import SplitType from "split-type";
import { ArrowRight, AtSign, Hand, Mail, MapPin, Pause, Phone, Play } from "lucide-react";
import { brand, projects, services, type Project } from "@/lib/content";
import { useScrollStore } from "@/webgl/store";

gsap.registerPlugin(ScrollTrigger);

// WebGL layer is client-only (no SSR) and lazy-loaded.
const Scene = dynamic(() => import("@/webgl/Scene"), { ssr: false });

const heroImage = "/assets/hero/snag-media-desk.png";
const proofStats = [
  ["Creators activated", "500+", "Built and scaled a paid creator network with clean, repeatable movement — not vanity reach."],
  ["Daily revenue lift", "10×", "Burger Bae went from ₹30K/day to ₹3L/day through content built to convert, not just look good."],
  ["Organic creator posts", "360+", "A Radisson creator experience engineered to be captured, posted, and circulated."],
];
const proofSlides = [
  {
    eyebrow: "Social + growth — Burger Bae",
    title: "Content built to convert",
    copy: "We handled social and growth around content designed to move numbers, then pushed it through a 360+ creator campaign.",
    media: "/assets/media/burger-bae.mp4",
    metric: "Daily revenue",
    value: "10×",
  },
  {
    eyebrow: "Creator experience — Baecave × Radisson",
    title: "Not an event. A content ecosystem.",
    copy: "A closed-room creator experience inside a Radisson property, with every touchpoint built to be captured and circulated.",
    media: "/assets/media/red-radisson.mp4",
    metric: "Organic posts",
    value: "360+",
  },
  {
    eyebrow: "Positioning + digital — Depano",
    title: "Fixing what was stuck",
    copy: "Reworking a fashion brand with no real traction into sharper positioning, content direction, and conversion intent.",
    media: "/assets/media/depano-model.mp4",
    metric: "Focus",
    value: "Sales intent",
  },
];

function LogoMark({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src={brand.logo} alt="SNAG logo" width={1000} height={360} priority={priority} className={className} />;
}

function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signal, setSignal] = useState(0);
  const [phase, setPhase] = useState<"tuning" | "locking" | "locked">("tuning");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.body.classList.add("is-loading");

    // Animated TV static
    const canvas = canvasRef.current;
    let raf = 0;
    const state = { intensity: 1 };
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const W = (canvas.width = 320);
      const H = (canvas.height = 180);
      if (ctx) {
        const draw = () => {
          const img = ctx.createImageData(W, H);
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const v = Math.random() * 255;
            const red = Math.random() > 0.93;
            d[i] = red ? 232 : v;
            d[i + 1] = red ? 39 : v;
            d[i + 2] = red ? 30 : v;
            d[i + 3] = Math.random() * 255 * state.intensity;
          }
          ctx.putImageData(img, 0, 0);
          raf = requestAnimationFrame(draw);
        };
        draw();
      }
    }

    const counter = { v: 0 };
    const tweens = [
      gsap.to(counter, {
        v: 100,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => setSignal(Math.round(counter.v)),
      }),
      gsap.to(state, { intensity: 0.06, duration: 1.5, delay: 0.95, ease: "power2.in" }),
    ];

    const timers = [
      window.setTimeout(() => setPhase("locking"), 950),
      window.setTimeout(() => setPhase("locked"), 2250),
      window.setTimeout(() => {
        document.body.classList.remove("is-loading");
        document.body.classList.add("loader-done");
      }, 2750),
      window.setTimeout(() => setVisible(false), 3400),
    ];

    return () => {
      cancelAnimationFrame(raf);
      tweens.forEach((t) => t.kill());
      timers.forEach((t) => window.clearTimeout(t));
      document.body.classList.remove("is-loading");
    };
  }, []);

  if (!visible) return null;

  const status = phase === "locked" ? "[ SIGNAL LOCKED ]" : phase === "locking" ? "TUNING IN…" : "NO SIGNAL";

  return (
    <div className={`preloader preloader--${phase}`} aria-hidden="true">
      <canvas ref={canvasRef} className="preloader-static" />
      <div className="preloader-scan" />
      <div className="preloader-stage">
        <span className="preloader-status">{status}</span>
        <LogoMark className="preloader-logo" priority />
      </div>
      <div className="preloader-meta">
        <span>Acquiring signal</span>
        <strong>{String(signal).padStart(3, "0")}</strong>
      </div>
      <div className="preloader-bar" style={{ "--p": `${signal}%` } as React.CSSProperties} />
    </div>
  );
}

function ScrollIndicator() {
  return <div className="scroll-progress" aria-hidden="true" />;
}

function Cursor() {
  return (
    <>
      <div className="cursor-dot" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true">
        <span>VIEW</span>
      </div>
    </>
  );
}

function VideoTeaser({ src, title, compact = false }: { src: string; title: string; compact?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

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
    <div className={`video-teaser ${compact ? "is-compact" : ""}`} data-cursor="view">
      <span className="media-glow" aria-hidden="true" />
      <span className="media-border" aria-hidden="true" />
      <video ref={videoRef} src={src} muted autoPlay loop playsInline preload="metadata" aria-label={`${title} reel`} />
      <button type="button" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} ${title}`}>
        {playing ? <Pause size={14} /> : <Play size={14} />}
        <span>{playing ? "Pause" : "Play"}</span>
      </button>
    </div>
  );
}

function SignalWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let t = 0;
    let running = true;
    let mouse = 0.5;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const draw = () => {
      if (!running) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const mid = H / 2;
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const amp = H * 0.16 * (1 - layer * 0.26) * (0.6 + mouse * 0.8);
        const freq = 0.0055 + layer * 0.0022;
        const speed = t * (0.018 + layer * 0.012);
        for (let x = 0; x <= W; x += 5) {
          const env = Math.sin(x * 0.0011 + t * 0.008);
          const y = mid + Math.sin(x * freq + speed) * amp * env;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(232, 39, 30, ${0.55 - layer * 0.15})`;
        ctx.lineWidth = 2.2 - layer * 0.6;
        ctx.stroke();
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-wave" aria-hidden="true" />;
}

function Hero() {
  return (
    <section className="hero" id="intro">
      <Image src={heroImage} alt="" fill priority className="hero-bg" sizes="100vw" />
      <div className="hero-shade" aria-hidden="true" />

      <div className="hero-inner">
        <p className="hero-kicker">A new-age creative &amp; content studio — Gurgaon</p>
        {/* The 3D glass SNAG logo renders onto this tracker via WebGL */}
        <div className="hero-view" aria-hidden="true" />
        <p className="hero-tagline">
          We don&apos;t just make content. <em>We make people care.</em>
        </p>
      </div>

      <aside className="hero-card">
        <p className="hero-card-eyebrow">Studio · Gurgaon</p>
        <div className="dashline" />
        <p className="hero-card-body">Built for brands that want relevance, not just reach.</p>
      </aside>

      <div className="hero-scroll" aria-hidden="true">
        <span className="hero-scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

function AttentionModel() {
  return (
    <section className="attention-model" id="features">
      <SignalWave />
      <div className="attention-glow" aria-hidden="true" />
      <div className="model-title">
        <p className="section-label">What we do</p>
        <h2>We don&apos;t just make content.</h2>
        <p>
          We study behaviour, build content systems, and turn attention into real brand value — backed by insight,
          speed, and execution that actually performs.
        </p>
      </div>
      <div className="feature-grid">
        {proofStats.map(([label, value, note]) => (
          <article className="feature-card" key={label}>
            <div className="feature-top">
              <span className="feature-icon" aria-hidden="true" />
              <p>{label}</p>
            </div>
            <strong>{value}</strong>
            <div className="dashline" />
            <p>{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProofSlides() {
  return (
    <section className="proof-slides" id="proof-gallery" aria-label="Attention proof">
      {proofSlides.map((slide, i) => (
        <article className="proof-slide" key={slide.title} data-idx={i} style={{ opacity: i === 0 ? 1 : 0 }}>
          <video src={slide.media} muted autoPlay loop playsInline preload="metadata" aria-hidden="true" />
          <div className="proof-vignette" aria-hidden="true" />
          <div className="proof-copy">
            <p>{slide.eyebrow}</p>
            <h2>{slide.title}</h2>
            <span>{slide.copy}</span>
          </div>
          <div className="proof-chip" aria-hidden="true">
            <div>
              <strong>{slide.metric}</strong>
              <b>{slide.value}</b>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function ProjectMedia({ project }: { project: Project }) {
  if (project.video) return <VideoTeaser src={project.video} title={project.title} />;
  return (
    <div className="project-placeholder">
      <LogoMark />
      <span>Reel slot open</span>
    </div>
  );
}

function WorkShowcase() {
  return (
    <>
      <section className="work-product" id="product">
        <div className="work-intro">
          <p className="section-label">Selected work</p>
          <h2>We don&apos;t show everything. Just what moved the needle.</h2>
          <p>
            Open the work, play the reels, and see what actually moved when content was treated as a system, not a
            calendar.
          </p>
        </div>
      </section>
      <section className="cards-section" id="cards-section">
        <div className="project-rail" id="cards-track">
          {projects.map((project) => (
            <article
              className="project-card"
              key={project.id}
              style={{ "--accent": project.accent } as React.CSSProperties}
            >
              <div className="project-card-copy">
                <div className="project-meta">
                  <span>{project.index}</span>
                  <span>{project.status}</span>
                </div>
                <Image src={project.logo} alt={`${project.title} logo`} width={220} height={130} className="client-logo" />
                <p className="project-category">{project.category}</p>
                <h3>{project.title}</h3>
                <p>{project.headline}</p>
                <div className="project-result">
                  <span>{project.outcomeLabel}</span>
                  <strong>{project.outcome}</strong>
                </div>
              </div>
              <ProjectMedia project={project} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

const MARQUEE_TOP = ["CONTENT", "CREATORS", "CAMPAIGNS", "BRANDING", "GROWTH", "REELS", "STRATEGY"];
const MARQUEE_BOTTOM = ["SOCIAL", "INFLUENCE", "PRODUCTION", "DESIGN", "PAID ADS", "CULTURE", "LAUNCHES"];

function WhatWeDoMarquee() {
  return (
    <section className="marquee-sec" id="capabilities">
      <div className="marquee-head">
        <p className="section-label">Everything under one roof</p>
        <h2>
          We do a lot. <em>On purpose.</em>
        </h2>
        <p className="marquee-sub">
          One team for content, creators, and growth — so the brand actually moves as one thing.
        </p>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE_TOP, ...MARQUEE_TOP].map((word, i) => (
            <span className="marquee-word" key={`t-${i}`}>
              {word}
              <i>✺</i>
            </span>
          ))}
        </div>
      </div>

      <div className="marquee marquee--rev">
        <div className="marquee-track">
          {[...MARQUEE_BOTTOM, ...MARQUEE_BOTTOM].map((word, i) => (
            <span className="marquee-word marquee-word--ghost" key={`b-${i}`}>
              {word}
              <i>/</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpenWeightProof() {
  return (
    <section className="open-proof">
      <div className="open-proof-header">
        <p className="section-label">Why SNAG</p>
        <div className="open-logo-line">
          <LogoMark className="open-logo" />
        </div>
      </div>
      <article>
        <h3>Who we are</h3>
        <p>
          A hybrid of creators, strategists, and operators. We started in social and grew into a full-stack studio for
          talent, influence, and cultural impact.
        </p>
      </article>
      <article>
        <h3>Why brands choose us</h3>
        <p>
          No outdated playbooks. No vanity metrics. Just sharp strategy, strong execution, and{" "}
          <span>content that actually moves.</span>
        </p>
      </article>
      <article>
        <h3>What we do</h3>
        <div className="service-cloud">
          {services.slice(0, 8).map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title}>
                <Icon size={17} />
                <span>{service.title}</span>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

export default function SnagExperience() {
  const appRef = useRef<HTMLDivElement>(null);
  const [webglOn, setWebglOn] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let supported = false;
    try {
      const c = document.createElement("canvas");
      supported = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      supported = false;
    }
    setWebglOn(supported && !reduce);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    ScrollTrigger.config({ ignoreMobileResize: true });
    const lenis = reduceMotion ? null : new Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = (time: number) => lenis?.raf(time * 1000);

    if (lenis) {
      lenis.on("scroll", (e: { velocity?: number; progress?: number }) => {
        ScrollTrigger.update();
        useScrollStore.getState().setScroll(e.progress ?? 0, e.velocity ?? 0);
      });
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    if (!reduceMotion) {
      gsap.to(".scroll-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: document.documentElement, start: 0, end: "max", scrub: 0.2 },
      });

      // Hero parallax — bg drifts in, content lifts + fades as you scroll away
      gsap.to(".hero-bg", {
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero-inner", {
        yPercent: -8,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "30% top", end: "bottom top", scrub: true },
      });

      // Attention model glow
      const attentionEl = document.querySelector<HTMLElement>(".attention-model");
      const glowEl = document.querySelector<HTMLElement>(".attention-glow");
      if (attentionEl && glowEl) {
        attentionEl.addEventListener("mousemove", (e) => {
          const rect = attentionEl.getBoundingClientRect();
          const x = (((e as MouseEvent).clientX - rect.left) / rect.width) * 100;
          const y = (((e as MouseEvent).clientY - rect.top) / rect.height) * 100;
          gsap.to(glowEl, {
            "--glow-x": `${x.toFixed(1)}%`,
            "--glow-y": `${y.toFixed(1)}%`,
            "--glow-opacity": "1",
            duration: 0.5,
            ease: "power2.out",
          });
        });
        attentionEl.addEventListener("mouseleave", () => {
          gsap.to(glowEl, { "--glow-opacity": "0", duration: 0.7 });
        });
      }

      // Proof reels — pinned gallery, longer hold per reel + clip-wipe transitions
      const proofGallery = document.getElementById("proof-gallery");
      const proofSlideEls = proofGallery?.querySelectorAll<HTMLElement>(".proof-slide");
      const total = proofSlideEls?.length ?? 0;
      if (proofGallery && proofSlideEls && total > 0) {
        let current = 0;
        proofSlideEls.forEach((s, i) =>
          gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, clipPath: "inset(0% 0% 0% 0%)" })
        );
        const revealCopy = (slide: HTMLElement) => {
          const copy = slide.querySelector(".proof-copy");
          if (copy) {
            gsap.fromTo(
              copy.children,
              { yPercent: 60, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.12 }
            );
          }
        };
        revealCopy(proofSlideEls[0]);
        ScrollTrigger.create({
          trigger: proofGallery,
          start: "top top",
          end: `+=${total * 150}%`,
          pin: true,
          pinSpacing: true,
          onUpdate: (self) => {
            const idx = Math.min(Math.floor(self.progress * total * 0.999), total - 1);
            if (idx === current) return;
            const down = idx > current;
            const incoming = proofSlideEls[idx];
            const outgoing = proofSlideEls[current];
            gsap.to(outgoing, { autoAlpha: 0, duration: 0.45, ease: "power2.inOut", overwrite: true });
            gsap.fromTo(
              incoming,
              { autoAlpha: 1, clipPath: down ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut", overwrite: true }
            );
            revealCopy(incoming);
            current = idx;
          },
        });
      }

      // Horizontal project cards — scroll-jacked pin on desktop;
      // mobile uses native horizontal swipe (CSS) for reliable touch behavior.
      const cardsSection = document.getElementById("cards-section");
      const cardsTrack = document.getElementById("cards-track");
      if (cardsSection && cardsTrack && !isMobile) {
        requestAnimationFrame(() => {
          const totalScrollWidth = cardsTrack.scrollWidth - window.innerWidth;
          if (totalScrollWidth <= 0) return;
          gsap.to(cardsTrack, {
            x: -totalScrollWidth,
            ease: "none",
            scrollTrigger: {
              trigger: cardsSection,
              start: "top top",
              end: `+=${totalScrollWidth}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
            },
          });
        });
      }

      // Contact — two hands meet on scroll, then the contact info zooms in
      const contactSec = document.querySelector<HTMLElement>(".contact");
      const handL = document.querySelector<HTMLElement>(".hand--l");
      const handR = document.querySelector<HTMLElement>(".hand--r");
      const spark = document.querySelector<HTMLElement>(".hands-spark");
      const reveal = document.querySelector<HTMLElement>(".contact-reveal");
      const handsHint = document.querySelector<HTMLElement>(".hands-hint");
      if (contactSec && handL && handR && spark && reveal && !isMobile) {
        gsap.set(reveal, { scale: 0.55, autoAlpha: 0 });
        gsap.set(spark, { autoAlpha: 0, scale: 0.2 });
        gsap.set(handL, { xPercent: -185, rotate: -8 });
        gsap.set(handR, { xPercent: 185, rotate: 8 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: contactSec,
            start: "top top",
            end: "+=190%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });
        tl.to(handL, { xPercent: -12, rotate: 0, ease: "power2.inOut" }, 0)
          .to(handR, { xPercent: 12, rotate: 0, ease: "power2.inOut" }, 0)
          .to(handsHint, { autoAlpha: 0, duration: 0.15 }, 0.25)
          .to(spark, { autoAlpha: 1, scale: 1.5, ease: "power2.out", duration: 0.18 }, 0.46)
          .to([handL, handR], { autoAlpha: 0, duration: 0.18 }, 0.56)
          .to(spark, { autoAlpha: 0, duration: 0.2 }, 0.62)
          .fromTo(
            reveal,
            { scale: 0.55, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, ease: "power3.out", duration: 0.4 },
            0.55
          );
      }

      // SplitType text reveals (after preloader)
      window.setTimeout(() => {
        // Hero entrance (the 3D logo fades up via WebGL; DOM copy staggers in)
        gsap.from(".hero-kicker", { autoAlpha: 0, y: 24, duration: 0.7, ease: "power2.out" });
        gsap.from(".hero-tagline", { autoAlpha: 0, y: 30, duration: 0.85, ease: "power2.out", delay: 0.3 });
        gsap.from(".hero-card", { autoAlpha: 0, y: 24, duration: 0.7, ease: "power2.out", delay: 0.45 });
        gsap.from(".hero-scroll", { autoAlpha: 0, duration: 0.7, ease: "power2.out", delay: 0.6 });

        // Stat count-up
        gsap.utils.toArray<HTMLElement>(".feature-card strong").forEach((el) => {
          const raw = el.textContent || "";
          const m = raw.match(/^(\d+)(.*)$/);
          if (!m) return;
          const target = parseInt(m[1], 10);
          const suffix = m[2];
          const obj = { n: 0 };
          ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            once: true,
            onEnter: () =>
              gsap.to(obj, {
                n: target,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = Math.round(obj.n) + suffix;
                },
              }),
          });
        });

        document.querySelectorAll<HTMLElement>("h2").forEach((el) => {
          if (el.closest(".hero") || el.closest(".proof-slide")) return;
          const split = new SplitType(el, { types: "lines" });
          const lines = split.lines ?? [];
          lines.forEach((line) => {
            const wrap = document.createElement("span");
            Object.assign(wrap.style, { display: "block", overflow: "hidden" });
            line.parentElement?.insertBefore(wrap, line);
            wrap.appendChild(line);
          });
          gsap.from(lines, {
            yPercent: 110,
            duration: 0.95,
            stagger: 0.09,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        document.querySelectorAll<HTMLElement>(".section-label").forEach((el) => {
          gsap.from(el, {
            y: 16,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });

        gsap.utils.toArray<HTMLElement>(".feature-card, .model-card, .open-proof article").forEach((el) => {
          gsap.from(el, {
            y: 60,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        ScrollTrigger.refresh();
      }, 2950);
    }

    // Cursor
    const dot = document.querySelector<HTMLElement>(".cursor-dot");
    const ring = document.querySelector<HTMLElement>(".cursor-ring");
    let cx = 0, cy = 0, rx = 0, ry = 0, frame = 0;
    const onPointerMove = (e: PointerEvent) => {
      cx = e.clientX; cy = e.clientY;
      if (dot) { dot.style.left = `${cx}px`; dot.style.top = `${cy}px`; }
    };
    const cursorLoop = () => {
      rx += (cx - rx) * 0.14; ry += (cy - ry) * 0.14;
      if (ring) { ring.style.left = `${rx}px`; ring.style.top = `${ry}px`; }
      frame = requestAnimationFrame(cursorLoop);
    };
    window.addEventListener("pointermove", onPointerMove);
    cursorLoop();

    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,[data-cursor='view']"))
        document.body.classList.add("cursor-grow");
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a,button,[data-cursor='view']"))
        document.body.classList.remove("cursor-grow");
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 2900);
    return () => {
      window.clearTimeout(refresh);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(frame);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      if (lenis) {
        gsap.ticker.remove(raf);
        lenis.destroy();
      }
    };
  }, []);

  return (
    <div ref={appRef} className="app-root">
      {webglOn && <Scene eventSource={appRef} />}
      <Preloader />
      <ScrollIndicator />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <header className="site-header">
        <a href="#intro" aria-label="SNAG home" className="header-logo">
          <LogoMark priority />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#intro">Intro</a>
          <a href="#features">Features</a>
          <a href="#product">Product</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main>
        <Hero />
        <AttentionModel />
        <ProofSlides />
        <WorkShowcase />
        <WhatWeDoMarquee />
        <OpenWeightProof />
        <section className="contact" id="contact">
          <div className="contact-stage">
            <div className="hands" aria-hidden="true">
              <span className="hand hand--l">
                <Hand size={120} strokeWidth={1.25} />
              </span>
              <span className="hands-spark" />
              <span className="hand hand--r">
                <Hand size={120} strokeWidth={1.25} />
              </span>
              <span className="hands-hint">Keep scrolling…</span>
            </div>

            <div className="contact-reveal">
              <div className="footer-punch">
                <LogoMark className="footer-logo" />
                <h2>
                  Let&apos;s build something that actually moves.
                  <span>Limited projects. Built with intent.</span>
                </h2>
              </div>
              <div className="contact-grid">
                <div className="contact-copy">
                  <p className="section-label">Say hello</p>
                  <a href={`mailto:${brand.email}`} data-cursor="view">
                    <Mail size={18} />
                    {brand.email}
                  </a>
                  <a href="https://instagram.com/studio.snag" target="_blank" rel="noreferrer" data-cursor="view">
                    <AtSign size={18} />
                    {brand.instagram}
                  </a>
                  <a href={`tel:${brand.phone.replace(/\s/g, "")}`} data-cursor="view">
                    <Phone size={18} />
                    {brand.phone}
                  </a>
                  <span>
                    <MapPin size={18} />
                    {brand.location}
                  </span>
                </div>
                <aside className="contact-cta">
                  <p className="contact-cta-line">Got a brand that deserves to be cared about?</p>
                  <a className="contact-cta-btn" href={`mailto:${brand.email}`} data-cursor="view">
                    Start a project
                    <ArrowRight size={18} />
                  </a>
                  <p className="contact-cta-note">We only take on a few at a time — so make it a good one.</p>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>© 2026</span>
        <span>{brand.instagram}</span>
        <a href={`mailto:${brand.email}`}>{brand.email}</a>
      </footer>
    </div>
  );
}
