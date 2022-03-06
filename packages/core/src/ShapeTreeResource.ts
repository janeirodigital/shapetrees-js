// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { DocumentLoaderManager } from './contentloaders/DocumentLoaderManager';
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { GraphHelper } from './helpers/GraphHelper';
const { removeUrlFragment } = GraphHelper;
import { DocumentResponse } from './DocumentResponse';
import {Store} from "n3";
import {URL} from "url";
import * as log from 'loglevel';
import {ShapeTree} from "./ShapeTree";

/**
 * Represents a resource that contains one or more shape tree definitions. Provides
 * a factory to lookup, initialize, and cache them.
 */
export class ShapeTreeResource {

   readonly url: URL;

   readonly body: string;

   readonly contentType: string;

   readonly model: Store;

  // @Getter
   private static readonly localResourceCache: Map<string, ShapeTreeResource> = new Map();
  public static getLocalResourceCache(): Map<string, ShapeTreeResource> { return ShapeTreeResource.localResourceCache; }

  /**
   * Looks up and caches the shape tree resource at <code>resourceUrl</code>. Will used cached
   * verion if it exists. Throws exceptions if the resource doesn't exist, or isn't a valid
   * RDF document.
   * @param resourceUrl URL of shape tree resource
   * @return Shape tree resource at provided <code>resourceUrl</code>
   * @throws ShapeTreeException
   */
  public static async getShapeTreeResource(resourceUrl: URL): Promise<ShapeTreeResource> /* throws ShapeTreeException */ {
    resourceUrl = removeUrlFragment(resourceUrl);

    if (ShapeTreeResource.localResourceCache.has(resourceUrl.href)) {
      log.debug(`<${resourceUrl.href}> previously cached -- returning`);
      return ShapeTreeResource.localResourceCache.get(resourceUrl.href)!;
    }

    let externalDocument: DocumentResponse = await DocumentLoaderManager.getLoader().loadExternalDocument(resourceUrl);
    if (!externalDocument.isExists()) {
      throw new ShapeTreeException(500, "Cannot load shape shape tree resource at " + resourceUrl);
    }

    let model: Store = await GraphHelper.readStringIntoModel(resourceUrl, externalDocument.getBody()!, externalDocument.getContentType() || "text/turtle"); // TODO: body could be null
    let resource: ShapeTreeResource = new ShapeTreeResource(resourceUrl, externalDocument.getBody()!, externalDocument.getContentType() || "text/turtle", model); // TODO: body could be null

    ShapeTreeResource.localResourceCache.set(resourceUrl.href, resource);
    return resource;
  }

  /**
   * Clears the local shape tree resource cache
   */
  public static clearCache(): void {
    ShapeTreeResource.localResourceCache.clear();
  }

  public constructor(url: URL, body: string, contentType: string, model: Store) {
    this.url = url;
    this.body = body;
    this.contentType = contentType;
    this.model = model;
  }

  public getUrl(): URL {
    return this.url;
  }

  public getBody(): string {
    return this.body;
  }

  public getContentType(): string {
    return this.contentType;
  }

  public getModel(): Store {
    return this.model;
  }
}
