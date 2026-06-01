import type { Metadata } from "next"
import LandingNav from '@/components/landing/landing-nav';
import HeroSection from '@/components/landing/hero-section';
import LogosMarquee from '@/components/landing/logos-marquee';
import BentoFeatures from '@/components/landing/bento-features';
import MetricsSection from '@/components/landing/metrics-section';
import WorkflowSection from '@/components/landing/workflow-section';
import TestimonialSection from '@/components/landing/testimonial-section';
import CtaSection from '@/components/landing/cta-section';
import LandingFooter from '@/components/landing/landing-footer';

export const metadata: Metadata = {
    title: "Deftra ERP — Kurumsal Kaynak Planlama Sistemi",
    description:
        "Deftra ile işletmenizi dijital dönüşüme taşıyın. e-Fatura, e-Arşiv, stok yönetimi, CRM, muhasebe ve daha fazlası tek platformda.",
    keywords: ["ERP", "e-Fatura", "e-Arşiv", "Kurumsal Kaynak Planlama", "İşletme Yönetimi", "Muhasebe", "Stok Takibi"],
    openGraph: {
        title: "Deftra ERP — Kurumsal Kaynak Planlama Sistemi",
        description:
            "e-Fatura, e-Arşiv, stok yönetimi, CRM ve muhasebe modülleri ile işletmenizi yönetin.",
        type: "website",
        locale: "tr_TR",
        siteName: "Deftra ERP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Deftra ERP — Enterprise Resource Planning",
        description:
            "Comprehensive ERP system with e-Invoice, inventory, CRM, and accounting modules.",
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#050505] font-inter text-white antialiased selection:bg-indigo-500/30 dark">
      <BackgroundEffects />
      <LandingNav />
      <main className="relative z-10 flex flex-col gap-24 sm:gap-32 pb-32">
        <HeroSection />
        <LogosMarquee />
        <BentoFeatures />
        <MetricsSection />
        <WorkflowSection />
        <TestimonialSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}

function BackgroundEffects() {
  return (
    <>
      {/* Dynamic ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 40%)',
        }}
      />
      {/* Noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Fine grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
    </>
  );
}
