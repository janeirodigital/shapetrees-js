// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
const { newTriple } = GraphHelper;
import { Lang } from '@shapetrees/core/src/todo/Lang'
import {DataFactory, Store, Triple} from "n3";

// handleNullOrEmptyContentTypes
test.each([null, ""])("Handle null or empty content types with defaults: %p", (type) => {
  let lang: Lang = GraphHelper.getLangForContentType(type);
  expect(lang).toEqual(Lang.TURTLE);
});
// handleTurtleContentType
test.each(["text/turtle", "something/bogus"])("Handle turtle content type when specified or as default: %p", (type: string) => {
  let lang: Lang = GraphHelper.getLangForContentType(type);
  expect(lang).toEqual(Lang.TURTLE);
});

// handleJsonLD
test("JSON LD content type", () => {
  let lang: Lang = GraphHelper.getLangForContentType("application/ld+json");
  expect(lang).toEqual(Lang.JSONLD);
});

// hanldeNTriples
test("N-Triples content type", () => {
  let lang: Lang = GraphHelper.getLangForContentType("application/n-triples");
  expect(lang).toEqual(Lang.NTRIPLES);
});

// hanldeRDFXMLTriples
test("rdf+xml content type", () => {
  let lang: Lang = GraphHelper.getLangForContentType("application/rdf+xml");
  expect(lang).toEqual(Lang.RDFXML);
});

// parseInvalidTTL
test("Parse invalid TTL", async () => {
  let invalidTtl: string = "<#a> b c";
  await expect(async () => await GraphHelper.readStringIntoModel(new URL("https://example.com/a"), invalidTtl, "text/turtle")).rejects.toBeInstanceOf(ShapeTreeException);
});

// parseValidTTL
test("Parse valid TTL", () => {
  let validTtl: string = "<#a> <#b> <#c> .";
  expect(GraphHelper.readStringIntoModel(new URL("https://example.com/a"), validTtl, "text/turtle")).not.toBeNull();
});

// writeGraphToTTLString
test("Write graph to TTL String", () => {
  let graph: Store = new Store;
  graph.add(DataFactory.triple(DataFactory.namedNode("#b"), DataFactory.namedNode("#c"), DataFactory.namedNode("#d")));
  const turtleString = GraphHelper.writeGraphToTurtleString(graph);
  expect(turtleString).not.toBeNull();
});

// writeNullGraphToTTLString
test("Write null graph to TTL String", () => {
  expect(GraphHelper.writeGraphToTurtleString(null)).toBeNull();
});

// writeClosedGraphtoTTLString
/* doesn't exist in N3.js
test("Write closed graph to TTL String", () => {
  let graph: Store = new Store();
  graph.add(DataFactory.triple(DataFactory.namedNode("#b"), DataFactory.namedNode("#c"), DataFactory.namedNode("#d")));
  graph.close();
  expect(GraphHelper.writeGraphToTurtleString(graph)).toBeNull();
});
*/

// failToStoreNullTripleStringObjects
test("Fail to store null string objects in new Triple helper", () => { // TODO: redundant against failToStoreNullTripleURIObjects
  expect(() => {
    newTriple(new URL("http://a.example/#b"), new URL("http://a.example/#c"), null!);
  }).toThrow(/Cannot provide null values as input to triple construction/);
  expect(() => {
    newTriple(new URL("http://a.example/#b"), null!, new URL("http://a.example/#d"));
  }).toThrow(/Cannot provide null values as input to triple construction/);
  expect(() => {
    newTriple(null!, new URL("http://a.example/#c"), new URL("http://a.example/#d"));
  }).toThrow(/Cannot provide null values as input to triple construction/);
});

// failToStoreNullTripleURIObjects
test("Fail to store null URI objects in new Triple helper", () => {
  let subjectURI: URL = new URL("https://site.example/#a");
  let predicateURI: URL = new URL("https://site.example/#b");
  let objectURI: URL = new URL("https://site.example/#c");
  expect(() => {
    newTriple(subjectURI, predicateURI, null!);
  }).toThrow(/Cannot provide null values as input to triple construction/);
  expect(() => {
    newTriple(subjectURI, null!, objectURI);
  }).toThrow(/Cannot provide null values as input to triple construction/);
  expect( () => {
    newTriple(null!, predicateURI, objectURI);
  }).toThrow(/Cannot provide null values as input to triple construction/);
});

// storeURISubjectAndPredicate
test("Store URI as subject and predicate with new Triple helper", () => {
  let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), new URL("https://site.example/#a"));
  expect(uriTriple).not.toBeNull();
  expect(uriTriple.subject.termType).toEqual('NamedNode');
  expect(uriTriple.predicate.termType).toEqual('NamedNode');
  expect(uriTriple.object.termType).toEqual('NamedNode');
});

// storeURIasTripleObject
test("Store URI object with new Triple helper", () => {
  let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), new URL("https://site.example/#c"));
  expect(uriTriple).not.toBeNull();
  expect(uriTriple.object.termType).toEqual('NamedNode');
});

// storeStringAsTripleObject
test("Store String object with new Triple helper", () => {
  let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), "This is a test string");
  expect(uriTriple).not.toBeNull();
  expect(uriTriple.object.termType).toEqual('Literal');
});

// storeDateTimeAsTripleObject
test("Store DateTime object with new Triple helper", () => {
  let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), new Date().toISOString());
  expect(uriTriple).not.toBeNull();
  expect(uriTriple.object.termType).toEqual('Literal');
});

// storeBooleanAsTripleObject
test("Store Boolean object with new Triple helper", () => {
  let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), true);
  expect(uriTriple).not.toBeNull();
  expect(uriTriple.object.termType).toEqual('Literal');
});

// storeBlankNodeAsTripleObject
test("Store Blank Node with new Triple helper", () => {
  let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), DataFactory.blankNode());
  expect(uriTriple).not.toBeNull();
  expect(uriTriple.object.termType).toEqual('BlankNode');
});

// failedToStoreUnsupportedTypeAsTripleObject
test("Fail to store Unsupported Type with new Triple helper", async () => {
  await expect(async () => {
    await newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), 35.6 as unknown as boolean);
  }).rejects.toBeInstanceOf(ShapeTreeException);
});
