import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">FleetCore</h1>
          <p className="mt-2 text-slate-600">Create your account</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl"
            }
          }}
        />
      </div>
    </div>
  );
}
