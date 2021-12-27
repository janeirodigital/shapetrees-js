// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { ShapeTreeVocabulary } from './vocabularies/ShapeTreeVocabulary';
import { ShapeTreeReference } from './ShapeTreeReference';
import { ShapeTree } from './ShapeTree';
import { ShapeTreeResource } from './ShapeTreeResource';
import * as log from 'loglevel';
import {DataFactory, NamedNode, QuadPredicate, Store, Term} from "n3";

/**
 * Provides a factory to look up and initialize ShapeTrees.
 * Includes a simple in-memory local cache to avoid repeated fetching of
 * remote shape tree resources.
 */
export class ShapeTreeFactory {

   private static readonly RDFS_LABEL: string = "http://www.w3.org/2000/01/rdf-schema#label";

   private static readonly localShapeTreeCache: Map<string, ShapeTree> = new Map();
   public static getLocalShapeTreeCache(): Map<string, ShapeTree> { return ShapeTreeFactory.localShapeTreeCache; }

  /**
   * Looks up and parses the shape tree at <code>shapeTreeUrl</code>.
   * Shape trees linked via st:contains and st:references are parsed
   * recursively. Maintains a cache to avoid parsing the same shape tree
   * more than once.
   * @param shapeTreeUrl URL of the shape tree to get
   * @return Parsed and initialized shape tree
   * @throws ShapeTreeException
   */
  public static async getShapeTree(shapeTreeUrl: URL): Promise<ShapeTree> /* throws ShapeTreeException */ {
    log.debug("Parsing shape tree: <%s>", shapeTreeUrl);
    if (ShapeTreeFactory.localShapeTreeCache.has(shapeTreeUrl.href)) {
      log.debug("[{}] previously cached -- returning", shapeTreeUrl.href);
      return ShapeTreeFactory.localShapeTreeCache.get(shapeTreeUrl.href)!;
    }
    // Load the entire shape tree resource (which may contain multiple shape trees)
    let shapeTreeResource: ShapeTreeResource = await ShapeTreeResource.getShapeTreeResource(shapeTreeUrl);
    let resourceModel: Store = shapeTreeResource.getModel();
    // Load and set the expected resource type
    const expectsType: URL | null = ShapeTreeFactory.getUrlValue(resourceModel, shapeTreeUrl, ShapeTreeVocabulary.EXPECTS_TYPE, shapeTreeUrl);
    if (expectsType === null)
      throw new ShapeTreeException(500, "Shape Tree :expectsType not found");
    // Load and set the Shape URL
    const shape: URL | null = ShapeTreeFactory.getUrlValue(resourceModel, shapeTreeUrl, ShapeTreeVocabulary.SHAPE, shapeTreeUrl);
    // Load and set Label
    const label: string | null = ShapeTreeFactory.getStringValue(resourceModel, shapeTreeUrl, ShapeTreeFactory.RDFS_LABEL);
    // Load and set contains list
    const contains: Array<URL> = ShapeTreeFactory.getContains(resourceModel, shapeTreeUrl, shapeTreeUrl);
    // Load and set references list
    const references: Array<ShapeTreeReference> = ShapeTreeFactory.getReferences(resourceModel, shapeTreeUrl, shapeTreeUrl);
    if (contains.length !== 0 && expectsType.href !== ShapeTreeVocabulary.CONTAINER) {
      throw new ShapeTreeException(400, "Only a container can be expected to have st:contains");
    }
    let shapeTree: ShapeTree = new ShapeTree(shapeTreeUrl, expectsType, label, shape, references, contains);
    ShapeTreeFactory.localShapeTreeCache.set(shapeTreeUrl.href, shapeTree);
    // Recursively parse contained shape trees
    for (const containedUrl of contains) {
      ShapeTreeFactory.getShapeTree(containedUrl);
    }
    // Recursively parse referenced shape trees
    for (const reference of references) {
      ShapeTreeFactory.getShapeTree(reference.getReferenceUrl());
    }
    return shapeTree;
  }

  /**
   * Get the list of URLs linked via st:contains by the shape tree being parsed.
   * @param resourceModel RDF Model representing the shape tree resource
   * @param shapeTreeNode RDF Node of the shape tree
   * @param shapeTreeUrl URL of the shape tree
   * @return List of URLs linked via st:contains
   * @throws ShapeTreeException
   */
  private static getContains(resourceModel: Store, shapeTreeNode: URL, shapeTreeUrl: URL): Array<URL> /* throws ShapeTreeException */ {
    try {
      return ShapeTreeFactory.getURLListValue(resourceModel, shapeTreeNode, ShapeTreeVocabulary.CONTAINS);
    } catch (ex: any) {
       throw new ShapeTreeException(500, "List <" + shapeTreeUrl + "> contains malformed URL: " + ex.message);
     }
  }

  /**
   * Get the list of ShapeTreeReferences linked via st:references by the shape tree being parsed.
   * @param resourceModel RDF Model representing the shape tree resource
   * @param shapeTreeNode RDF Node of the shape tree
   * @param shapeTreeUrl URL of the shape tree
   * @return List of ShapeTreeReferences linked via st:references
   * @throws ShapeTreeException
   */
  private static getReferences(resourceModel: Store, shapeTreeNode: URL, shapeTreeUrl: URL): Array<ShapeTreeReference> /* throws ShapeTreeException */ {
    let references: Array<ShapeTreeReference> = [];
    let referencesProperty: NamedNode = DataFactory.namedNode(ShapeTreeVocabulary.REFERENCES);
    let referenceStatements = resourceModel.getQuads(DataFactory.namedNode(shapeTreeNode.href), referencesProperty, null, null);
    for (const referenceStatement of referenceStatements) {
        let referenceResource = new URL(referenceStatement.object.value); // TODO: guard against string or bnode case?
        const referencedShapeTreeUrl: URL | null = ShapeTreeFactory.getUrlValue(resourceModel, referenceResource, ShapeTreeVocabulary.REFERENCES_SHAPE_TREE, shapeTreeUrl);
        if (referencedShapeTreeUrl === null) {
            throw new ShapeTreeException(400, "expected <" + shapeTreeUrl + "> reference " + referenceResource.toString() + " to have one <" + ShapeTreeVocabulary.REFERENCES_SHAPE_TREE + "> property");
        }
        let referencedShapeTree: ShapeTreeReference;
        let viaShapePath: string | null = ShapeTreeFactory.getStringValue(resourceModel, referenceResource, ShapeTreeVocabulary.VIA_SHAPE_PATH);
        let viaPredicate: URL | null = ShapeTreeFactory.getUrlValue(resourceModel, referenceResource, ShapeTreeVocabulary.VIA_PREDICATE, shapeTreeUrl);
        referencedShapeTree = new ShapeTreeReference(referencedShapeTreeUrl, viaShapePath, viaPredicate);
        references.push(referencedShapeTree);
    }
    return references;
  }

  /**
   * Validate and get a single URL value linked to a shape tree by the supplied <code>predicate</code>.
   * @param model RDF Model representing the shape tree resource
   * @param resource RDF Node of the shape tree
   * @param predicate Predicate to match
   * @param shapeTreeUrl URL of the shape tree
   * @return URL value linked via <code>predicate</code>
   * @throws ShapeTreeException
   */
  private static getUrlValue(model: Store, resource: URL, predicate: string, shapeTreeUrl: URL): URL | null /* throws ShapeTreeException */ {
    const property: NamedNode = DataFactory.namedNode(predicate);
    let statements = model.getQuads(DataFactory.namedNode(resource.href), property, null, null);
    if (statements.length === 1) {
      const object: Term = statements[0].object;
      if (object.termType === 'NamedNode') {
        try {
          return new URL(object.value);
        } catch (ex: any) {
           throw new Error("Malformed ShapeTree <" + shapeTreeUrl + ">: Jena URIResource <" + object + "> didn't parse as URL - " + ex.message);
         }
      } else {
        throw new ShapeTreeException(500, "Malformed ShapeTree <" + shapeTreeUrl + ">: expected " + object + " to be a URL");
      }
    }
    return null;
  }

  /**
   * Validate and get a single String value linked to a shape tree by the supplied <code>predicate</code>.
   * @param model RDF Model representing the shape tree resource
   * @param resource RDF Node of the shape tree
   * @param predicate Predicate to match
   * @return String value linked via <code>predicate</code>
   * @throws ShapeTreeException
   */
  private static getStringValue(model: Store, resource: URL, predicate: string): string | null /* throws ShapeTreeException */ {
    const property: NamedNode = DataFactory.namedNode(predicate);
    let statements = model.getQuads(DataFactory.namedNode(resource.href), property, null, null);
    if (statements.length === 1) {
      if (['literal', 'NamedNode'].indexOf(statements[0].object.termType) !== -1) {
        return statements[0].object.value;
      } else {
        throw new ShapeTreeException(500, "Cannot determine object type when converting from string for: " + predicate);
      }
    }
    return null;
  }

  /**
   * Validate and get list of URLs linked to a shape tree by the supplied <code>predicate</code>.
   * @param model RDF Model representing the shape tree resource
   * @param resource RDF Node of the shape tree
   * @param predicate Predicate to match
   * @return List of URLs linked via <code>predicate</code>
   * @throws MalformedURLException
   * @throws ShapeTreeException
   */
  private static getURLListValue(model: Store, resource: URL, predicate: string): Array<URL> /* throws MalformedURLException, ShapeTreeException */ {
    const urls: Array<URL> = [];
    const property: NamedNode = DataFactory.namedNode(predicate);
    const propertyStatements = model.getQuads(DataFactory.namedNode(resource.href), property, null, null);
    for (const propertyStatement of propertyStatements) {
        let propertyNode: Term = propertyStatement.object;
        if (propertyNode.termType === 'NamedNode') {
          let contentUrl: URL = new URL(propertyNode.value);
          urls.push(contentUrl);
        } else {
          throw new ShapeTreeException(500, "Must provide a valid URI in URI listing");
        }
    }
    return urls;
  }

  /**
   * Clears the local shape tree cache
   */
  public static clearCache(): void {
    ShapeTreeFactory.localShapeTreeCache.clear();
  }
}
