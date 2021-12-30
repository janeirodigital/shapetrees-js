import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import * as log from "loglevel";
import * as ShExParser from "@shexjs/parser";
import * as ShExJ from 'shexj';
type ShExSchema = ShExJ.Schema;

export async function buildSchemaCache(schemasToCache: Array<string>): Promise<Map<string, ShExSchema>> /* throws MalformedURLException, ShapeTreeException */ {
    let schemaCache: Map<string, ShExSchema> = new Map();
    log.info("Building schema cache");
    for (const schemaUrl of schemasToCache) {
        log.debug("Caching schema {}", schemaUrl);
        let shexShapeSchema: DocumentResponse = await DocumentLoaderManager.getLoader().loadExternalDocument(new URL(schemaUrl));
        if (!shexShapeSchema.isExists() || shexShapeSchema.getBody() === null) {
            throw new Error("Schema at <" + schemaUrl + "> doesn't exist or is empty");
        }

        let shapeBody: string = shexShapeSchema.getBody()!;
        const shexCParser = ShExParser.construct(schemaUrl, {});
        try {
            const schema: ShExSchema = shexCParser.parse(shapeBody);
            schemaCache.set(schemaUrl, schema);
        } catch (ex: any) {
            log.error("Error parsing schema {}", schemaUrl);
            log.error("Exception:", ex);
        }
    }
    return schemaCache;
}
