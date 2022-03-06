// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import * as ShExJ from 'shexj';
type ShexSchema = ShExJ.Schema;
import * as log from 'loglevel';

/**
 * Optional, static cache for pre-compiled ShEx schemas
 */
export class SchemaCache {

  private constructor() {
  }

   public static readonly CACHE_IS_NOT_INITIALIZED: string = "Cache is not initialized";

   private static cache: Map<string, ShexSchema> | null = null;

  public static initializeCache(): void;
  public static initializeCache(existingCache: Map<string, ShexSchema>): void;

  public static initializeCache(existingCache?: Map<string, ShexSchema>): void {
    if (existingCache instanceof Map) {
      SchemaCache.cache = existingCache;
    } else {
      SchemaCache.cache = new Map<string, ShexSchema>();
    }
  }

  public static isInitialized(): boolean {
    let initialized: boolean = SchemaCache.cache != null;
    log.debug(`Cache initialized set to ${initialized}`);
    return initialized;
  }

  public static containsSchema(schemaUrl: URL): boolean /* throws ShapeTreeException */ {
    log.debug("Determining if cache contains schema {}", schemaUrl);
    if (SchemaCache.cache === null) {
      throw new ShapeTreeException(500, SchemaCache.CACHE_IS_NOT_INITIALIZED);
    }
    return SchemaCache.cache.has(schemaUrl.href);
  }

  public static getSchema(schemaUrl: URL): ShexSchema /* throws ShapeTreeException */ {
    log.debug("Getting schema {}", schemaUrl);
    if (SchemaCache.cache === null) {
      throw new ShapeTreeException(500, SchemaCache.CACHE_IS_NOT_INITIALIZED);
    }
    return SchemaCache.cache.get(schemaUrl.href)!;
  }

  public static putSchema(schemaUrl: URL, schema: ShexSchema): void /* throws ShapeTreeException */ {
    log.debug("Caching schema {}", schemaUrl.toString());
    if (SchemaCache.cache === null) {
      throw new ShapeTreeException(500, SchemaCache.CACHE_IS_NOT_INITIALIZED);
    }
    SchemaCache.cache.set(schemaUrl.href, schema);
  }

  public static clearCache(): void /* throws ShapeTreeException */ {
    if (SchemaCache.cache === null) {
      throw new ShapeTreeException(500, SchemaCache.CACHE_IS_NOT_INITIALIZED);
    }
    SchemaCache.cache.clear();
  }

  public static unInitializeCache(): void /* throws ShapeTreeException */ {
    if (SchemaCache.cache != null) {
      SchemaCache.cache.clear();
    }
    this.cache = null;
  }
}
