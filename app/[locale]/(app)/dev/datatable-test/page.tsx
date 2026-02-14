import { VehiclesTable, type Vehicle } from "./_components/vehicles-table";

const ALL_VEHICLES: Vehicle[] = [
  {
    id: "1",
    plate: "AA-123-BB",
    brand: "Toyota",
    model: "Hilux",
    status: "active",
    mileage: 45200,
  },
  {
    id: "2",
    plate: "CC-456-DD",
    brand: "Ford",
    model: "Ranger",
    status: "active",
    mileage: 32100,
  },
  {
    id: "3",
    plate: "EE-789-FF",
    brand: "Hyundai",
    model: "Tucson",
    status: "maintenance",
    mileage: 78500,
  },
  {
    id: "4",
    plate: "GG-012-HH",
    brand: "Renault",
    model: "Kangoo",
    status: "idle",
    mileage: 120300,
  },
  {
    id: "5",
    plate: "II-345-JJ",
    brand: "Peugeot",
    model: "Partner",
    status: "active",
    mileage: 56700,
  },
  {
    id: "6",
    plate: "KK-678-LL",
    brand: "Toyota",
    model: "Corolla",
    status: "active",
    mileage: 23400,
  },
  {
    id: "7",
    plate: "MM-901-NN",
    brand: "Ford",
    model: "Transit",
    status: "maintenance",
    mileage: 98200,
  },
  {
    id: "8",
    plate: "OO-234-PP",
    brand: "Hyundai",
    model: "Santa Fe",
    status: "active",
    mileage: 41800,
  },
  {
    id: "9",
    plate: "QQ-567-RR",
    brand: "Renault",
    model: "Clio",
    status: "idle",
    mileage: 67900,
  },
  {
    id: "10",
    plate: "SS-890-TT",
    brand: "Peugeot",
    model: "308",
    status: "active",
    mileage: 15600,
  },
  {
    id: "11",
    plate: "UU-123-VV",
    brand: "Toyota",
    model: "Land Cruiser",
    status: "maintenance",
    mileage: 156000,
  },
  {
    id: "12",
    plate: "WW-456-XX",
    brand: "Ford",
    model: "Focus",
    status: "active",
    mileage: 34500,
  },
  {
    id: "13",
    plate: "YY-789-ZZ",
    brand: "Hyundai",
    model: "i20",
    status: "idle",
    mileage: 89100,
  },
  {
    id: "14",
    plate: "AB-012-CD",
    brand: "Renault",
    model: "Master",
    status: "active",
    mileage: 72400,
  },
  {
    id: "15",
    plate: "EF-345-GH",
    brand: "Peugeot",
    model: "Expert",
    status: "active",
    mileage: 48300,
  },
  {
    id: "16",
    plate: "IJ-678-KL",
    brand: "Toyota",
    model: "Yaris",
    status: "maintenance",
    mileage: 29700,
  },
  {
    id: "17",
    plate: "MN-901-OP",
    brand: "Ford",
    model: "Fiesta",
    status: "idle",
    mileage: 112500,
  },
  {
    id: "18",
    plate: "QR-234-ST",
    brand: "Hyundai",
    model: "Kona",
    status: "active",
    mileage: 18900,
  },
  {
    id: "19",
    plate: "UV-567-WX",
    brand: "Renault",
    model: "Trafic",
    status: "active",
    mileage: 63200,
  },
  {
    id: "20",
    plate: "YZ-890-AB",
    brand: "Peugeot",
    model: "Rifter",
    status: "maintenance",
    mileage: 87600,
  },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DataTableTestPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.max(1, Number(params.perPage) || 5);

  let data = [...ALL_VEHICLES];

  // Filter: status (comma-separated from nuqs parseAsArrayOf)
  const statusFilter = typeof params.status === "string" ? params.status : "";
  if (statusFilter) {
    const values = statusFilter.split(",").filter(Boolean);
    if (values.length > 0) {
      data = data.filter((v) => values.includes(v.status));
    }
  }

  // Filter: brand (comma-separated from nuqs parseAsArrayOf)
  const brandFilter = typeof params.brand === "string" ? params.brand : "";
  if (brandFilter) {
    const values = brandFilter.split(",").filter(Boolean);
    if (values.length > 0) {
      data = data.filter((v) => values.includes(v.brand));
    }
  }

  // Filter: plate text search (string from nuqs parseAsString)
  const plateSearch = typeof params.plate === "string" ? params.plate : "";
  if (plateSearch) {
    const q = plateSearch.toLowerCase();
    data = data.filter((v) => v.plate.toLowerCase().includes(q));
  }

  // Sort
  const sortParam = typeof params.sort === "string" ? params.sort : "";
  if (sortParam) {
    try {
      const sorting = JSON.parse(sortParam) as { id: string; desc: boolean }[];
      if (Array.isArray(sorting) && sorting[0]) {
        const { id, desc } = sorting[0];
        data.sort((a, b) => {
          const av = a[id as keyof Vehicle];
          const bv = b[id as keyof Vehicle];
          if (typeof av === "number" && typeof bv === "number") {
            return desc ? bv - av : av - bv;
          }
          return desc
            ? String(bv).localeCompare(String(av))
            : String(av).localeCompare(String(bv));
        });
      }
    } catch {
      // Invalid sort param, ignore
    }
  }

  // Paginate
  const totalRows = data.length;
  const pageCount = Math.ceil(totalRows / perPage);
  const paged = data.slice((page - 1) * perPage, page * perPage);

  return (
    <div
      className="flex flex-col gap-4"
      style={{ height: "var(--content-full-height)" }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">DataTable Test</h1>
        <p className="text-muted-foreground text-sm">
          {totalRows} vehicles — Page {page} of {Math.max(1, pageCount)}
        </p>
      </div>
      <VehiclesTable data={paged} pageCount={pageCount} />
    </div>
  );
}
