// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { SchemaCache } from '@shapetrees/core/src/SchemaCache';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';
import { toUrl } from './fixtures/MockWebServerHelper/toUrl';

dispatcher: RequestMatchingFixtureDispatcher = null;
httpExternalDocumentLoader: HttpExternalDocumentLoader;

httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

beforeAll(() => {
  dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["schemas/project-shex"], "GET", "/static/shex/project", null)
  ]);
  SchemaCache.unInitializeCache();
});

// testFailToOperateOnUninitializedCache
test("Fail to operate on uninitialized cache", () => {
  expect(SchemaCache.isInitialized()).toEqual(false);
  // containsSchema
  let containsException: Throwable = expect(async () => await SchemaCache.containsSchema(new URL("http://schema.example"))).rejects.toBeInstanceOf(ShapeTreeException);
  expect(SchemaCache.CACHE_IS_NOT_INITIALIZED).toEqual(containsException.getMessage());
  // getSchema
  let getException: Throwable = expect(async () => await SchemaCache.getSchema(new URL("http://schema.example"))).rejects.toBeInstanceOf(ShapeTreeException);
  expect(SchemaCache.CACHE_IS_NOT_INITIALIZED).toEqual(getException.getMessage());
  // putSchema
  let putException: Throwable = expect(async () => await SchemaCache.putSchema(new URL("http://schema.example"), null)).rejects.toBeInstanceOf(ShapeTreeException);
  expect(SchemaCache.CACHE_IS_NOT_INITIALIZED).toEqual(putException.getMessage());
  // clearSchema
  let clearException: Throwable = expect(async () => await SchemaCache.clearCache()).rejects.toBeInstanceOf(ShapeTreeException);
  expect(SchemaCache.CACHE_IS_NOT_INITIALIZED).toEqual(clearException.getMessage());
});

// testInitializeCache
test("Initialize cache", () => {
  SchemaCache.initializeCache();
  expect(SchemaCache.isInitialized()).toEqual(true);
  expect(SchemaCache.containsSchema(new URL("http://schema.example"))).toEqual(false);
});

// testPreloadCache
test("Preload cache", () => {
  const mockServer = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let schemas: Map<string, ShexSchema> = buildSchemaCache([toUrl(server, "/static/shex/project").toString()]);
  SchemaCache.initializeCache(schemas);
  expect(SchemaCache.containsSchema(toUrl(server, "/static/shex/project"))).toEqual(true);
});

// testClearPutGet
test("Clear put get", () => {
  const mockServer = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  SchemaCache.clearCache();
  expect(SchemaCache.getSchema(toUrl(server, "/static/shex/project"))).toBeNull();
  let schemas: Map<string, ShexSchema> = buildSchemaCache([toUrl(server, "/static/shex/project").toString()]);
  let firstEntry: Map.Entry<URL, ShexSchema> = schemas.entrySet().stream().findFirst().orElse(null);
  if (firstEntry === null)
    return;
  SchemaCache.putSchema(firstEntry.getKey(), firstEntry.getValue());
  expect(SchemaCache.getSchema(toUrl(server, "/static/shex/project"))).not.toBeNull();
});

// testNullOnCacheContains
test("Null on cache contains", () => {
  const mockServer = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  SchemaCache.clearCache();
  expect(SchemaCache.getSchema(toUrl(server, "/static/shex/project"))).toBeNull();
  let schemas: Map<string, ShexSchema> = buildSchemaCache([toUrl(server, "/static/shex/project").toString()]);
  let firstEntry: Map.Entry<URL, ShexSchema> = schemas.entrySet().stream().findFirst().orElse(null);
  if (firstEntry === null)
    return;
  SchemaCache.putSchema(firstEntry.getKey(), firstEntry.getValue());
  expect(SchemaCache.getSchema(toUrl(server, "/static/shex/project"))).not.toBeNull();
});

public static buildSchemaCache(schemasToCache: Array<string>): Map<string, ShexSchema> /* throws MalformedURLException, ShapeTreeException */ {
  let schemaCache: Map<string, ShexSchema> = new Map<>();
  log.info("Building schema cache");
  for (const schemaUrl of schemasToCache) {
    log.debug("Caching schema {}", schemaUrl);
    let shexShapeSchema: DocumentResponse = DocumentLoaderManager.getLoader().loadExternalDocument(new URL(schemaUrl));
    if (Boolean.FALSE === shexShapeSchema.isExists() || shexShapeSchema.getBody() === null) {
      log.warn("Schema at {} doesn't exist or is empty", schemaUrl);
      continue;
    }
    let shapeBody: string = shexShapeSchema.getBody();
    try (let stream: InputStream = new ByteArrayInputStream(shapeBody.getBytes())) {
      let shexCParser: ShExCParser = new ShExCParser();
      let schema: ShexSchema = new ShexSchema(GlobalFactory.RDFFactory, shexCParser.getRules(stream), shexCParser.getStart());
      schemaCache.put(new URL(schemaUrl), schema);
    } catch (ex) {
      log.error("Error parsing schema {}", schemaUrl);
      log.error("Exception:", ex);
    }
  }
  return schemaCache;
}
