// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
const { newTriple } = GraphHelper;
import { Lang } from '@shapetrees/core/src/todo/Lang'
import {DataFactory, Store, Triple} from "n3";

class GraphHelperTests {

  // @ParameterizedTest, @NullAndEmptySource, @DisplayName("Handle null or empty content types with defaults"), @SneakyThrows
  handleNullOrEmptyContentTypes(type: string): void {
    let lang: Lang = GraphHelper.getLangForContentType(type);
    expect(lang).toEqual(Lang.TURTLE);
  }

  // @ParameterizedTest, @ValueSource(strings = { "text/turtle", "something/bogus" }), @DisplayName("Handle turtle content type when specified or as default"), @SneakyThrows
  handleTurtleContentType(type: string): void {
    let lang: Lang = GraphHelper.getLangForContentType(type);
    expect(lang).toEqual(Lang.TURTLE);
  }

  // @Test, @DisplayName("JSON LD content type"), @SneakyThrows
  handleJsonLD(): void {
    let lang: Lang = GraphHelper.getLangForContentType("application/ld+json");
    expect(lang).toEqual(Lang.JSONLD);
  }

  // @Test, @DisplayName("N-Triples content type"), @SneakyThrows
  hanldeNTriples(): void {
    let lang: Lang = GraphHelper.getLangForContentType("application/n-triples");
    expect(lang).toEqual(Lang.NTRIPLES);
  }

  // @Test, @DisplayName("rdf+xml content type"), @SneakyThrows
  hanldeRDFXMLTriples(): void {
    let lang: Lang = GraphHelper.getLangForContentType("application/rdf+xml");
    expect(lang).toEqual(Lang.RDFXML);
  }

  // @Test, @DisplayName("Parse invalid TTL"), @SneakyThrows
  parseInvalidTTL(): void {
    let invalidTtl: string = "<#a> b c";
    expect(async () => await GraphHelper.readStringIntoModel(new URL("https://example.com/a"), invalidTtl, "text/turtle")).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @Test, @DisplayName("Parse valid TTL"), @SneakyThrows
  parseValidTTL(): void {
    let invalidTtl: string = "<#a> <#b> <#c> .";
    expect(GraphHelper.readStringIntoModel(new URL("https://example.com/a"), invalidTtl, "text/turtle")).not.toBeNull();
  }

  // @Test, @DisplayName("Write graph to TTL String"), @SneakyThrows
  writeGraphToTTLString(): void {
    let graph: Store = new Store;
    graph.add(DataFactory.triple(DataFactory.namedNode("<#b>"), DataFactory.namedNode("<#c>"), DataFactory.namedNode("<#d>")));
    expect(GraphHelper.writeGraphToTurtleString(graph)).not.toBeNull();
  }

  // @Test, @DisplayName("Write null graph to TTL String"), @SneakyThrows
  writeNullGraphToTTLString(): void {
    expect(GraphHelper.writeGraphToTurtleString(null)).toBeNull();
  }

  // @Test, @DisplayName("Write closed graph to TTL String"), @SneakyThrows
  writeClosedGraphtoTTLString(): void {
    let graph: Store = new Store();
    graph.add(DataFactory.triple(DataFactory.namedNode("<#b>"), DataFactory.namedNode("<#c>"), DataFactory.namedNode("<#d>")));
    // graph.close();
    expect(GraphHelper.writeGraphToTurtleString(graph)).toBeNull();
  }

  // @Test, @DisplayName("Fail to store null string objects in new Triple helper"), @SneakyThrows
  failToStoreNullTripleStringObjects(): void {
    expect(async () => {
      await newTriple(new URL("<#b>"), new URL("<#c>"), null);
    }).rejects.toBeInstanceOf(ShapeTreeException);
    expect(async () => {
      await newTriple(new URL("<#b>"), null, new URL("<#d>"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
    expect(async () => {
      await newTriple(null, new URL("<#c>"), new URL("<#d>"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @Test, @DisplayName("Fail to store null URI objects in new Triple helper"), @SneakyThrows
  failToStoreNullTripleURIObjects(): void {
    let subjectURI: URL = new URL("https://site.example/#a");
    let predicateURI: URL = new URL("https://site.example/#b");
    let objectURI: URL = new URL("https://site.example/#c");
    expect(async () => {
      await newTriple(subjectURI, predicateURI, null);
    }).rejects.toBeInstanceOf(ShapeTreeException);
    expect(async () => {
      await newTriple(subjectURI, null, objectURI);
    }).rejects.toBeInstanceOf(ShapeTreeException);
    expect(async () => {
      await newTriple(null, predicateURI, objectURI);
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @Test, @DisplayName("Store URI as subject and predicate with new Triple helper"), @SneakyThrows
  storeURISubjectAndPredicate(): void {
    let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), new URL("https://site.example/#a"));
    expect(uriTriple).not.toBeNull();
    expect(uriTriple.subject.termType).toEqual('NamedNode');
    expect(uriTriple.predicate.termType).toEqual('NamedNode');
    expect(uriTriple.object.termType).toEqual('NamedNode');
  }

  // @Test, @DisplayName("Store URI object with new Triple helper"), @SneakyThrows
  storeURIasTripleObject(): void {
    let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), new URL("https://site.example/#c"));
    expect(uriTriple).not.toBeNull();
    expect(uriTriple.object.termType).toEqual('NamedNode');
  }

  // @Test, @DisplayName("Store String object with new Triple helper"), @SneakyThrows
  storeStringAsTripleObject(): void {
    let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), "This is a test string");
    expect(uriTriple).not.toBeNull();
    expect(uriTriple.object.termType).toEqual('Literal');
  }

  // @Test, @DisplayName("Store DateTime object with new Triple helper"), @SneakyThrows
  storeDateTimeAsTripleObject(): void {
    let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), OffsetDateTime.now());
    expect(uriTriple).not.toBeNull();
    expect(uriTriple.object.termType).toEqual('Literal');
  }

  // @Test, @DisplayName("Store Boolean object with new Triple helper"), @SneakyThrows
  storeBooleanAsTripleObject(): void {
    let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), true);
    expect(uriTriple).not.toBeNull();
    expect(uriTriple.object.termType).toEqual('Literal');
  }

  // @Test, @DisplayName("Store Blank Node with new Triple helper"), @SneakyThrows
  storeBlankNodeAsTripleObject(): void {
    let uriTriple: Triple = newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), "_:b1");
    expect(uriTriple).not.toBeNull();
    expect(uriTriple.object.termType).toEqual('BlankNode');
  }

  // @Test, @DisplayName("Fail to store Unsupported Type with new Triple helper"), @SneakyThrows
  failedToStoreUnsupportedTypeAsTripleObject(): void {
    expect(async () => {
      await newTriple(new URL("https://site.example/#a"), new URL("https://site.example/#b"), 35.6);
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }
}
