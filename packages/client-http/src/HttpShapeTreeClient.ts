// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.client.http
import { ShapeTreeClient } from '@shapetrees/client-core/src/ShapeTreeClient';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
import { ManageableInstance } from '@shapetrees/core/src/ManageableInstance';
import { ManageableResource } from '@shapetrees/core/src/ManageableResource';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ShapeTree } from '@shapetrees/core/src/ShapeTree';
import { ShapeTreeFactory } from '@shapetrees/core/src/ShapeTreeFactory';
import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';
import { HttpHeaders } from '@shapetrees/core/src/enums/HttpHeaders';
import { LinkRelations } from '@shapetrees/core/src/enums/LinkRelations';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { HttpRequest } from './HttpRequest';
import { HttpResourceAccessor } from './HttpResourceAccessor';
import { HttpClient } from './HttpClient';
import {HttpClientFactoryManager} from "./HttpClientFactoryManager";
import { Writer } from "n3";
import * as log from 'loglevel';

export class HttpShapeTreeClient implements ShapeTreeClient {

   private useClientShapeTreeValidation: boolean = true;

  public isShapeTreeValidationSkipped(): boolean {
    return !this.useClientShapeTreeValidation;
  }

  public skipShapeTreeValidation(skipValidation: boolean): void {
    this.useClientShapeTreeValidation = !skipValidation;
  }

  /**
   * Discover the ShapeTreeManager associated with a given target resource.
   * Implements {@link ShapeTreeClient#discoverShapeTree}
   *
   * Shape Trees, §4.1: This operation is used by a client-side agent to discover any shape trees associated
   * with a given resource. If URL is a managed resource, the associated Shape Tree Manager will be returned.
   * https://shapetrees.org/TR/specification/#discover
   *
   * @param context ShapeTreeContext that would be used for authentication purposes
   * @param targetResource The URL of the target resource for shape tree discovery
   * @return
   * @throws ShapeTreeException
   */
  public async discoverShapeTree(context: ShapeTreeContext, targetResource: URL): Promise<ShapeTreeManager | null> /* throws ShapeTreeException */ {
    if (targetResource === null) {
      throw new ShapeTreeException(500, "Must provide a value target resource for discovery");
    }
    log.debug("Discovering shape tree manager managing {}", targetResource);
    // Lookup the target resource for pointer to associated shape tree manager
    const resourceAccessor: HttpResourceAccessor = new HttpResourceAccessor();
    let instance: ManageableInstance = await resourceAccessor.getInstance(context, targetResource);
    let manageableResource: ManageableResource = instance.getManageableResource();
    if (!manageableResource.isExists()) {
      log.debug("Target resource for discovery {} does not exist", targetResource);
      return null;
    }
    if (instance.wasRequestForManager()) {
      throw new ShapeTreeException(500, "Discovery target must not be a shape tree manager resource");
    }
    if (instance.isUnmanaged()) {
      return null;
    }
    return instance.getManagerResource().getManager();
  }

  /**
   * Shape Trees, §4.2: This operation marks an existing resource as being managed by one or more shape trees,
   * by associating a shape tree manager with the resource, and turning it into a managed resource.
   *
   * If the resource is already managed, the associated shape tree manager will be updated with another
   * shape tree assignment for the planted shape tree.
   *
   * If the resource is a container that already contains existing resources, and a recursive plant is requested,
   * this operation will perform a depth first traversal through the containment hierarchy, validating
   * and assigning as it works its way back up to the target root resource of this operation.
   *
   * https://shapetrees.org/TR/specification/#plant-shapetree
   *
   * @param context ShapeTreeContext that would be used for authentication purposes
   * @param targetResource The URL of the resource to plant on
   * @param targetShapeTree A URL representing the shape tree to plant for targetResource
   * @param focusNode An optional URL representing the target subject within targetResource used for shape validation
   * @return The URL of the Shape Tree Manager that was planted for targetResource
   * @throws ShapeTreeException
   */
  public async plantShapeTree(context: ShapeTreeContext, targetResource: URL, targetShapeTree: URL, focusNode: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || targetResource === null || targetShapeTree === null) {
      throw new ShapeTreeException(500, "Must provide a valid context, target resource, and target shape tree to the plant shape tree");
    }
    log.debug("Planting shape tree {} on {}: ", targetShapeTree, targetResource);
    log.debug("Focus node: {}", focusNode === null ? "None provided" : focusNode);
    const resourceAccessor: HttpResourceAccessor = new HttpResourceAccessor();
    // Lookup the shape tree
    let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(targetShapeTree);
    // Lookup the target resource
    let instance: ManageableInstance = await resourceAccessor.getInstance(context, targetResource);
    let manageableResource: ManageableResource = instance.getManageableResource();
    if (!manageableResource.isExists()) {
      return new DocumentResponse(new ResourceAttributes(), "Cannot find target resource to plant: " + targetResource, 404);
    }
    let manager: ShapeTreeManager;
    let managerResourceUrl: URL = instance.getManagerResource().getUrl();
    if (instance.isManaged()) {
      manager = HttpResourceAccessor.expectNotNull(await instance.getManagerResource().getManager(), () => new Error("Expected a manager at <" + managerResourceUrl + ">."));
    } else {
      manager = new ShapeTreeManager(managerResourceUrl);
    }
    // Initialize a shape tree assignment based on the supplied parameters
    let assignmentUrl: URL = manager.mintAssignmentUrl();
    let assignment: ShapeTreeAssignment = new ShapeTreeAssignment(targetShapeTree, targetResource, assignmentUrl, focusNode, shapeTree.getShape(), assignmentUrl);
    // Add the assignment to the manager
    manager.addAssignment(assignment);
    // Get an RDF version of the manager stored in a turtle string
    const writer = new Writer();
    writer.addQuads(manager.getGraph().getQuads(null, null, null, null));
    let asText: string;
    writer.end((err, res) => {
      if (err) throw err;
      asText = res;
    })
    // Build an HTTP PUT request with the manager graph in turtle as the content body + link header
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    let headers: ResourceAttributes = new ResourceAttributes();
    headers.maybeSet(HttpHeaders.AUTHORIZATION, context.getAuthorizationHeaderValue());
    return fetcher.fetchShapeTreeResponse(new HttpRequest("PUT", managerResourceUrl, headers, asText!, "text/turtle"));
  }

  public postManagedInstance(context: ShapeTreeContext, parentContainer: URL, focusNodes: Array<URL>, targetShapeTrees: Array<URL>, bodyString: string, contentType: string, proposedName: string, isContainer: boolean): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || parentContainer === null) {
      throw new ShapeTreeException(500, "Must provide a valid context and parent container to post shape tree instance");
    }
    log.debug("POST-ing shape tree instance to {}", parentContainer);
    log.debug("Proposed name: {}", proposedName === null ? "None provided" : proposedName);
    log.debug("Target Shape Tree: {}", targetShapeTrees === null || targetShapeTrees.length === 0 ? "None provided" : targetShapeTrees.toString());
    log.debug("Focus Node: {}", focusNodes === null || focusNodes.length === 0 ? "None provided" : focusNodes.toString());
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    let headers: ResourceAttributes = this.getCommonHeaders(context, focusNodes, targetShapeTrees, isContainer, proposedName, contentType);
    return fetcher.fetchShapeTreeResponse(new HttpRequest("POST", parentContainer, headers, bodyString, contentType));
  }

  // Create via HTTP PUT
  public updateManagedInstance(context: ShapeTreeContext, targetResource: URL, focusNodes: Array<URL>, bodyString: string, contentType: string, targetShapeTrees: Array<URL>, isContainer: boolean): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || targetResource === null) {
      throw new ShapeTreeException(500, "Must provide a valid context and target resource to create shape tree instance via PUT");
    }
    log.debug("Creating shape tree instance via PUT at {}", targetResource);
    log.debug("Target Shape Tree: {}", targetShapeTrees === null || targetShapeTrees.length === 0 ? "None provided" : targetShapeTrees.toString());
    log.debug("Focus Node: {}", focusNodes === null || focusNodes.length === 0 ? "None provided" : focusNodes.toString());
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    let headers: ResourceAttributes = this.getCommonHeaders(context, focusNodes, targetShapeTrees, isContainer, null, contentType);
    return fetcher.fetchShapeTreeResponse(new HttpRequest("PUT", targetResource, headers, bodyString, contentType));
  }

  // Update via HTTP PUT
  public putManagedInstance(context: ShapeTreeContext, targetResource: URL, focusNodes: Array<URL>, bodyString: string, contentType: string): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || targetResource === null) {
      throw new ShapeTreeException(500, "Must provide a valid context and target resource to update shape tree instance via PUT");
    }
    log.debug("Updating shape tree instance via PUT at {}", targetResource);
    log.debug("Focus Node: {}", focusNodes === null || focusNodes.length === 0 ? "None provided" : focusNodes.toString());
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    let headers: ResourceAttributes = this.getCommonHeaders(context, focusNodes, null, null, null, contentType);
    return fetcher.fetchShapeTreeResponse(new HttpRequest("PUT", targetResource, headers, bodyString, contentType));
  }

  public patchManagedInstance(context: ShapeTreeContext, targetResource: URL, focusNodes: Array<URL>, patchString: string): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || targetResource === null || patchString === null) {
      throw new ShapeTreeException(500, "Must provide a valid context, target resource, and PATCH expression to PATCH shape tree instance");
    }
    log.debug("PATCH-ing shape tree instance at {}", targetResource);
    log.debug("PATCH String: {}", patchString);
    log.debug("Focus Node: {}", focusNodes === null || focusNodes.length === 0 ? "None provided" : focusNodes.toString());
    let contentType: string = "application/sparql-update";
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    let headers: ResourceAttributes = this.getCommonHeaders(context, focusNodes, null, null, null, contentType);
    return fetcher.fetchShapeTreeResponse(new HttpRequest("PATCH", targetResource, headers, patchString, contentType));
  }

  public deleteManagedInstance(context: ShapeTreeContext, resourceUrl: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || resourceUrl === null) {
      throw new ShapeTreeException(500, "Must provide a valid context and target resource to DELETE shape tree instance");
    }
    log.debug("DELETE-ing shape tree instance at {}", resourceUrl);
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    let headers: ResourceAttributes = this.getCommonHeaders(context, null, null, null, null, null);
    return fetcher.fetchShapeTreeResponse(new HttpRequest("DELETE", resourceUrl, headers, null, null));
  }

  public async unplantShapeTree(context: ShapeTreeContext, targetResource: URL, targetShapeTree: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    if (context === null || targetResource === null || targetShapeTree === null) {
      throw new ShapeTreeException(500, "Must provide a valid context, target resource, and target shape tree to unplant");
    }
    log.debug("Unplanting shape tree {} managing {}: ", targetShapeTree, targetResource);
    // Lookup the target resource
    const resourceAccessor: HttpResourceAccessor = new HttpResourceAccessor();
    let instance: ManageableInstance = await resourceAccessor.getInstance(context, targetResource);
    let manageableResource: ManageableResource = instance.getManageableResource();
    if (!manageableResource.isExists()) {
      return new DocumentResponse(null, "Cannot find target resource to unplant: " + targetResource, 404);
    }
    if (instance.isUnmanaged()) {
      return new DocumentResponse(null, "Cannot unplant target resource that is not managed by a shapetree: " + targetResource, 500);
    }
    // Remove assignment from manager that corresponds with the provided shape tree
    let manager: ShapeTreeManager | null = HttpResourceAccessor.expectNotNull(await instance.getManagerResource().getManager(), () => new ShapeTreeException(500, "expected ShapeTree manager to unplant"));
    manager.removeAssignmentForShapeTree(targetShapeTree);
    let method: string;
    let body: string | null;
    let contentType: string | null;
    if (manager.getAssignments().length === 0) {
      method = "DELETE";
      body = null;
      contentType = null;
    } else {
      // Build an HTTP PUT request with the manager graph in turtle as the content body + link header
      method = "PUT";
      // Get a RDF version of the manager stored in a turtle string
      const writer = new Writer();
      writer.addQuads(manager.getGraph().getQuads(null, null, null, null));
      let asText: string;
      writer.end((err, res) => {
        if (err) throw err;
        asText = res;
      })
      body = asText!;
      contentType = "text/turtle";
    }
    let fetcher: HttpClient = HttpClientFactoryManager.getFactory().get(this.useClientShapeTreeValidation);
    return fetcher.fetchShapeTreeResponse(new HttpRequest(method, manager.getId(), // why no getCommonHeaders(context, null, null, null, null, null)
        null, body, contentType));
  }

  private getCommonHeaders(context: ShapeTreeContext, focusNodes: Array<URL> | null, targetShapeTrees: Array<URL> | null, isContainer: boolean | null, proposedResourceName: string | null, contentType: string | null): ResourceAttributes {
    let ret: ResourceAttributes = new ResourceAttributes();
    if (context.getAuthorizationHeaderValue() !== null) {
      ret.maybeSet(HttpHeaders.AUTHORIZATION, context.getAuthorizationHeaderValue());
    }
    if (isContainer !== null) {
      let resourceTypeUrl: string = isContainer ? "http://www.w3.org/ns/ldp#Container" : "http://www.w3.org/ns/ldp#Resource";
      ret.maybeSet(HttpHeaders.LINK, "<" + resourceTypeUrl + ">; rel=\"type\"");
    }
    if (focusNodes !== null && focusNodes.length !== 0) {
      for (const focusNode of focusNodes) {
        ret.maybeSet(HttpHeaders.LINK, "<" + focusNode + ">; rel=\"" + LinkRelations.FOCUS_NODE + "\"");
      }
    }
    if (targetShapeTrees !== null && targetShapeTrees.length !== 0) {
      for (const targetShapeTree of targetShapeTrees) {
        ret.maybeSet(HttpHeaders.LINK, "<" + targetShapeTree + ">; rel=\"" + LinkRelations.TARGET_SHAPETREE + "\"");
      }
    }
    if (proposedResourceName !== null) {
      ret.maybeSet(HttpHeaders.SLUG, proposedResourceName);
    }
    if (contentType !== null) {
      ret.maybeSet(HttpHeaders.CONTENT_TYPE, contentType);
    }
    return ret;
  }
}
