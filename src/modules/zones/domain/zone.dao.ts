import { Zone } from './zone.entity.js';

/**
 * Port the application layer depends on; infrastructure provides the
 * implementation and app.module.ts binds the two via DI.
 */
export abstract class ZoneDao {
  abstract findAll(): Promise<Zone[]>;
  abstract findById(id: number): Promise<Zone | null>;
  abstract findByName(name: string): Promise<Zone | null>;
  abstract save(zone: Zone): Promise<Zone>;
}
