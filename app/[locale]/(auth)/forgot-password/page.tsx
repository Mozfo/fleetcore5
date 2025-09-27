"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = {
  email: string;
};

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { localizedPath } = useLocalizedPath();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isLoaded, signIn } = useSignIn();

  const formSchema = z.object({
    email: z.string().email(t("forgotPassword.errors.invalidEmail")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const onSubmit = async (data: FormData) => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      // Security: always show success to prevent email enumeration
      // We don't use the error, just show success for security
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto w-full max-w-sm text-center"
      >
        <h2 className="mb-2 text-lg font-medium text-[#1C1917]">
          {t("forgotPassword.checkEmail")}
        </h2>
        <p className="mb-6 text-sm text-blue-600">
          {t("forgotPassword.emailSent")} {getValues("email")}
        </p>
        <Link
          href={localizedPath("login")}
          className="text-sm text-blue-600 hover:text-[#1C1917]"
        >
          {t("forgotPassword.returnToLogin")}
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-sm"
    >
      <Link
        href={localizedPath("login")}
        className="mb-8 inline-flex items-center text-sm text-blue-600 hover:text-[#1C1917]"
      >
        <ArrowLeft className="mr-2 h-3 w-3" />
        {t("forgotPassword.back")}
      </Link>

      <h1 className="mb-2 text-xl font-medium text-[#1C1917]">
        {t("forgotPassword.title")}
      </h1>
      <p className="mb-6 text-sm text-blue-600">
        {t("forgotPassword.subtitle")}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder")}
            className="h-10 border-[#E8DFD3] focus:border-blue-600 focus:ring-0"
            {...register("email")}
            disabled={isLoading}
            autoFocus
          />
          {errors.email && (
            <p className="mt-1 text-xs text-purple-700">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-gray-900 text-white hover:bg-[#2D4739] dark:bg-gray-700"
        >
          {isLoading
            ? `${t("forgotPassword.sending")}...`
            : t("forgotPassword.sendInstructions")}
        </Button>
      </form>
    </motion.div>
  );
}
