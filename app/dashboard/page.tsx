import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">FleetCore Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-2">Welcome back!</h2>
          <p className="text-gray-600">Logged in as: {user?.emailAddresses[0].emailAddress}</p>
        </div>
      </main>
    </div>
  );
}
