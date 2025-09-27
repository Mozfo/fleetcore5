import { useParams } from "next/navigation";

export function useLocalizedPath() {
  const params = useParams();
  const locale = params.locale || "en";

  const localizedPath = (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `/${locale}/${cleanPath}`;
  };

  return { locale, localizedPath };
}
