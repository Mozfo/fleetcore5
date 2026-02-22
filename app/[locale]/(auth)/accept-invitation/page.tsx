"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { useUser } from "@/lib/auth/client";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import Link from "next/link";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  name: string;
  email: string;
  password: string;
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number"),
});

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const router = useRouter();
  const { localizedPath } = useLocalizedPath();
  const { user, isLoaded } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // If user is already signed in, auto-accept invitation
  useEffect(() => {
    if (!isLoaded || !user || !invitationId || isAccepting) return;
    setIsAccepting(true);

    void authClient.organization
      .acceptInvitation({ invitationId })
      .then(({ error: acceptErr }) => {
        if (acceptErr) {
          setError(acceptErr.message ?? "Failed to accept invitation");
          setIsAccepting(false);
        } else {
          router.push(localizedPath("dashboard"));
        }
      });
  }, [isLoaded, user, invitationId, isAccepting, router, localizedPath]);

  // No invitation ID — invalid link
  if (!invitationId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Invalid Invitation
          </h2>
          <p className="text-gray-600">
            This invitation link is invalid or has expired. Please contact your
            administrator for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  // Signed-in user — auto-accepting
  if (isLoaded && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-gray-600">Accepting invitation...</p>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  // Not signed in — show signup form to create account + accept invitation
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError("");

    // Step 1: Create account
    const { error: signUpError } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (signUpError) {
      const isAlreadyExists =
        signUpError.status === 422 ||
        (signUpError.message ?? "").toLowerCase().includes("already exist");

      if (isAlreadyExists) {
        setShowLoginPrompt(true);
        setError(
          "An account with this email already exists. Please sign in instead."
        );
      } else {
        setError(signUpError.message ?? "Registration failed");
      }
      setIsLoading(false);
      return;
    }

    // Step 2: Accept invitation (user is now authenticated via auto-session)
    const { error: acceptError } =
      await authClient.organization.acceptInvitation({ invitationId });

    if (acceptError) {
      setError(
        acceptError.message ?? "Failed to accept invitation. Please try again."
      );
      setIsLoading(false);
      return;
    }

    router.push(localizedPath("dashboard"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700">
          <span className="text-2xl font-bold text-white">F</span>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Join FleetCore
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Create your account to accept the invitation
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-900">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Your full name"
              className="mt-1.5 h-11"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-900"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Your email address"
              className="mt-1.5 h-11"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-900"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="mt-1.5 h-11 pr-10"
                {...register("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-4 right-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <p>{error}</p>
              {showLoginPrompt && (
                <Link
                  href={`${localizedPath("login")}?redirect_url=${encodeURIComponent(`${localizedPath("accept-invitation")}?id=${invitationId}`)}`}
                  className="mt-2 inline-block font-medium text-blue-600 underline hover:text-blue-800"
                >
                  Sign in to accept the invitation
                </Link>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 font-medium text-white hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Accept & Join
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
