"use client";

interface LeadStatsProps {
  stats: {
    total: number;
    pending: number;
    contacted: number;
    qualified: number;
    accepted: number;
    refused: number;
  };
}

export default function LeadStats({ stats }: LeadStatsProps) {
  const cards = [
    {
      label: "Total",
      value: stats.total,
      color: "text-gray-900 dark:text-white",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Contacted",
      value: stats.contacted,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Qualified",
      value: stats.qualified,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Accepted",
      value: stats.accepted,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Refused",
      value: stats.refused,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
