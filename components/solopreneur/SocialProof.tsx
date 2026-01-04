"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Star, Quote } from "lucide-react";

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (value >= 1000000) {
      return `€${(latest / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(latest / 1000).toFixed(0)}K`;
    }
    return `${Math.round(latest)}${suffix}`;
  });

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
    });
    return controls.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
}

export function SocialProof() {
  const { t } = useTranslation("common");

  const stats = [
    { value: 15000, label: t("solopreneur.social.stats.drivers") },
    { value: 12500000, label: t("solopreneur.social.stats.tracked") },
    { value: 2400000, label: t("solopreneur.social.stats.saved") },
  ];

  const testimonials = t("solopreneur.social.testimonials", {
    returnObjects: true,
  }) as Array<{ quote: string; author: string; role: string }>;

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-24 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {t("solopreneur.social.title")}
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                <AnimatedCounter value={stat.value} suffix="+" />
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="relative h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 h-8 w-8 text-gray-100 dark:text-gray-800" />

                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
