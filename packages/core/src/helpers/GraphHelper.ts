// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.helpers
import {BlankNode, DataFactory, Literal, NamedNode, Parser, Quad, Store, Triple, Writer} from 'n3';
// import {URL} from 'url';
import {ShapeTreeException} from '../exceptions/ShapeTreeException';
import {Lang} from '../todo/Lang';

const { namedNode, blankNode, variable, literal, defaultGraph, quad, triple } = DataFactory;

/**
 * Assorted helper methods related to RDF Graphs
 */
export class GraphHelper {

  private constructor() {
  }

  /**
   * Determine the Jena language (graph serialization type) based on a content type string
   * @param contentType Content type string
   * @return Serialization language
   */
  public static getLangForContentType(contentType: string): Lang {
    // !! Optional<String>
    if (contentType === null) {
      return Lang.TURTLE;
    }
    switch (contentType) {
      case 'application/ld+json':
        return Lang.JSONLD;
      case 'application/rdf+xml':
        return Lang.RDFXML;
      case 'application/n-triples':
        return Lang.NTRIPLES;
      default:
        return Lang.TURTLE;
    }
  }

  /**
   * Writes a graph into a turtle serialization
   * @param graph Graph to serialize
   * @return string in TTL serialization
   */
  public static writeGraphToTurtleString(graph: Store | null): string | null {
    if (graph === null)
      return null;
    // if (graph.isClosed())
    //   return null;

    const writer = new Writer();
    writer.addQuads(graph.getQuads(null, null, null, null));
    let ret: string | null = null;
    writer.end(function (err: Error, result: string) {
      if (err) throw Error(`failed to write graph with ${graph.size} quads`);
      else ret = result;
    });

    // graph.close();
    return ret;
  }

  /**
   * Deserializes a string into a Model
   * @param baseURI Base URL to use for statements
   * @param rawContent string of RDF
   * @param contentType Content type of content
   * @return Deserialized model
   * @throws ShapeTreeException ShapeTreeException
   */
  public static readStringIntoModel(baseURI: URL, rawContent: string, contentType: string | null): Promise<Store> /* throws ShapeTreeException */ {
    try {
      const ret = new Store();
      if (contentType === 'text/turtle') {
        const p = new Parser({ baseIRI: baseURI.href });
        return new Promise((resolve, reject) => {
          p.parse(rawContent, (error: Error, quad: Quad, prefixes: object) => {
            if (error) throw error;
            else if (quad) ret.addQuad(quad);
            else resolve(ret);
          });
        });
      } else {
        throw Error(`unsupported content type: ${rawContent}`);
      }
    } catch (ex: unknown) {
      throw new ShapeTreeException(422, `Error processing input - ${(<Error>ex).message}`);
    }
  }

  /**
   * Creates an empty Graph with initialized prefixes
   * @return Store Empty Graph
   */
  public static getEmptyGraph(): Store {
    return new Store();
    /* TODO:
    model.setNsPrefix("rdfs", "http://www.w3.org/2000/01/rdf-schema#");
    model.setNsPrefix("xsd", "http://www.w3.org/2001/XMLSchema#");
    model.setNsPrefix("st", "http://www.w3.org/ns/shapetrees#");
    */
  }

  /**
   * Create a new triple statement with URLs
   * @param subject Subject to include
   * @param predicate Predicate to include
   * @param object Object to include
   * @return
   */
  public static newTriple(subject: URL, predicate: URL, object: URL | string | LdLiteral): Triple /* throws ShapeTreeException */ {
    if (subject === undefined || predicate === undefined || object === undefined) {
      throw new ShapeTreeException(500, "Cannot provide null values as input to triple construction");
    }
    let objectNode: NamedNode | BlankNode | Literal | null= null;
    if (object instanceof URL) {
      // TODO: needed?
      objectNode = DataFactory.namedNode(object.href);
    } else if (typeof object === 'string') {
      objectNode = DataFactory.blankNode(object);
    } else if (typeof object === 'object') {
      objectNode = object.toLiteral();
    } else {
      throw new ShapeTreeException(500, "Unsupported object value in triple construction: " + JSON.stringify(object));
    }
    return new Triple(DataFactory.namedNode(subject.href), DataFactory.namedNode(predicate.href), objectNode);
  }

  /**
   * Wrap conversion from URL to URI which should never fail on a well-formed URL.
   * @param url covert this URL to a URI
   * @return IRI java native object for a URI (useful for Jena graph operations)
  public static urlToUri(url: URL): URI {
    try {
      return url.toURI();
    } catch (ex) {
      if (ex instanceof URISyntaxException) {
        throw new IllegalStateException("can't convert URL <" + url + "> to IRI: " + ex);
      }
    }
  }
   */

  /**
   * Remove a fragment from a URL. Returns the same URL if there is no fragment
   * @param url to remove fragment from
   * @return URL without fragment
   */
  public static removeUrlFragment(url: URL): URL {
    const copy = new URL(url.href);
    copy.hash = '';
    return copy;
  }

  /*
  public static knownUrl(urlString: string): URL {
    try {
      return new URL(urlString);
    } catch (ex) {
 if (ex instanceof MalformedURLException) {
       throw new IllegalStateException("Expected known URL <" + urlString + "> to parse as valid URL - " + ex.toString());
     }
  }
  */
}

export class LdLiteral {
  public value: string;
  public type: URL | null;
  public language: string | null;

  public constructor (value: string, typeOrLang: URL | string | null) {
    this.value = value;
    if (typeOrLang instanceof URL) {
      this.type = typeOrLang;
      this.language = null;
    } else if (typeof typeOrLang === 'string') {
      this.type = null;
      this.language = typeOrLang;
    } else {
      this.type = null;
      this.language = null;
    }
  }

  toLiteral (): Literal {
    if (this.language) {
      return DataFactory.literal(this.value, this.language);
    } else if (this.type) {
      return DataFactory.literal(this.value, DataFactory.namedNode(this.type.href));
    } else {
      return DataFactory.literal(this.value);
    }
  }
}
