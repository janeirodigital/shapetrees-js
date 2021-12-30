// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { SchemaCache } from '@shapetrees/core/src/SchemaCache';
import { ShapeTree } from '@shapetrees/core/src/ShapeTree';
import { ShapeTreeFactory } from '@shapetrees/core/src/ShapeTreeFactory';
import { ValidationResult } from '@shapetrees/core/src/ValidationResult';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeResourceType } from '@shapetrees/core/src/enums/ShapeTreeResourceType';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import * as ShExJ from 'shexj';
type ShexSchema = ShExJ.Schema;
import {Mockttp, getLocal} from 'mockttp';
import { DispatchEntryServer } from "./fixtures/DispatchEntryServer";
const { toUrl } = DispatchEntryServer;
import {Store} from "n3";
import {SchemaCacheTests} from "../test/SchemaCache.test";

   dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll()

   httpExternalDocumentLoader: HttpExternalDocumentLoader;

    httpExternalDocumentLoader = new HttpExternalDocumentLoader();
    DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

beforeAll(() => {
    dispatcher = new RequestMatchingFixtureDispatcher([
      new DispatcherEntry(["shapetrees/validation-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null), 
      new DispatcherEntry(["shapetrees/containment-shapetree-ttl"], "GET", "/static/shapetrees/containment/shapetree", null), 
      new DispatcherEntry(["validation/validation-container"], "GET", "/validation/", null), 
      new DispatcherEntry(["validation/valid-resource"], "GET", "/validation/valid-resource", null), 
      new DispatcherEntry(["validation/containment/container-1"], "GET", "/validation/container-1/", null), 
      new DispatcherEntry(["validation/containment/container-1-multiplecontains-manager"], "GET", "/validation/container-1/.shapetree", null), 
      new DispatcherEntry(["http/404"], "GET", "/static/shex/missing", null), 
      new DispatcherEntry(["http/404"], "GET", "/static/shapetrees/missing", null), 
      new DispatcherEntry(["schemas/validation-shex"], "GET", "/static/shex/validation", null), 
      new DispatcherEntry(["schemas/containment-shex"], "GET", "/static/shex/containment", null), 
      new DispatcherEntry(["schemas/invalid-shex"], "GET", "/static/shex/invalid", null)
    ]);
});

// validateExpectsContainerType
test("Validate expectsType of Container", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#ExpectsContainerTree"));
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.CONTAINER, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(false);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.NON_RDF, null);
  expect(result.isValid()).toEqual(false);
});

// validateExpectsResourceType
test("Validate expectsType of Resource", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#ExpectsResourceTree"));
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.CONTAINER, null);
  expect(result.isValid()).toEqual(false);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.NON_RDF, null);
  expect(result.isValid()).toEqual(false);
});

// validateExpectsNonRDFResourceType
test("Validate expectsType of NonRDFResource", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#ExpectsNonRDFResourceTree"));
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.NON_RDF, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(false);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.CONTAINER, null);
  expect(result.isValid()).toEqual(false);
});

// validateLabel
test("Validate label", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#LabelTree"));
  result = await shapeTree.validateResource("resource-name", null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource("invalid-name", null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(false);
});

// validateShape
test("Validate shape", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#FooTree"));
  // Validate shape with focus node
  let focusNodeUrls: Array<URL> = [toUrl(server, "/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await this.getFooBodyGraph(toUrl(server, "/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
  // Validate shape without focus node
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, await this.getFooBodyGraph(toUrl(server, "/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
});

// failToValidateShape
test("Fail to validate shape", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#FooTree"));
  // Pass in body content that will fail validation of the shape associated with FooTree
  let focusNodeUrls: Array<URL> = [toUrl(server, "/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await this.getInvalidFooBodyGraph(toUrl(server, "/validation/valid-resource")));
  expect(result.isValid()).toEqual(false);
});

// failToValidateMissingShape
test("Fail to validate shape when the shape resource cannot be found", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#MissingShapeSchemaTree"));
  let fooBodyGraph: Store = await this.getFooBodyGraph(toUrl(server, "/validation/valid-resource"));
  // Catch exception thrown when a shape in a shape tree cannot be found
  let focusNodeUrls: Array<URL> = [toUrl(server, "/validation/valid-resource#foo")];
  expect(async () => await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, fooBodyGraph)).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToValidateMalformedShape
test("Fail to validate shape when the shape resource is malformed", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#InvalidShapeSchemaTree"));
  let fooBodyGraph: Store = await this.getFooBodyGraph(toUrl(server, "/validation/valid-resource"));
  // Catch exception thrown when a shape in a shape tree is invalid
  let focusNodeUrls: Array<URL> = [toUrl(server, "/validation/valid-resource#foo")];
  expect(async () => await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, fooBodyGraph)).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToValidateWhenNoShapeInShapeTree
test("Fail shape validation when shape tree doesn't validate a shape", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  // Get the NoShapeValidationTree shape tree. This shape tree doesn't enforce shape validation,
  // so it should return an error when using to validate
  let noShapeValidationTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#NoShapeValidationTree"));
  let graphTtl: string = "<#a> <#b> <#c> .";
  let focusNodeUrls: Array<URL> = [toUrl(server, "http://a.example/b/c.d#a")];
  const model: Store = await GraphHelper.readStringIntoModel(new URL("http://example.com/"), graphTtl, "text/turtle");
  expect(async () => await noShapeValidationTree.validateGraph(model, focusNodeUrls)).rejects.toBeInstanceOf(ShapeTreeException);
});

// validateShapeBeforeCaching
test("Validate shape before it is cached in schema cache", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  SchemaCache.initializeCache();
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#FooTree"));
  // Validate shape with focus node
  let focusNodeUrls: Array<URL> = [toUrl(server, "/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await this.getFooBodyGraph(toUrl(server, "/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
});

// validateShapeAfterCaching
test("Validate shape after it is cached in schema cache", async () => {
  const server = getLocal({ debug: false });
  server.setDispatcher(dispatcher);
  let result: ValidationResult;
  let schemas: Map<string, ShexSchema> = SchemaCacheTests.buildSchemaCache([toUrl(server, "/static/shex/validation").toString()]);
  SchemaCache.initializeCache(schemas);
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(toUrl(server, "/static/shapetrees/validation/shapetree#FooTree"));
  // Validate shape with focus node
  let focusNodeUrls: Array<URL> = [toUrl(server, "/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await this.getFooBodyGraph(toUrl(server, "/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
});

private getFooBodyGraph(baseUrl: URL): Promise<Store> /* throws ShapeTreeException */ {
  let body: string = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "<#foo> \n" +
    "    ex:id 56789 ; \n" +
    "    ex:name \"Footastic\" ; \n" +
    "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n";
  return GraphHelper.readStringIntoModel(baseUrl, body, "text/turtle");
}

private getInvalidFooBodyGraph(baseUrl: URL): Promise<Store> /* throws ShapeTreeException */ {
  let body: string = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "<#foo> \n" +
    "    ex:id 56789 ; \n" +
    "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n";
  return GraphHelper.readStringIntoModel(baseUrl, body, "text/turtle");
}

private getAttributeOneBodyGraph(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "<#resource> \n" +
    "    ex:name \"Attribute 1\" ; \n" +
    "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n";
}
