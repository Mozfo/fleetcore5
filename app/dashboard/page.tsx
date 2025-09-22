import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            FleetCore Dashboard
          </h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="overflow-hidden rounded-lg bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-medium">Welcome back!</h2>
          <p className="text-gray-600">
            Logged in as: {user?.emailAddresses[0].emailAddress}
          </p>
        </div>
      </main>
    </div>
  );
}
