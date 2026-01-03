"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

export function DownloadCTA() {
  const { t } = useTranslation("common");

  return (
    <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Download className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {t("solopreneur.cta.title")}
          </h2>

          {/* Subtitle */}
          <p className="mb-8 text-lg text-white/80">
            {t("solopreneur.cta.subtitle")}
          </p>

          {/* Store Buttons */}
          <div className="mb-10 flex flex-wrap justify-center gap-4">
            {/* App Store */}
            <a
              href="#"
              className="group flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-gray-900 transition-all hover:scale-105 hover:shadow-xl"
            >
              <svg
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-500">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>

            {/* Google Play */}
            <a
              href="#"
              className="group flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-gray-900 transition-all hover:scale-105 hover:shadow-xl"
            >
              <svg
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-500">Get it on</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block"
          >
            <div className="rounded-2xl bg-white p-4">
              {/* QR Code Placeholder */}
              <div className="mb-2 grid h-32 w-32 grid-cols-8 gap-0.5">
                {[...Array(64)].map((_, i) => (
                  <div
                    key={i}
                    className={`${
                      Math.random() > 0.5 ? "bg-gray-900" : "bg-white"
                    } ${
                      // Corners for QR positioning squares
                      (i < 3 && (i % 8 < 3 || i % 8 > 4)) ||
                      (i >= 56 && i % 8 < 3) ||
                      (i < 24 && i % 8 > 4)
                        ? "bg-gray-900"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {t("solopreneur.cta.scanQR")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
