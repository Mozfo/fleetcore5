import { useParams } from "next/navigation";

export function useLocalizedPath() {
  const params = useParams();
  // Ensure locale is always a string (handle string[] case from Next.js)
  const rawLocale = params.locale;
  const locale: string = Array.isArray(rawLocale)
    ? rawLocale[0]
    : rawLocale || "en";

  const localizedPath = (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `/${locale}/${cleanPath}`;
  };

  return { locale, localizedPath };
}
