// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { SchemaCache } from '@shapetrees/core/src/SchemaCache';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';
import { buildSchemaCache } from "../src/buildSchemaCache";
import * as ShExJ from 'shexj';
type ShExSchema = ShExJ.Schema;

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
