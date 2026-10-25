export interface GeocodingResult {
  lat: number;
  lng: number;
}

export abstract class GeocodingPort {
  abstract geocode(
    address: string,
    city: string,
    department?: string,
  ): Promise<GeocodingResult | null>;
}
