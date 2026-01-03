"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Car } from "lucide-react";

export function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-gray-900 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">FleetCore</span>
            </div>
            <p className="text-gray-400">
              The Operating System for Modern Fleet Management
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-4 font-semibold">
              {t("homepage.footer.product")}
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/features" className="hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-white">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 font-semibold">
              {t("homepage.footer.company")}
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mb-4 font-semibold">{t("homepage.footer.legal")}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>{t("homepage.footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
