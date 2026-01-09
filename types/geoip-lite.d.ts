/**
 * Type declarations for geoip-lite
 *
 * @module types/geoip-lite
 */

declare module "geoip-lite" {
  interface GeoLocation {
    country: string;
    region: string;
    city: string;
    ll: [number, number];
    metro: number;
    area: number;
    eu: string;
    timezone: string;
    range: [number, number];
  }

  function lookup(ip: string): GeoLocation | null;

  export { lookup, GeoLocation };
}
