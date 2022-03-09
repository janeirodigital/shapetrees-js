// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.client.http
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
import { ManageableInstance } from '@shapetrees/core/src/ManageableInstance';
import { ManageableResource } from '@shapetrees/core/src/ManageableResource';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';
import { InstanceResource } from '@shapetrees/core/src/InstanceResource';
import { ResourceAccessor } from '@shapetrees/core/src/ResourceAccessor';
import { ManagerResource } from '@shapetrees/core/src/ManagerResource';
import { MissingManageableResource } from '@shapetrees/core/src/MissingManageableResource';
import { MissingManagerResource } from '@shapetrees/core/src/MissingManagerResource';
import { UnmanagedResource } from '@shapetrees/core/src/UnmanagedResource';
import { ManagedResource } from '@shapetrees/core/src/ManagedResource';
import { HttpHeaders } from '@shapetrees/core/src/enums/HttpHeaders';
import { LinkRelations } from '@shapetrees/core/src/enums/LinkRelations';
import { ShapeTreeResourceType } from '@shapetrees/core/src/enums/ShapeTreeResourceType';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { LdpVocabulary } from '@shapetrees/core/src/vocabularies/LdpVocabulary';
import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
import { HttpRequest } from './HttpRequest';
import { HttpClient } from './HttpClient';
import {HttpClientFactoryManager} from "./HttpClientFactoryManager";
import * as log from 'loglevel';
import {DataFactory, Quad, Store} from "n3";

/**
 * Allows the {@link com.janeirodigital.shapetrees.core shapetrees-core} to access
 * {@link ManageableInstance}s and {@link InstanceResource}s over the network via HTTP. This is
 * particularly effective when employing client-side shape-tree validation in a
 * <a href="https://shapetrees.org/TR/specification/index.html#shapetree-support-from-proxy-or-client-side-library">proxy scenario</a>.
 *
 * <p>Given the fact that resources are accessed via HTTP, some inferences must be made on
 * resource state based on responses to HTTP requests.</p>
 */
export class HttpResourceAccessor implements ResourceAccessor {

   private static readonly supportedRDFContentTypes: Set<string> = new Set(["text/turtle", "application/rdf+xml", "application/n-triples", "application/ld+json"]);

  /**
   * Return a {@link ManageableInstance} constructed based on the provided <code>resourceUrl</code>,
   * which could target either a {@link ManageableResource} or a {@link ManagerResource}.
   * Both are retrieved via HTTP and loaded as specifically
   * typed sub-classes that indicate whether they exist, or (in the case of manageable resource)
   * whether they are managed.
   *
   * @param context {@link ShapeTreeContext}
   * @param resourceUrl URL of the target resource
   * @return {@link ManageableInstance} including {@link ManageableResource} and {@link ManagerResource}
   */
  public async getInstance(context: ShapeTreeContext, resourceUrl: URL): Promise<ManageableInstance> /* throws ShapeTreeException */ {

    const resource: InstanceResource = await this.getResource(context, resourceUrl);

    if (resource instanceof MissingManageableResource) {
      // Get is for a manageable resource that doesn't exist
      return this.getInstanceFromMissingManageableResource(context, <MissingManageableResource>resource);
    } else if (resource instanceof MissingManagerResource) {
      // Get is for a manager resource that doesn't exist
      return await this.getInstanceFromMissingManagerResource(context, <MissingManagerResource>resource);
    } else if (resource instanceof ManageableResource) {
      // Get is for an existing manageable resource
      return await this.getInstanceFromManageableResource(context, <ManageableResource>resource);
    } else if (resource instanceof ManagerResource) {
      // Get is for an existing manager resource
      return await this.getInstanceFromManagerResource(context, <ManagerResource>resource);
    }

    throw new ShapeTreeException(500, "Can get instance from resource of unsupported type: " + resource.getUrl());
  }

  /**
   * Gets a {@link ManageableInstance} given a {@link MissingManageableResource}, which means that
   * a corresponding {@link ManagerResource} cannot exist, so a {@link MissingManagerResource} is
   * constructed and included as part of instance construction.
   * @param context {@link ShapeTreeContext}
   * @param missing {@link MissingManageableResource}
   * @return {@link ManageableInstance} including {@link MissingManageableResource} and {@link MissingManagerResource}
   */
  private getInstanceFromMissingManageableResource(context: ShapeTreeContext, missing: MissingManageableResource): ManageableInstance {
    let missingManager: MissingManagerResource = new MissingManagerResource(missing.getUrl(), missing);
    return new ManageableInstance(context, this, false, missing, missingManager);
  }

  /**
   * Gets a {@link ManageableInstance} given a {@link MissingManagerResource}, which means that
   * a {@link ManagerResource} doesn't exist, but an {@link UnmanagedResource} that would be associated
   * with it may, so it is looked up over HTTP and populated with the appropriate resulting type
   * based on its existence.
   * @param context {@link ShapeTreeContext}
   * @param missing {@link MissingManagerResource}
   * @return {@link ManageableInstance} including {@link UnmanagedResource}|{@link MissingManageableResource} and {@link MissingManagerResource}
   * @throws ShapeTreeException
   */
  private async getInstanceFromMissingManagerResource(context: ShapeTreeContext, missing: MissingManagerResource): Promise<ManageableInstance> /* throws ShapeTreeException */ {
    let manageable: InstanceResource = await this.getResource(context, this.calculateManagedUrl(missing.getUrl(), missing.getAttributes()));
    if (manageable.isExists()) {
      let unmanaged: UnmanagedResource = new UnmanagedResource(<ManageableResource>manageable, missing.getUrl());
      return new ManageableInstance(context, this, true, unmanaged, missing);
    } else {
      throw new ShapeTreeException(500, "Cannot have a shape tree manager " + missing.getUrl() + " for a missing manageable resource " + manageable.getUrl());
    }
  }

  /**
   * Gets a {@link ManageableInstance} given a {@link ManageableResource}, which could be a
   * {@link ManagedResource} or an {@link UnmanagedResource}. Which type is determined by
   * the presence of the {@link ManagerResource}, which is looked up and the instance is
   * populated with the appropriate resulting types.*
   * @param context {@link ShapeTreeContext}
   * @param manageable {@link ManagedResource} or {@link UnmanagedResource}
   * @return {@link ManageableInstance} including {@link UnmanagedResource}|{@link ManagedResource} and {@link ManagerResource}|{@link MissingManagerResource}
   * @throws ShapeTreeException
   */
  private async getInstanceFromManageableResource(context: ShapeTreeContext, manageable: ManageableResource): Promise<ManageableInstance> /* throws ShapeTreeException */ {

    let managerResourceUrl: URL = HttpResourceAccessor.expectNotNull(manageable.getManagerResourceUrl(), () => new ShapeTreeException(500, "Cannot discover shape tree manager for " + manageable.getUrl()));

    let manager: InstanceResource = await this.getResource(context, managerResourceUrl);

    if (manager instanceof MissingManagerResource) {
      // If the manager does exist it is unmanaged - Get and store both in instance
      let unmanaged: UnmanagedResource = new UnmanagedResource(manageable, manager.getUrl());
      return new ManageableInstance(context, this, false, unmanaged, <ManagerResource>manager);
    } else if (manager instanceof ManagerResource) {
      // If the manager exists then it is managed - get and store manager and managed resource in instance
      let managed: ManagedResource = new ManagedResource(manageable, manager.getUrl());
      return new ManageableInstance(context, this, false, managed, <ManagerResource>manager);
    } else {
      throw new ShapeTreeException(500, "Error looking up corresponding shape tree manager for " + manageable.getUrl());
    }
  }

  /**
   * Gets a {@link ManageableInstance} given a {@link ManagerResource}. The corresponding
   * {@link ManagedResource} is looked up and the instance is populated with it.
   * @param context {@link ShapeTreeContext}
   * @param manager Existing {@link ManagerResource}
   * @return {@link ManageableInstance} including {@link ManagerResource} and {@link ManagedResource}
   * @throws ShapeTreeException
   */
  private async getInstanceFromManagerResource(context: ShapeTreeContext, manager: ManagerResource): Promise<ManageableInstance> /* throws ShapeTreeException */ {
    let manageable: InstanceResource = await this.getResource(context, manager.getManagedResourceUrl());
    if (manageable instanceof MissingManageableResource) {
      throw new ShapeTreeException(500, "Cannot have a shape tree manager at " + manager.getUrl() + " without a corresponding managed resource");
    }
    let managed: ManagedResource = new ManagedResource(<ManageableResource>manageable, manager.getUrl());
    return new ManageableInstance(context, this, true, managed, manager);
  }

  /**
   * Gets a {@link ManageableInstance} by first creating the provided <code>resourceUrl</code>, which could
   * mean creating either a {@link ManageableResource} or a {@link ManagerResource}. The newly created resource
   * is loaded into the instance, and the corresponding {@link ManageableResource} or {@link ManagerResource} is
   * looked up and loaded into the instance alongside it. They are loaded as specifically
   * typed sub-classes that indicate whether they exist, or (in the case of a {@link ManageableResource}),
   * whether they are managed.
   * @param context {@link ShapeTreeContext}
   * @param method HTTP method used for creation
   * @param resourceUrl URL of the resource to create
   * @param headers HTTP headers used for creation
   * @param body Body of the created resource
   * @param contentType Content-type of the created resource
   * @return {@link ManageableInstance} with {@link ManageableResource} and {@link ManagerResource}
   * @throws ShapeTreeException
   */
  public async createInstance(context: ShapeTreeContext, method: string, resourceUrl: URL, headers: ResourceAttributes, body: string, contentType: string): Promise<ManageableInstance> /* throws ShapeTreeException */ {
    let resource: InstanceResource = await this.createResource(context, method, resourceUrl, headers, body, contentType);
    if (resource instanceof ManageableResource) {
      // Managed or unmanaged resource was created
      return this.createInstanceFromManageableResource(context, <ManageableResource>resource);
    } else if (resource instanceof ManagerResource) {
      // Manager resource was created
      return this.createInstanceFromManagerResource(context, <ManagerResource>resource);
    }
    throw new ShapeTreeException(500, "Invalid resource type returned from resource creation");
  }

  /**
   * Gets a {@link ManageableInstance} given a newly created {@link ManageableResource}. A corresponding
   * {@link ManagerResource} is looked up. If it exists, a {@link ManagedResource} is initialized and loaded
   * into the instance. If it doesn't, an {@link UnmanagedResource} is initialized and loaded instead.
   * @param context {@link ShapeTreeContext}
   * @param manageable Newly created {@link ManageableResource}
   * @return {@link ManageableInstance} including {@link ManagedResource}|{@link UnmanagedResource} and {@link ManagerResource}|{@link MissingManagerResource}
   * @throws ShapeTreeException
   */
  private async createInstanceFromManageableResource(context: ShapeTreeContext, manageable: ManageableResource): Promise<ManageableInstance> /* throws ShapeTreeException */ {
    // Lookup the corresponding ManagerResource for the ManageableResource
    let managerResourceUrl: URL = HttpResourceAccessor.expectNotNull(manageable.getManagerResourceUrl(), () => new ShapeTreeException(500, "Cannot discover shape tree manager for " + manageable.getUrl()));
    let manager: InstanceResource = await this.getResource(context, managerResourceUrl);
    if (manager instanceof MissingManagerResource) {
      // Create and store an UnmanagedResource in instance - if the create was a resource in an unmanaged container
      let unmanaged: UnmanagedResource = new UnmanagedResource(manageable, manager.getUrl());
      return new ManageableInstance(context, this, false, unmanaged, <ManagerResource>manager);
    } else if (manager instanceof ManagerResource) {
      // Create and store a ManagedResource in instance - if the create was a resource in a managed container
      let managed: ManagedResource = new ManagedResource(manageable, manager.getUrl());
      return new ManageableInstance(context, this, false, managed, <ManagerResource>manager);
    }
    throw new ShapeTreeException(500, "Error lookup up corresponding shape tree manager for " + manageable.getUrl());
  }

  /**
   * Gets a {@link ManageableInstance} given a newly created {@link ManagerResource}. A corresponding
   * {@link ManagedResource} is looked up (and which must exist and be associated with this
   * manager).
   * @param context {@link ShapeTreeContext}
   * @param manager Newly created {@link ManagerResource}
   * @return {@link ManageableInstance} including {@link ManagerResource} and {@link ManagedResource}
   * @throws ShapeTreeException
   */
  private async createInstanceFromManagerResource(context: ShapeTreeContext, manager: ManagerResource): Promise<ManageableInstance> /* throws ShapeTreeException */ {
    // Lookup the corresponding ManagedResource for the ManagerResource
    let resource: InstanceResource = await this.getResource(context, manager.getManagedResourceUrl());
    if (resource instanceof MissingManageableResource) {
      throw new ShapeTreeException(500, "Cannot have an existing manager resource " + manager.getUrl() + " with a non-existing managed resource " + resource.getUrl());
    } else if (resource instanceof ManagerResource) {
      throw new ShapeTreeException(500, "Invalid manager resource " + resource.getUrl() + " seems to be associated with another manager resource " + manager.getUrl());
    }
    let managed: ManagedResource = new ManagedResource(<ManageableResource>resource, manager.getUrl());
    return new ManageableInstance(context, this, true, managed, manager);
  }

  /**
   * Get a {@link InstanceResource} at the provided <code>url</code>, which may or may not exist.
   * Most of the work happens in {@link #generateResource(URL, DocumentResponse)}, which
   * processes the response and returns the corresponding typed resource.
   * @param context {@link ShapeTreeContext}
   * @param resourceUrl Url of the resource to get
   * @return {@link InstanceResource}
   * @throws ShapeTreeException
   */
  public async getResource(context: ShapeTreeContext, resourceUrl: URL): Promise<InstanceResource> /* throws ShapeTreeException */ {
    log.debug(`HttpResourceAccessor#getResource(<${resourceUrl}>)`);
    let headers: ResourceAttributes = new ResourceAttributes();
    headers.maybeSet(HttpHeaders.AUTHORIZATION, context.getAuthorizationHeaderValue());
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(false);
    let req: HttpRequest = new HttpRequest("GET", resourceUrl, headers, null, null);
    let response: DocumentResponse = await fetcher.fetchShapeTreeResponse(req);
    return this.generateResource(resourceUrl, response);
  }

  /**
   * Create a {@link InstanceResource} at the provided <code>url</code> via the provided HTTP
   * <code>method</code>. Most of the work happens in {@link #generateResource(URL, DocumentResponse)},
   * which processes the response and returns the corresponding typed resource.
   * @param context {@link ShapeTreeContext}
   * @param method HTTP method to use for resource creation
   * @param resourceUrl Url of the resource to create
   * @param headers HTTP headers to use for resource creation
   * @param body Body of resource to create
   * @param contentType HTTP content-type
   * @return {@link InstanceResource}
   * @throws ShapeTreeException
   */
  public async createResource(context: ShapeTreeContext, method: string, resourceUrl: URL, headers: ResourceAttributes, body: string, contentType: string): Promise<InstanceResource> /* throws ShapeTreeException */ {
    log.debug(`createResource via ${method}: URL <${resourceUrl}>, headers [${headers.toString()}]`);
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(false);
    let allHeaders: ResourceAttributes = headers.maybePlus(HttpHeaders.AUTHORIZATION, context.getAuthorizationHeaderValue());
    let response: DocumentResponse = await fetcher.fetchShapeTreeResponse(new HttpRequest(method, resourceUrl, allHeaders, body, contentType));
    if (!response.isExists()) {
      throw new ShapeTreeException(500, "Unable to create resource <" + resourceUrl + ">");
    }
    return this.generateResource(resourceUrl, response);
  }

  /**
   * Generates a typed {@link InstanceResource} based on the response from {@link #getResource(ShapeTreeContext, URL)} or
   * {@link #createResource(ShapeTreeContext, String, URL, ResourceAttributes, String, String)}.
   * Determines whether the resource is an existing {@link ManageableResource} or {@link ManagerResource}.
   * @param url Url of the resource to generate
   * @param response Response from a create or update of <code>url</code>
   * @return Generated {@link InstanceResource}, either {@link ManageableResource} or {@link ManagerResource}
   * @throws ShapeTreeException
   */
  private generateResource(url: URL, response: DocumentResponse): InstanceResource /* throws ShapeTreeException */ {

    // If a resource was created, ensure the URL returned in the Location header is valid
    let location: string | null = response.getResourceAttributes() === null
        ? null
        : response.getResourceAttributes()!.firstValue(HttpHeaders.LOCATION);
    if (location !== null) {
      try {
        url = new URL(location);
      } catch (ex: any) {
         throw new ShapeTreeException(500, "Retrieving <" + url + "> yielded a Location header \"" + location + "\" which doesn't parse as a URL: " + ex.message);
       }
    }

    // Determine whether the resource exists based on the response. Even if the resource
    // doesn't exist, additional context and processing is done to provide the appropriate
    // typed resource with adequate context to the caller
    const exists: boolean = response.isExists();
    const container: boolean = this.isContainerFromHeaders(response.getResourceAttributes(), url);
    const attributes: ResourceAttributes = response.getResourceAttributes() || new ResourceAttributes(); // TODO: could be null
    const resourceType: ShapeTreeResourceType = this.getResourceTypeFromHeaders(response.getResourceAttributes())!; // TODO: could be null

    const name: string = this.calculateName(url);
    if (response.getBody() === null) {
      log.error("Could not retrieve the body string from response for " + url);
      throw new Error("Could not retrieve the body string from response for <" + url + ">"); // TODO: follow resolution in /home/eric/checkouts/janeirodigital/shapetrees-java/shapetrees-java-client-http/src/main/java/com/janeirodigital/shapetrees/client/http/HttpResourceAccessor.java
    }
    const body: string = response.getBody()!;

    // Parse Link headers from response and populate ResourceAttributes
    const linkHeaders: Array<string> = attributes.allValues(HttpHeaders.LINK);
    let parsedLinkHeaders: ResourceAttributes = linkHeaders === null
        ? new ResourceAttributes()
        : ResourceAttributes.parseLinkHeaders(linkHeaders);

    // Determine if the resource is a shape tree manager based on the response
    const isManager: boolean = this.calculateIsManager(url, exists, parsedLinkHeaders);

    if (isManager) {
      const managedResourceUrl: URL = this.calculateManagedUrl(url, parsedLinkHeaders);
      if (exists) {
        return new ManagerResource(url, resourceType, attributes, body, name, true, managedResourceUrl);
      } else {
        return new MissingManagerResource(managedResourceUrl, url, resourceType, attributes, body, name);
      }
    } else {
      // Look for presence of st:managedBy in link headers from response and get the target manager URL
      const managerUrl: URL | null = this.calculateManagerUrl(url, parsedLinkHeaders);
      if (exists) {
        return new ManageableResource(url, resourceType, attributes, body, name, true, managerUrl, container);
      } else {
        return new MissingManageableResource(url, resourceType, attributes, body, name, managerUrl, container);
      }
    }
  }

  /**
   * Gets a List of contained {@link ManageableInstance}s from a given container specified by <code>containerUrl</code>
   * @param context {@link ShapeTreeContext}
   * @param containerResourceUrl URL of target container resource
   * @return List of {@link ManageableInstance}s from the target container
   * @throws ShapeTreeException
   */
  public async getContainedInstances(context: ShapeTreeContext, containerResourceUrl: URL): Promise<Array<ManageableInstance>> /* throws ShapeTreeException */ {
    try {
      let resource: InstanceResource = await this.getResource(context, containerResourceUrl);
      if (!(resource instanceof ManageableResource)) {
        throw new ShapeTreeException(500, "Cannot get contained resources for a manager resource <" + containerResourceUrl + ">");
      }
      let containerResource: ManageableResource = <ManageableResource>resource;

      if (!containerResource.isContainer()) {
        throw new ShapeTreeException(500, "Cannot get contained resources for a resource that is not a Container <" + containerResourceUrl + ">");
      }

      let containerGraph: Store = await GraphHelper.readStringIntoModel(containerResourceUrl, containerResource.getBody(), containerResource.getAttributes().firstValue(HttpHeaders.CONTENT_TYPE) || null);

      if (containerGraph === null) {
        return Promise.resolve([]);
      }
      let containerTriples: Array<Quad> = containerGraph.getQuads(
          DataFactory.namedNode(containerResourceUrl.href),
          DataFactory.namedNode(LdpVocabulary.CONTAINS),
          null,
          null
      )
          .sort((l, r) => l.object.value.localeCompare(r.object.value)); // ORDERED

      if (containerTriples === null) { return Promise.resolve([]); }

      let containedInstances: Array<ManageableInstance> = new Array();

      for (const containerTriple of containerTriples) {
        let containedInstance: ManageableInstance = await this.getInstance(context, new URL(containerTriple.object.value)); // TODO: what if not an IRI?
        containedInstances.push(containedInstance);
      }

      return Promise.resolve(containedInstances);
    } catch (ex: any) {
       throw new ShapeTreeException(500, ex.message);
     }
  }

  /**
   * Updates the provided {@link InstanceResource} <code>updateResource</code> with <code>body</code> via the supplied
   * <code>method</code>
   * @param context Shape tree context
   * @param method HTTP method to use for update
   * @param updatedResource {@link InstanceResource} to update
   * @param body Body to use for update
   * @return {@link DocumentResponse} of the result
   * @throws ShapeTreeException
   */
  public async updateResource(context: ShapeTreeContext, method: string, updatedResource: InstanceResource, body: string): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    log.debug(`updateResource: URL <${updatedResource.getUrl()}>`);
    let contentType: string | null = updatedResource.getAttributes().firstValue(HttpHeaders.CONTENT_TYPE);
    // [careful] updateResource attributes may contain illegal client headers (connection, content-length, date, expect, from, host, upgrade, via, warning)
    let allHeaders: ResourceAttributes = updatedResource.getAttributes().maybePlus(HttpHeaders.AUTHORIZATION, context.getAuthorizationHeaderValue());
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(false);
    return await fetcher.fetchShapeTreeResponse(new HttpRequest(method, updatedResource.getUrl(), allHeaders, body, contentType));
  }

  /**
   * Deletes the provided {@link InstanceResource }<code>deleteResource</code>
   * @param context {@link ShapeTreeContext}
   * @param deleteResource {@link InstanceResource} to delete
   * @return {@link DocumentResponse} of the result
   * @throws ShapeTreeException
   */
  public async deleteResource(context: ShapeTreeContext, deleteResource: ManagerResource): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    log.debug("deleteResource: URL [{}]", deleteResource.getUrl());
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(false);
    let allHeaders: ResourceAttributes = deleteResource.getAttributes().maybePlus(HttpHeaders.AUTHORIZATION, context.getAuthorizationHeaderValue());
    let response: DocumentResponse = await fetcher.fetchShapeTreeResponse(new HttpRequest("DELETE", deleteResource.getUrl(), allHeaders, null, null));
    let respCode: number = response.getStatusCode();
    if (respCode < 200 || respCode >= 400) {
      log.error("Error deleting resource {}, Status {}", deleteResource.getUrl(), respCode);
    }
    return response;
  }

  /**
   * Look for a Link rel=type of ldp:Container or ldp:BasicContainer
   * @param headers to parse
   * @return True if headers indicating a container are found
   */
  private isContainerFromHeaders(headers: ResourceAttributes | null, url: URL): boolean {
    let linkHeaders: Array<string> = headers == null
        ? []
        : headers!.allValues(HttpHeaders.LINK);
    if (linkHeaders.length === 0) {
      return url.pathname.endsWith("/");
    }
    let parsedLinkHeaders: ResourceAttributes = ResourceAttributes.parseLinkHeaders(linkHeaders);
    let typeLinks: Array<string> = parsedLinkHeaders.allValues(LinkRelations.TYPE);
    if (typeLinks !== null) {
        return !!typeLinks.find(HttpResourceAccessor.isContainer);
    }
    return false;
  }

    protected static isContainer (type: string) {
        return type === LdpVocabulary.CONTAINER || type === LdpVocabulary.BASIC_CONTAINER;
    }

    /**
   * Determine a resource type by parsing Link rel=type headers
   * @param headers to parse
   * @return Type of resource
   */
  private getResourceTypeFromHeaders(headers: ResourceAttributes | null): ShapeTreeResourceType | null {
    let linkHeaders: Array<string> | null = headers == null
        ? null
        : headers.allValues(HttpHeaders.LINK);
    if (linkHeaders === null) {
      return null;
    }
    let parsedLinkHeaders: ResourceAttributes = ResourceAttributes.parseLinkHeaders(linkHeaders);
    let typeLinks: Array<string> = parsedLinkHeaders.allValues(LinkRelations.TYPE);
    if (typeLinks != null && !!typeLinks.find(HttpResourceAccessor.isContainer)) {
      return ShapeTreeResourceType.CONTAINER;
    }
    if (HttpResourceAccessor.supportedRDFContentTypes.has(headers!.firstValue(HttpHeaders.CONTENT_TYPE) || '')) {
      // orElse("") because contains(null) throw NPE
      return ShapeTreeResourceType.RESOURCE;
    }
    return ShapeTreeResourceType.NON_RDF;
  }

  /**
   * Looks for the presence of the http://www.w3.org/ns/shapetrees#managedBy HTTP Link Relation in the
   * provided <code>parsedLinkHeaders</code>, with a valid target URL of a {@link ShapeTreeManager} associated
   * with the provided <code>url</code>.
   * @param url URL of the (potentially) managed resource
   * @param parsedLinkHeaders Parsed HTTP Link headers to evaluate
   * @return
   * @throws ShapeTreeException
   */
  private calculateManagerUrl(url: URL, parsedLinkHeaders: ResourceAttributes): URL | null /* throws ShapeTreeException */ {
    const optManagerString: string | null = parsedLinkHeaders.firstValue(LinkRelations.MANAGED_BY);
    if (optManagerString === null) {
      log.info("The resource {} does not contain a link header of {}", url, LinkRelations.MANAGED_BY);
      return null;
    }
    let managerUrlString: string = optManagerString;
    try {
      return new URL(managerUrlString, url);
    } catch (ex: any) {
       throw new ShapeTreeException(500, "Malformed relative URL <" + managerUrlString + "> (resolved from <" + url + ">)");
     }
  }

  /**
   * Looks for the presence of the http://www.w3.org/ns/shapetrees#manages HTTP Link Relation in the
   * provided <code>parsedLinkHeaders</code>, with a valid target URL of a {@link ManagedResource}. Falls
   * back to a relatively crude inference when the more reliable header isn't available
   * @param managerUrl URL of the {@link ShapeTreeManager}
   * @param parsedLinkHeaders Parsed link headers from {@link ManagerResource} response
   * @return URL of {@link ManagedResource}
   * @throws ShapeTreeException
   */
  private calculateManagedUrl(managerUrl: URL, parsedLinkHeaders: ResourceAttributes): URL /* throws ShapeTreeException */ {
    let managedUrlString: string;
    let managedResourceUrl: URL;
    const optManagedString: string | null = parsedLinkHeaders.firstValue(LinkRelations.MANAGES);
    if (optManagedString !== null) {
      managedUrlString = optManagedString;
    } else {
      // Attempt to (crudely) infer based on path calculation
      // If this implementation uses a dot notation for meta, trim it from the path
      // Rebuild without the query string in case that was employed
      managedUrlString = managerUrl.pathname.replace(".shapetree", "");
    }
    try {
      managedResourceUrl = new URL(managedUrlString, managerUrl);
    } catch (ex) {
       throw new ShapeTreeException(500, "Can't calculate managed resource for shape tree manager <" + managerUrl + ">");
     }
    return managedResourceUrl;
  }

  /**
   * Calculates the name of the resource itself, removing any leading path and any trailing slash. In
   * the event that the resource is '/', then '/' will be returned.
   * @param url URL of the resource to evaluate
   * @return Name of resource
   */
  private calculateName(url: URL): string {
    let path: string = url.pathname;
    if (path === "/")
      return "/";
    // if this is a container, trim the trailing slash
    if (path.endsWith("/")) {
      path = path.substring(0, path.length - 1);
    }
    let pathIndex: number = path.lastIndexOf('/');
    // No slashes in the path
    if (pathIndex === -1) {
      return path;
    }
    return path.substring(path.lastIndexOf('/') + 1);
  }

  /**
   * Determine whether <code>url</code> is a {@link ManagerResource}. Since this is a completely HTTP based
   * resource processor, this determination can't be made with special server-side knowledge about
   * the nature of the resources it serves. Instead, this must be derived based on information
   * present in the HTTP response from the server.
   * @param url URL of the resource that is being evaluated
   * @param exists whether the resource at <code>url</code> exists
   * @param parsedLinkHeaders Parsed HTTP Link headers from the response for <code>url</code>
   * @return True if {@link ManagerResource}
   */
  private calculateIsManager(url: URL, exists: boolean, parsedLinkHeaders: ResourceAttributes): boolean {
    // If the resource has an HTTP Link header of type of https://www.w3.org/ns/shapetrees#managedBy
    // with a manager target, it is not a manager resource (because it is managed by one)
    if (exists && parsedLinkHeaders.firstValue(LinkRelations.MANAGED_BY) !== null) {
      return false;
    }
    // If the resource has an HTTP Link header of type of https://www.w3.org/ns/shapetrees#manages
    // it is a manager resource (because it manages another one).
    if (exists && parsedLinkHeaders.firstValue(LinkRelations.MANAGES) !== null) {
      return true;
    }
    // If the resource doesn't exist, attempt to infer based on the URL
    if (url.pathname != null && url.pathname.match(".*\\.shapetree$")) {
      return true;
    }
    return url.search != null && !!url.search.match(".*ext\\=shapetree$");
  }

  public static expectNotNull<T> (expected: T | null, makeError: () => ShapeTreeException): T | never {
    if (expected === null)
        throw makeError();
    return expected;
  }
}
