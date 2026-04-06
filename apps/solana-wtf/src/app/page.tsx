import { getAllTerms, getCategories, CATEGORY_LABELS } from "@/lib/glossary";
import HeroSection from "./hero-section";
import HomeSections from "./home-sections";
import CyberNav from "@/components/cyber-nav";
import CyberFooter from "@/components/cyber-footer";

export default function Home() {
  const totalTerms = getAllTerms().length;
  const categories = getCategories();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-0)" }}>
      {/* Ambient background — cyberpunk orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute animate-pulse-glow"
          style={{
            width: 600,
            height: 600,
            background: "#00FFFF",
            opacity: 0.03,
            filter: "blur(120px)",
            top: -200,
            left: "20%",
          }}
        />
        <div
          className="absolute animate-pulse-glow"
          style={{
            width: 500,
            height: 500,
            background: "#BD00FF",
            opacity: 0.03,
            filter: "blur(120px)",
            top: -100,
            right: "10%",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute animate-pulse-glow"
          style={{
            width: 350,
            height: 350,
            background: "#FF003F",
            opacity: 0.03,
            filter: "blur(120px)",
            bottom: "20%",
            left: "5%",
            animationDelay: "2.5s",
          }}
        />
      </div>

      {/* Nav */}
      <CyberNav active="home" />

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-8 pt-6 sm:pt-8 pb-10 sm:pb-12 max-w-7xl mx-auto">
        <HeroSection totalTerms={totalTerms} totalCategories={categories.length} />
      </section>

      {/* Categories + Games — client component for locale */}
      <HomeSections categories={categories} categoryLabels={CATEGORY_LABELS} />

      {/* Footer */}
      <CyberFooter />
    </div>
  );
}
