import React, { useEffect, useRef, useState } from "react";
import "./Home.css";

const FEATURES = [
  {
    icon: "🐚",
    title: "Product Management",
    desc: "Manage local and export seafood products with variant pricing, images, and species categorisation across live, fresh and frozen conditions.",
  },
  {
    icon: "🚢",
    title: "Export Pricing",
    desc: "Calculate FOB and CNF prices for sea and air freight with automatic cascade updates when base costs change.",
  },
  {
    icon: "📊",
    title: "Customer Price Lists",
    desc: "Generate tailored price lists per customer with custom margins, freight rates and downloadable PDFs in seconds.",
  },
  {
    icon: "💱",
    title: "Live USD Rates",
    desc: "All export calculations update instantly when the USD exchange rate changes — no manual recalculation needed.",
  },
  {
    icon: "📦",
    title: "Bulk Operations",
    desc: "Add entire product catalogues to customer accounts in one flow, with per-variant margin control before committing.",
  },
  {
    icon: "📄",
    title: "PDF Generation",
    desc: "Professional branded product lists and price sheets ready to share with buyers at the click of a button.",
  },
];

const STATS = [
  { value: "2", label: "Markets", sub: "Local & Export" },
  { value: "∞", label: "Customers", sub: "Unlimited accounts" },
  { value: "100%", label: "Accurate", sub: "Auto-calculated pricing" },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

export default function LandingPage() {
  const canvasRef = useRef(null);
  const [heroRef, heroIn] = useInView(0.05);
  const [statsRef, statsIn] = useInView();
  const [featRef, featIn] = useInView();
  const [ctaRef, ctaIn] = useInView();

  /* ── animated ocean canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const waves = [
      {
        amp: 28,
        freq: 0.008,
        speed: 0.08,
        y: 0.72,
        alpha: 0.07,
        color: "#1ab5c8",
      },
      {
        amp: 18,
        freq: 0.012,
        speed: 0.12,
        y: 0.78,
        alpha: 0.05,
        color: "#0b7c8a",
      },
      {
        amp: 38,
        freq: 0.005,
        speed: 0.05,
        y: 0.85,
        alpha: 0.04,
        color: "#0e3a6e",
      },
      {
        amp: 14,
        freq: 0.018,
        speed: 0.15,
        y: 0.91,
        alpha: 0.06,
        color: "#1ab5c8",
      },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waves.forEach((w) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 4) {
          const y =
            w.y * canvas.height + Math.sin(x * w.freq + t * w.speed) * w.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.globalAlpha = w.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      t += 0.8;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="lp-root">
      {/* Ocean canvas */}
      <canvas ref={canvasRef} className="lp-canvas" />

      {/* Grain overlay */}
      <div className="lp-grain" />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="#c8a96e" strokeWidth="1.2" />
            <path
              d="M8 20 Q12 10 16 14 Q20 18 24 10"
              stroke="#1ab5c8"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="16" cy="14" r="2" fill="#c8a96e" opacity="0.8" />
          </svg>
          <div>
            <span className="lp-nav-name">Tropical Shellfish</span>
            <span className="lp-nav-sub">Business Management System</span>
          </div>
        </div>
        <a href="/login" className="lp-nav-btn">
          Staff Login →
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className={`lp-hero-content ${heroIn ? "is-visible" : ""}`}>
          <p className="lp-eyebrow">
            <span className="lp-eyebrow-line" /> Seafood Export Intelligence
          </p>
          <h1 className="lp-hero-title">
            From Ocean to
            <br />
            <em>Price List</em> —<br />
            In Minutes.
          </h1>
          <p className="lp-hero-desc">
            A complete business management system built for Tropical Shellfish
            (Pvt) Ltd. Manage products, customers, freight rates and export
            pricing with precision.
          </p>
          <div className="lp-hero-actions">
            <a href="/login" className="lp-btn-primary">
              Access the System
            </a>
            <a href="#features" className="lp-btn-ghost">
              Explore Features ↓
            </a>
          </div>
        </div>

        {/* Hero visual — decorative shell grid */}
        <div className={`lp-hero-visual ${heroIn ? "is-visible" : ""}`}>
          <div className="lp-shell-grid">
            {["🦞", "🐚", "🦀", "🐠", "🦪", "🦐", "🐡", "🦑", "🐙"].map(
              (e, i) => (
                <div
                  key={i}
                  className="lp-shell-cell"
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <span>{e}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats-section" ref={statsRef}>
        <div className={`lp-stats-row ${statsIn ? "is-visible" : ""}`}>
          {STATS.map((s, i) => (
            <div
              key={i}
              className="lp-stat"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="lp-stat-value">{s.value}</span>
              <span className="lp-stat-label">{s.label}</span>
              <span className="lp-stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features" ref={featRef}>
        <div className={`lp-section-header ${featIn ? "is-visible" : ""}`}>
          <p className="lp-eyebrow">
            <span className="lp-eyebrow-line" /> Platform Capabilities
          </p>
          <h2 className="lp-section-title">
            Everything you need to
            <br />
            <em>run your export business</em>
          </h2>
        </div>
        <div className={`lp-feat-grid ${featIn ? "is-visible" : ""}`}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="lp-feat-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="lp-feat-icon">{f.icon}</span>
              <h3 className="lp-feat-title">{f.title}</h3>
              <p className="lp-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER WAVE ── */}
      <div className="lp-divider">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path
            d="M0,40 Q360,80 720,40 Q1080,0 1440,40 L1440,80 L0,80 Z"
            fill="rgba(14,58,110,0.3)"
          />
        </svg>
      </div>

      {/* ── CTA ── */}
      <section className="lp-cta" ref={ctaRef}>
        <div className={`lp-cta-inner ${ctaIn ? "is-visible" : ""}`}>
          <p className="lp-eyebrow">
            <span className="lp-eyebrow-line" /> Ready to Begin
          </p>
          <h2 className="lp-cta-title">
            Log in and manage
            <br />
            <em>your business today</em>
          </h2>
          <p className="lp-cta-desc">
            All staff access is controlled through the system administrator.
            Contact your manager if you need an account.
          </p>
          <a href="/login" className="lp-btn-primary lp-btn-large">
            Go to Staff Login →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-name">Tropical Shellfish (Pvt) Ltd</span>
            <span className="lp-footer-tagline">
              Fresh &amp; Frozen Seafood Exporters · Sri Lanka
            </span>
          </div>
          <span className="lp-footer-copy">
            © {new Date().getFullYear()} All rights reserved
          </span>
        </div>
      </footer>
    </div>
  );
}
