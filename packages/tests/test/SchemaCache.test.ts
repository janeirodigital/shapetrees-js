// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { SchemaCache } from '@shapetrees/core/src/SchemaCache';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';
import * as ShExParser from '@shexjs/parser';
import * as ShExJ from 'shexj';
type ShExSchema = ShExJ.Schema;
import * as log from 'loglevel';

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["schemas/project-shex"], "GET", "/static/shex/project", null)
]);

beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

beforeAll(() => {
  SchemaCache.unInitializeCache();
});

// testFailToOperateOnUninitializedCache
test("Fail to operate on uninitialized cache", () => {
  expect(SchemaCache.isInitialized()).toEqual(false);

  // containsSchema
  expect(() => {
    SchemaCache.containsSchema(new URL("http://schema.example"));
  }).toThrow(/Cache is not initialized/);

  // getSchema
  expect(() => {
      SchemaCache.getSchema(new URL("http://schema.example"));
  }).toThrow(/Cache is not initialized/);

  // putSchema
  expect(() => {
      SchemaCache.putSchema(new URL("http://schema.example"), null!);
  }).toThrow(/Cache is not initialized/);

  // clearSchema
  expect(() => {
      SchemaCache.clearCache();
  }).toThrow(/Cache is not initialized/);
});

// testInitializeCache
test("Initialize cache", () => {
  SchemaCache.initializeCache();
  expect(SchemaCache.isInitialized()).toEqual(true);
  expect(SchemaCache.containsSchema(new URL("http://schema.example"))).toEqual(false);
});

// testPreloadCache
test("Preload cache", async () => {
  let schemas: Map<string, ShExSchema> = await buildSchemaCache([server.urlFor("/static/shex/project").toString()]);
  SchemaCache.initializeCache(schemas);
  expect(SchemaCache.containsSchema(server.urlFor("/static/shex/project"))).toEqual(true);
});

// // testClearPutGet
// test("Clear put get", async () => {
//   SchemaCache.clearCache();
//   expect(SchemaCache.getSchema(server.urlFor("/static/shex/project"))).toBeNull();
//   let schemas: Map<string, ShExSchema> = await buildSchemaCache([server.urlFor("/static/shex/project").toString()]);
//   let firstEntry: Map.Entry<URL, ShExSchema> = schemas.entrySet().stream().findFirst().orElse(null);
//   if (firstEntry === null)
//     return;
//   SchemaCache.putSchema(firstEntry.getKey(), firstEntry.getValue());
//   expect(SchemaCache.getSchema(server.urlFor("/static/shex/project"))).not.toBeNull();
// });
//
// // testNullOnCacheContains
// test("Null on cache contains", async () => {
//   SchemaCache.clearCache();
//   expect(SchemaCache.getSchema(server.urlFor("/static/shex/project"))).toBeNull();
//   let schemas: Map<string, ShExSchema> = await buildSchemaCache([server.urlFor("/static/shex/project").toString()]);
//   let firstEntry: Map.Entry<URL, ShExSchema> = schemas.entrySet().stream().findFirst().orElse(null);
//   if (firstEntry === null)
//     return;
//   SchemaCache.putSchema(firstEntry.getKey(), firstEntry.getValue());
//   expect(SchemaCache.getSchema(server.urlFor("/static/shex/project"))).not.toBeNull();
// });

async function buildSchemaCache(schemasToCache: Array<string>): Promise<Map<string, ShExSchema>> /* throws MalformedURLException, ShapeTreeException */ {
  let schemaCache: Map<string, ShExSchema> = new Map();
  log.info("Building schema cache");
  for (const schemaUrl of schemasToCache) {
    log.debug("Caching schema {}", schemaUrl);
    let shexShapeSchema: DocumentResponse = await DocumentLoaderManager.getLoader().loadExternalDocument(new URL(schemaUrl));
    if (!shexShapeSchema.isExists() || shexShapeSchema.getBody() === null) {
      log.warn("Schema at {} doesn't exist or is empty", schemaUrl);
      continue;
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
