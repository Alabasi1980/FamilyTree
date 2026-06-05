"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { PublicSearchForm } from "@/components/search/public-search-form";

interface Props {
  heroIconUrl: string;
  brand: string;
  tagline: string;
}

// شجرة SVG ديكورية — فروع عضوية
function BranchDecor() {
  return (
    <svg
      className="pointer-events-none absolute -left-8 top-0 h-full w-72 opacity-[0.06] select-none text-primary"
      viewBox="0 0 200 600"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M100 600 C100 500 95 420 98 340 C100 260 102 200 100 120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M100 160 C115 140 145 120 170 95 C185 80 190 60 185 40" stroke="hsl(42 55% 52%)" strokeWidth="2" strokeLinecap="round" />
      <path d="M100 200 C82 178 55 160 35 140 C20 125 15 105 20 85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M99 280 C115 265 135 258 155 250" stroke="hsl(42 55% 52%)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M99 320 C85 305 68 295 50 288" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M99 400 C112 388 130 382 148 376" stroke="hsl(42 55% 52%)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="185" cy="38" r="4" fill="hsl(42 55% 52%)" opacity="0.6" />
      <circle cx="170" cy="92" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="20" cy="83" r="3.5" fill="hsl(42 55% 52%)" opacity="0.5" />
      <circle cx="155" cy="248" r="2.5" fill="currentColor" opacity="0.4" />
      <circle cx="50" cy="286" r="2.5" fill="hsl(42 55% 52%)" opacity="0.4" />
    </svg>
  );
}

// جزيئات ذهبية عائمة
function FloatingParticles() {
  const dots = [
    { cx: "75%", cy: "20%", r: 1.5, delay: 0 },
    { cx: "80%", cy: "55%", r: 1,   delay: 0.8 },
    { cx: "68%", cy: "75%", r: 2,   delay: 1.4 },
    { cx: "88%", cy: "38%", r: 1.2, delay: 0.4 },
    { cx: "60%", cy: "30%", r: 1,   delay: 1.1 },
  ];

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full opacity-30 select-none"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill="hsl(42 55% 52%)"
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
          transition={{
            duration: 3 + i * 0.5,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HeroSection({ heroIconUrl, brand, tagline }: Props) {
  // تمييز "الأصول" بلون الـ accent
  const brandParts = brand.split("الأصول");
  const hasSplit = brandParts.length > 1;

  return (
    <section className="relative isolate overflow-hidden border-b border-border/40 bg-background">
      {/* طبقات الخلفية */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_-10%,hsl(145_35%_22%/0.45),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_110%,hsl(42_55%_32%/0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,hsl(160_20%_8%/0.8)_100%)]" />

      <BranchDecor />
      <FloatingParticles />

      {/* خط مضيء سفلي */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <motion.div
        className="container relative z-10 mx-auto max-w-6xl px-4 py-20 md:py-28"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="max-w-xl">

          {/* أيقونة التطبيق */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-2xl blur-xl bg-accent/20 scale-110" />
              <div className="relative h-20 w-20 rounded-2xl border border-accent/40 shadow-2xl shadow-black/50 ring-1 ring-white/5 overflow-hidden">
                <Image
                  src={heroIconUrl}
                  alt={brand}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* نقطة "نشط" */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent/80 border border-background" />
              </span>
            </div>
          </motion.div>

          {/* العنوان الرئيسي */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl"
          >
            {hasSplit ? (
              <>
                {brandParts[0]}
                <span className="text-accent">الأصول</span>
                {brandParts[1]}
              </>
            ) : brand}
          </motion.h1>

          {/* فاصل مزخرف */}
          <motion.div variants={itemVariants} className="mt-4 flex items-center gap-3">
            <div className="h-px w-24 bg-gradient-to-r from-accent/70 to-transparent" />
            <span className="text-accent/50 text-xs">✦</span>
          </motion.div>

          {/* الوصف */}
          <motion.p
            variants={itemVariants}
            className="mt-4 text-base leading-8 text-muted-foreground md:text-lg"
          >
            {tagline}
          </motion.p>

          {/* البحث */}
          <motion.div variants={itemVariants} className="mt-8">
            <PublicSearchForm size="large" />
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
