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
import { DispatcherEntry } from '../src/fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../src/fixtures/RequestMatchingFixtureDispatcher';
import { DispatchEntryServer } from '../src/fixtures/DispatchEntryServer';
import * as ShExJ from 'shexj';
type ShexSchema = ShExJ.Schema;
import {Store} from "n3";
import { buildSchemaCache } from "../src/buildSchemaCache";

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["shapetrees/validation-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null), 
  new DispatcherEntry(["shapetrees/containment-shapetree-ttl"], "GET", "/static/shapetrees/containment/shapetree", null), 
  new DispatcherEntry(["validation/validation-container"], "GET", "/validation/", null), 
  new DispatcherEntry(["validation/valid-resource"], "GET", "/validation/valid-resource", null), 
  // new DispatcherEntry(["validation/containment/container-1"], "GET", "/validation/container-1/", null),
  // new DispatcherEntry(["validation/containment/container-1-multiplecontains-manager"], "GET", "/validation/container-1/.shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/static/shex/missing", null), 
  new DispatcherEntry(["http/404"], "GET", "/static/shapetrees/missing", null), 
  new DispatcherEntry(["schemas/validation-shex"], "GET", "/static/shex/validation", null), 
  new DispatcherEntry(["schemas/containment-shex"], "GET", "/static/shex/containment", null), 
  new DispatcherEntry(["schemas/invalid-shex"], "GET", "/static/shex/invalid", null)
]);

beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

// validateExpectsContainerType
test("Validate expectsType of Container", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#ExpectsContainerTree"));
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.CONTAINER, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(false);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.NON_RDF, null);
  expect(result.isValid()).toEqual(false);
});

// validateExpectsResourceType
test("Validate expectsType of Resource", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#ExpectsResourceTree"));
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.CONTAINER, null);
  expect(result.isValid()).toEqual(false);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.NON_RDF, null);
  expect(result.isValid()).toEqual(false);
});

// validateExpectsNonRDFResourceType
test("Validate expectsType of NonRDFResource", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#ExpectsNonRDFResourceTree"));
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.NON_RDF, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(false);
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.CONTAINER, null);
  expect(result.isValid()).toEqual(false);
});

// validateLabel
test("Validate label", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#LabelTree"));
  result = await shapeTree.validateResource("resource-name", null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(true);
  result = await shapeTree.validateResource("invalid-name", null, ShapeTreeResourceType.RESOURCE, null);
  expect(result.isValid()).toEqual(false);
});

// validateShape
test("Validate shape", async () => {
  let result: ValidationResult;

  const shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#FooTree"));

  // Validate shape with focus node
  const focusNodeUrls: Array<URL> = [server.urlFor("/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await getFooBodyGraph(server.urlFor("/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);

  // Validate shape without focus node
  result = await shapeTree.validateResource(null, null, ShapeTreeResourceType.RESOURCE, await getFooBodyGraph(server.urlFor("/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
});

// failToValidateShape
test("Fail to validate shape", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#FooTree"));
  // Pass in body content that will fail validation of the shape associated with FooTree
  let focusNodeUrls: Array<URL> = [server.urlFor("/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await getInvalidFooBodyGraph(server.urlFor("/validation/valid-resource")));
  expect(result.isValid()).toEqual(false);
});

// failToValidateMissingShape
test("Fail to validate shape when the shape resource cannot be found", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#MissingShapeSchemaTree"));
  let fooBodyGraph: Store = await getFooBodyGraph(server.urlFor("/validation/valid-resource"));
  // Catch exception thrown when a shape in a shape tree cannot be found
  let focusNodeUrls: Array<URL> = [server.urlFor("/validation/valid-resource#foo")];
  await expect(async () => await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, fooBodyGraph)).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToValidateMalformedShape
test("Fail to validate shape when the shape resource is malformed", async () => {
  let result: ValidationResult;
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#InvalidShapeSchemaTree"));
  let fooBodyGraph: Store = await getFooBodyGraph(server.urlFor("/validation/valid-resource"));
  // Catch exception thrown when a shape in a shape tree is invalid
  let focusNodeUrls: Array<URL> = [server.urlFor("/validation/valid-resource#foo")];
  await expect(async () => await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, fooBodyGraph)).rejects.toBeInstanceOf(ShapeTreeException);
});

// failToValidateWhenNoShapeInShapeTree
test("Fail shape validation when shape tree doesn't validate a shape", async () => {
  // Get the NoShapeValidationTree shape tree. This shape tree doesn't enforce shape validation,
  // so it should return an error when using to validate
  let noShapeValidationTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#NoShapeValidationTree"));
  let graphTtl: string = "<#a> <#b> <#c> .";
  let focusNodeUrls: Array<URL> = [new URL("http://a.example/b/c.d#a")];
  const model: Store = await GraphHelper.readStringIntoModel(new URL("http://example.com/"), graphTtl, "text/turtle");
  expect(async () => await noShapeValidationTree.validateGraph(model, focusNodeUrls)).rejects.toBeInstanceOf(ShapeTreeException);
});

// validateShapeBeforeCaching
test("Validate shape before it is cached in schema cache", async () => {
  let result: ValidationResult;
  SchemaCache.initializeCache();
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#FooTree"));
  // Validate shape with focus node
  let focusNodeUrls: Array<URL> = [server.urlFor("/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await getFooBodyGraph(server.urlFor("/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
});

// validateShapeAfterCaching
test("Validate shape after it is cached in schema cache", async () => {
  let result: ValidationResult;
  let schemas: Map<string, ShexSchema> = await buildSchemaCache([server.urlFor("/static/shex/validation").toString()]);
  SchemaCache.initializeCache(schemas);
  let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(server.urlFor("/static/shapetrees/validation/shapetree#FooTree"));
  // Validate shape with focus node
  let focusNodeUrls: Array<URL> = [server.urlFor("/validation/valid-resource#foo")];
  result = await shapeTree.validateResource(null, focusNodeUrls, ShapeTreeResourceType.RESOURCE, await getFooBodyGraph(server.urlFor("/validation/valid-resource")));
  expect(result.isValid()).toEqual(true);
});

function getFooBodyGraph(baseUrl: URL): Promise<Store> /* throws ShapeTreeException */ {
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

function getInvalidFooBodyGraph(baseUrl: URL): Promise<Store> /* throws ShapeTreeException */ {
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

function getAttributeOneBodyGraph(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "<#resource> \n" +
    "    ex:name \"Attribute 1\" ; \n" +
    "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n";
}
