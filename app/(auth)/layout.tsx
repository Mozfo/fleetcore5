"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Left side - Static hero with subtle parallax */}
      <div className="relative hidden overflow-hidden bg-gray-100 lg:flex lg:w-1/2 dark:bg-gray-900">
        {/* Static background with parallax effect */}
        <motion.div
          className="absolute inset-0"
          animate={{
            x: mousePosition.x,
            y: mousePosition.y,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80)`,
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/60 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
                <span className="text-lg font-bold text-white">F</span>
              </div>
              <h1 className="text-2xl font-semibold text-white">FleetCore</h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-600">99.9%</div>
                <div className="mt-1 text-xs text-white/60">Uptime SLA</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-600">500+</div>
                <div className="mt-1 text-xs text-white/60">
                  Enterprise Clients
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-600">50k+</div>
                <div className="mt-1 text-xs text-white/60">
                  Vehicles Managed
                </div>
              </motion.div>
            </div>

            {/* Single testimonial */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="border-l-2 border-purple-600/30 pl-6"
            >
              <p className="mb-3 text-sm leading-relaxed text-white/80 italic">
                &quot;FleetCore reduced our operational overhead by 40% in the
                first quarter.&quot;
              </p>
              <div>
                <p className="text-sm font-medium text-white">Michael Chen</p>
                <p className="text-xs text-purple-600">
                  CTO, LogiNext Solutions
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
