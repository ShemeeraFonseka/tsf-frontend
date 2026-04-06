import React, { useEffect, useRef, useState } from "react";
import "./Home.css";

const FEATURES = [
  {
    icon: "🐚",
    title: "Fresh Seafood Daily",
    desc: "Sourced directly from local fishermen and aquaculture farms. Every product arrives at peak freshness, handled with care from catch to delivery.",
  },
  {
    icon: "❄️",
    title: "Live, Fresh & Frozen",
    desc: "A complete range across all conditions — live shellfish, fresh-chilled fillets, and IQF frozen products packed to international export standards.",
  },
  {
    icon: "🚢",
    title: "Global Export Ready",
    desc: "We ship to buyers worldwide via sea and air freight, with full documentation, competitive FOB & CNF pricing, and reliable logistics.",
  },
  {
    icon: "🦞",
    title: "Wide Species Range",
    desc: "From premium tuna loins and exotic shellfish to everyday fish varieties — crustaceans, molluscs, cephalopods and finfish all in one place.",
  },
  {
    icon: "📦",
    title: "Bulk & Retail Packs",
    desc: "Whether you need bulk wholesale quantities or retail-ready packaging, we accommodate orders of all sizes with custom specifications.",
  },
  {
    icon: "✅",
    title: "Quality Assured",
    desc: "All products are processed in our certified facility with full traceability, temperature-controlled storage, and quality inspection at every step.",
  },
];

const PRODUCTS = [
  { emoji: "🦞", name: "Scampi" },
  { emoji: "🦀", name: "Mud Crab" },
  { emoji: "🦐", name: "Tiger Prawn" },
  { emoji: "🐟", name: "Tuna Loin" },
  { emoji: "🦪", name: "Oysters" },
  { emoji: "🐚", name: "Clams" },
  { emoji: "🐙", name: "Octopus" },
  { emoji: "🦑", name: "Cuttlefish" },
  { emoji: "🐡", name: "Barramundi" },
];

const SPECIES_CHIPS = [
  "🦪 Oysters",
  "🐚 Clams",
  "🦪 Mussels",
  "🦀 Crabs",
  "🦐 Prawns",
  "🦞 Scampi",
  "🐙 Octopus",
  "🦑 Cuttlefish",
  "🐟 Tuna",
  "🐠 Barramundi",
  "🦈 Seer Fish",
  "🦐 Lobster",
  "🐟 Salmon",
  "🐡 Snapper",
];

const STATS = [
  { value: "50+", label: "Species", sub: "Fresh, frozen & live" },
  { value: "LK", label: "Sri Lanka", sub: "Island-sourced seafood" },
  { value: "100%", label: "Quality", sub: "Inspected every batch" },
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

export default function Home() {
  const canvasRef = useRef(null);
  const [heroRef, heroIn] = useInView(0.05);
  const [statsRef, statsIn] = useInView();
  const [productsRef, productsIn] = useInView();
  const [featRef, featIn] = useInView();
  const [ctaRef, ctaIn] = useInView();
  const [staffOpen, setStaffOpen] = useState(false);

  /* ── ocean wave canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf,
      t = 0;
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
      t += 0.3;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* close staff dropdown on outside click */
  useEffect(() => {
    if (!staffOpen) return;
    const close = (e) => {
      if (!e.target.closest(".lp-nav-staff-wrap")) setStaffOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [staffOpen]);

  return (
    <div className="lp-root">
      <canvas ref={canvasRef} className="lp-canvas" />
      <div className="lp-grain" />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle
              cx="16"
              cy="16"
              r="15"
              stroke="#00d4ff"
              strokeWidth="1.2"
              opacity="0.5"
            />
            <path
              d="M8 20 Q12 10 16 14 Q20 18 24 10"
              stroke="#00d4ff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="16" cy="14" r="2" fill="#00d4ff" opacity="0.8" />
          </svg>
          <div>
            <span className="lp-nav-name">Tropical Shellfish</span>
            <span className="lp-nav-sub">
              Fresh &amp; Frozen Seafood · Sri Lanka
            </span>
          </div>
        </div>

        <div className="lp-nav-right">
          <a href="/customer/catalogue" className="lp-nav-link">
            Catalogue
          </a>
          <a href="/customer/login" className="lp-nav-btn">
            Order Now →
          </a>
          {/* Staff access — intentionally hidden/minimal */}
          <div className="lp-nav-staff-wrap">
            <button
              className="lp-nav-gear"
              onClick={() => setStaffOpen((p) => !p)}
              aria-label="Staff login"
            >
              ⚙️
            </button>
            {staffOpen && (
              <div className="lp-staff-dropdown">
                <a href="/login" className="lp-staff-item">
                  🔒 Staff Login
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className={`lp-hero-content ${heroIn ? "is-visible" : ""}`}>
          <p className="lp-eyebrow">
            <span className="lp-eyebrow-line" /> Sri Lanka's Premier Seafood
            Exporter
          </p>
          <h1 className="lp-hero-title">
            The Finest Seafood,
            <br />
            <em>Delivered Fresh</em>
            <br />
            To Your Door.
          </h1>
          <p className="lp-hero-desc">
            Tropical Shellfish (Pvt) Ltd supplies premium fresh, frozen and live
            seafood to buyers locally and worldwide. Browse our full catalogue
            and place your order directly online.
          </p>
          <div className="lp-hero-actions">
            <a href="/customer/catalogue" className="lp-btn-primary">
              Browse Catalogue
            </a>
            <a href="/customer/login" className="lp-btn-secondary">
              Place an Order →
            </a>
          </div>
        </div>

        <div className={`lp-hero-visual ${heroIn ? "is-visible" : ""}`}>
          <div className="lp-shell-grid">
            {PRODUCTS.map((p, i) => (
              <div
                key={i}
                className="lp-shell-cell"
                style={{ animationDelay: `${i * 0.1}s` }}
                title={p.name}
              >
                <span>{p.emoji}</span>
                <small>{p.name}</small>
              </div>
            ))}
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

      {/* ── PRODUCTS STRIP ── */}
      <section className="lp-products-strip" ref={productsRef}>
        <div className={`lp-strip-inner ${productsIn ? "is-visible" : ""}`}>
          <p
            className="lp-eyebrow"
            style={{ justifyContent: "center", marginBottom: "10px" }}
          >
            <span className="lp-eyebrow-line" /> What We Offer
          </p>
          <h2
            className="lp-section-title"
            style={{ textAlign: "center", marginBottom: "32px" }}
          >
            A complete range of <em>premium seafood</em>
          </h2>
          <div className="lp-species-chips">
            {SPECIES_CHIPS.map((s, i) => (
              <span key={i} className="lp-chip">
                {s}
              </span>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <a href="/customer/catalogue" className="lp-btn-primary">
              View Full Catalogue →
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features" ref={featRef}>
        <div className={`lp-section-header ${featIn ? "is-visible" : ""}`}>
          <p className="lp-eyebrow">
            <span className="lp-eyebrow-line" /> Why Choose Us
          </p>
          <h2 className="lp-section-title">
            Quality you can trust,
            <br />
            <em>from sea to table</em>
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

      {/* ── DIVIDER ── */}
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
            <span className="lp-eyebrow-line" /> Ready to Order?
          </p>
          <h2 className="lp-cta-title">
            Create an account and
            <br />
            <em>start ordering today</em>
          </h2>
          <p className="lp-cta-desc">
            Register for free, browse our full product catalogue with live
            pricing, and place orders directly. We'll confirm your order and
            keep you updated every step of the way.
          </p>
          <div className="lp-cta-actions">
            <a href="/customer/login" className="lp-btn-primary lp-btn-large">
              Create Account / Sign In
            </a>
            <a href="/customer/catalogue" className="lp-btn-ghost">
              Browse without signing in
            </a>
          </div>
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
          <div className="lp-footer-links">
            <a href="/customer/catalogue" className="lp-footer-link">
              Catalogue
            </a>
            <a href="/customer/login" className="lp-footer-link">
              Order Online
            </a>
          </div>
          <span className="lp-footer-copy">
            © {new Date().getFullYear()} All rights reserved
          </span>
        </div>
      </footer>
    </div>
  );
}
