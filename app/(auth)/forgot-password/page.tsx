"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});
type FormData = z.infer<typeof formSchema>;
export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isLoaded, signIn } = useSignIn();

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
          Check your email
        </h2>
        <p className="mb-6 text-sm text-blue-600">
          We sent instructions to {getValues("email")}
        </p>
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-[#1C1917]"
        >
          Return to login
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
        href="/login"
        className="mb-8 inline-flex items-center text-sm text-blue-600 hover:text-[#1C1917]"
      >
        <ArrowLeft className="mr-2 h-3 w-3" />
        Back
      </Link>

      <h1 className="mb-2 text-xl font-medium text-[#1C1917]">
        Reset password
      </h1>
      <p className="mb-6 text-sm text-blue-600">
        Enter your email to receive reset instructions
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="you@company.com"
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
          {isLoading ? "Sending..." : "Send instructions"}
        </Button>
      </form>
    </motion.div>
  );
}
