import { Injectable, Logger } from '@nestjs/common';
import {
  GeocodingPort,
  GeocodingResult,
} from '../../application/ports/geocoding.port.js';

@Injectable()
export class NominatimGeocodingAdapter implements GeocodingPort {
  private readonly logger = new Logger(NominatimGeocodingAdapter.name);

  async geocode(
    address: string,
    city: string,
    department?: string,
  ): Promise<GeocodingResult | null> {
    try {
      const queryParts = [address, city, department].filter(
        (part): part is string => Boolean(part && part.trim().length > 0),
      );
      const query = queryParts.join(', ');

      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'RiwiCommerceBackend/1.0 (contact@riwicommerce.local)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(
          `Nominatim geocoding failed with status: ${response.status}`,
        );
        return null;
      }

      const results = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
      }>;

      if (!Array.isArray(results) || results.length === 0) {
        return null;
      }

      const first = results[0];
      if (!first.lat || !first.lon) {
        return null;
      }

      const lat = Number.parseFloat(first.lat);
      const lng = Number.parseFloat(first.lon);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return null;
      }

      return { lat, lng };
    } catch (error) {
      this.logger.warn(
        `Nominatim geocoding request encountered an error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}

