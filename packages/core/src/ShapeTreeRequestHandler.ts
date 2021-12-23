// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ResourceTypeAssignmentPriority } from './comparators/ResourceTypeAssignmentPriority';
import { HttpHeaders } from './enums/HttpHeaders';
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { RequestHelper } from './helpers/RequestHelper';
import { ResourceAccessor } from './ResourceAccessor';
import { ShapeTreeAssignment } from './ShapeTreeAssignment';
import { InstanceResource } from './InstanceResource';
import { ShapeTree } from './ShapeTree';
import { ValidationResult } from './ValidationResult';
import { ShapeTreeRequest } from './ShapeTreeRequest';
import { ResourceAttributes } from './ResourceAttributes';
import { ManageableInstance } from './ManageableInstance';
const TEXT_TURTLE = ManageableInstance.TEXT_TURTLE;
import { ShapeTreeManagerDelta } from './ShapeTreeManagerDelta';
import { DocumentResponse } from './DocumentResponse';
import { ShapeTreeContext } from './ShapeTreeContext';
import { ManageableResource } from './ManageableResource';
import { ShapeTreeManager } from './ShapeTreeManager';
import { ManagerResource } from './ManagerResource';
import {Store} from "n3";
import {ShapeTreeFactory} from "./ShapeTreeFactory";
import * as log from 'loglevel';

export class ShapeTreeRequestHandler {

   private static readonly DELETE: string = "DELETE";

   resourceAccessor: ResourceAccessor;

  public constructor(resourceAccessor: ResourceAccessor) {
    this.resourceAccessor = resourceAccessor;
  }

  private fail(message: string) {
    throw new ShapeTreeException(500, message);
  }

  public async manageShapeTree(manageableInstance: ManageableInstance, shapeTreeRequest: ShapeTreeRequest): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    let validationResponse: DocumentResponse | null;
    let updatedRootManager: ShapeTreeManager = this.ensureShapeTreeManagerExists(
      await RequestHelper.getIncomingShapeTreeManager(shapeTreeRequest, manageableInstance.getManagerResource()),
      "Expected manager document on ShapeTree-controlled <" + shapeTreeRequest.getUrl().href + ">."
    ); // TODO: vet and maybe backport to shapetrees-java
    let existingRootManager: ShapeTreeManager = this.ensureShapeTreeManagerExists(
      await manageableInstance.getManagerResource().getManager(),
      "Expected manager document <" + manageableInstance.getManageableResource().getManagerResourceUrl() + ">."
    ); // TODO: vet and maybe backport to shapetrees-java
    // Determine assignments that have been removed, added, and/or updated
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingRootManager, updatedRootManager);
    // It is invalid for a manager resource to be left with no assignments.
    // Shape Trees, §3: A shape tree manager includes one or more shape tree assignments via st:hasAssignment.
    if (delta.allRemoved()) {
      this.ensureAllRemovedFromManagerByDelete(shapeTreeRequest);
    }
    if (delta.wasReduced()) {
      // An existing assignment has been removed from the manager for the managed resource.
      validationResponse = await this.unplantShapeTree(manageableInstance, manageableInstance.getShapeTreeContext(), delta);
      if (validationResponse !== null) {
        return validationResponse;
      }
    }
    if (delta.isUpdated()) {
      // An existing assignment has been updated, or new assignments have been added
      validationResponse = await this.plantShapeTree(manageableInstance, manageableInstance.getShapeTreeContext(), updatedRootManager, delta);
      if (validationResponse !== null) {
        return validationResponse;
      }
    }
    // TODO: Test: Need a test with reduce and updated delta to make sure we never return success from plant or unplant.
    return this.successfulValidation();
  }

  /**
   * Plants a shape tree on an existing resource
   * @param manageableInstance
   * @param shapeTreeContext
   * @param updatedRootManager
   * @param delta
   * @return DocumentResponse
   * @throws ShapeTreeException
   */
  public async plantShapeTree(manageableInstance: ManageableInstance, shapeTreeContext: ShapeTreeContext, updatedRootManager: ShapeTreeManager, delta: ShapeTreeManagerDelta): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    // Cannot directly update assignments that are not root locations
    this.ensureUpdatedAssignmentIsRoot(delta);
    // Run recursive assignment for each updated assignment in the root manager
    for (const rootAssignment of delta.getUpdatedAssignments()) {
      let validationResponse: DocumentResponse | null = await this.assignShapeTreeToResource(manageableInstance, shapeTreeContext, updatedRootManager, rootAssignment, rootAssignment, null);
      if (validationResponse !== null) {
        return validationResponse;
      }
    }
    return null;
  }

  public async unplantShapeTree(manageableInstance: ManageableInstance, shapeTreeContext: ShapeTreeContext, delta: ShapeTreeManagerDelta): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    // Cannot unplant a non-root location
    this.ensureRemovedAssignmentsAreRoot(delta);
    // Run recursive unassignment for each removed assignment in the updated root manager
    for (const rootAssignment of delta.getRemovedAssignments()) {
      let validationResponse: DocumentResponse | null = await this.unassignShapeTreeFromResource(manageableInstance, shapeTreeContext, rootAssignment);
      if (validationResponse !== null) {
        return validationResponse;
      }
    }
    return null;
  }

  // TODO: #87: do sanity checks on meta of meta, c.f. @see https://github.com/xformativ/shapetrees-java/issues/87
  public async createShapeTreeInstance(manageableInstance: ManageableInstance, containerResource: ManageableInstance, shapeTreeRequest: ShapeTreeRequest, proposedName: string): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    // Sanity check user-owned resource @@ delete 'cause type checks
    this.ensureInstanceResourceExists(containerResource.getManageableResource(), "Target container for resource creation not found");
    this.ensureRequestResourceIsContainer(containerResource.getManageableResource(), "Cannot create a shape tree instance in a non-container resource");
    // Prepare the target resource for validation and creation
    let targetResourceUrl: URL = RequestHelper.normalizeSolidResourceUrl(containerResource.getManageableResource().getUrl(), proposedName, shapeTreeRequest.getResourceType());
    this.ensureTargetResourceDoesNotExist(manageableInstance.getShapeTreeContext(), targetResourceUrl, "Cannot create target resource at " + targetResourceUrl + " because it already exists");
    this.ensureInstanceResourceExists(containerResource.getManagerResource(), "Should not be creating a shape tree instance on an unmanaged target container");
    let containerManager: ShapeTreeManager = this.ensureShapeTreeManagerExists(
        await containerResource.getManagerResource().getManager(),
        "Cannot have a shape tree manager resource without a shape tree manager containing at least one shape tree assignment"
    );
    // Get the shape tree associated that specifies what resources can be contained by the target container (st:contains)
    let containingAssignments: Array<ShapeTreeAssignment> = containerManager.getAssignments();
    // If there are no containing shape trees for the target container, request is valid and can be passed through
    if (containingAssignments.length === 0) {
      return null;
    }
    let targetShapeTrees: Array<URL> = RequestHelper.getIncomingTargetShapeTrees(shapeTreeRequest, targetResourceUrl);
    let incomingFocusNodes: Array<URL> = RequestHelper.getIncomingFocusNodes(shapeTreeRequest, targetResourceUrl);
    let incomingBodyGraph: Store | null = await RequestHelper.getIncomingBodyGraph(shapeTreeRequest, targetResourceUrl, null);
    let validationResults: Map<ShapeTreeAssignment, ValidationResult> = new Map();
    for (const containingAssignment of containingAssignments) {
      let containerShapeTreeUrl: URL = containingAssignment.getShapeTree();
      let containerShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(containerShapeTreeUrl);
      let validationResult: ValidationResult = await containerShapeTree.validateContainedResource(proposedName, shapeTreeRequest.getResourceType(), targetShapeTrees, incomingBodyGraph!, incomingFocusNodes); // TODO: could incomingBodyGraph be null here?
      if (!validationResult.isValid()) {
        return this.failValidation(validationResult);
      }
      validationResults.set(containingAssignment, validationResult);
    }

    // if any of the provided focus nodes weren't matched validation must fail
    let unmatchedNodes: Array<URL> = this.getUnmatchedFocusNodes(validationResults.values(), incomingFocusNodes);
    if (unmatchedNodes.length !== 0) {
      return this.failValidation(new ValidationResult(false, null, "Failed to match target focus nodes: " + unmatchedNodes));
    }
    log.debug("Creating shape tree instance at {}", targetResourceUrl);
    let createdInstance: ManageableInstance = this.resourceAccessor.createInstance(manageableInstance.getShapeTreeContext(), shapeTreeRequest.getMethod(), targetResourceUrl, shapeTreeRequest.getHeaders(), shapeTreeRequest.getBody(), shapeTreeRequest.getContentType());
    for (const containingAssignment of containingAssignments) {

      let rootShapeTreeAssignment: ShapeTreeAssignment = this.ensureAssignmentExists(
          await this.getRootAssignment(manageableInstance.getShapeTreeContext(), containingAssignment),
      "Unable to find root shape tree assignment at " + containingAssignment.getRootAssignment()
      );

      log.debug("Assigning shape tree to created resource: {}", createdInstance.getManagerResource().getUrl());
      // Note: By providing the positive advance validationResult, we let the assignment operation know that validation
      // has already been performed with a positive result, and avoid having it perform the validation a second time
      let assignResult: DocumentResponse | null = await this.assignShapeTreeToResource(createdInstance, manageableInstance.getShapeTreeContext(), null, rootShapeTreeAssignment!, containingAssignment, validationResults.get(containingAssignment) || null);
      if (assignResult !== null) {
        return assignResult;
      }
    }
    return this.successfulValidation();
  }

  public async updateShapeTreeInstance(targetResource: ManageableInstance, shapeTreeContext: ShapeTreeContext, shapeTreeRequest: ShapeTreeRequest): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    this.ensureInstanceResourceExists(targetResource.getManageableResource(), "Target resource to update not found");
    this.ensureInstanceResourceExists(targetResource.getManagerResource(), "Should not be updating an unmanaged resource as a shape tree instance");
    let manager: ShapeTreeManager = this.ensureShapeTreeManagerExists(
        await targetResource.getManagerResource().getManager(),
        "Cannot have a shape tree manager resource without a shape tree manager with at least one shape tree assignment"
    );
    for (const assignment of manager.getAssignments()) {
      // Evaluate the update against each ShapeTreeAssignment managing the resource.
      // All must pass for the update to validate
      let shapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(assignment.getShapeTree());
      let managedResourceUrl: URL = targetResource.getManageableResource().getUrl();
      let bodyGraph: Store | null = await RequestHelper.getIncomingBodyGraph(shapeTreeRequest, managedResourceUrl, targetResource.getManageableResource()); // TODO: what if null?
      let validationResult: ValidationResult = await shapeTree.validateResource(null, RequestHelper.getIncomingFocusNodes(shapeTreeRequest, managedResourceUrl), shapeTreeRequest.getResourceType(), bodyGraph!);
      if (!validationResult.isValid()) {
        return this.failValidation(validationResult);
      }
    }
    // No issues with validation, so the request is passed along
    return null;
  }

  public deleteShapeTreeInstance(): DocumentResponse | null {
    // Nothing to validate in a delete request, so the request is passed along
    return null;
  }

  protected async assignShapeTreeToResource(manageableInstance: ManageableInstance, shapeTreeContext: ShapeTreeContext, rootManager: ShapeTreeManager | null, rootAssignment: ShapeTreeAssignment, parentAssignment: ShapeTreeAssignment, advanceValidationResult: ValidationResult | null): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    let managingShapeTree: ShapeTree | null = null;
    let shapeTreeManager: ShapeTreeManager | null = null;
    let matchingFocusNode: URL | null = null;
    let managingAssignment: ShapeTreeAssignment | null = null;
    let validationResponse: DocumentResponse | null;

    this.ensureValidationResultIsUsableForAssignment(advanceValidationResult, "Invalid advance validation result provided for resource assignment");
    if (advanceValidationResult != null) {
      managingShapeTree = advanceValidationResult.getMatchingShapeTree();
    }
    if (advanceValidationResult != null) {
      matchingFocusNode = advanceValidationResult.getMatchingFocusNode();
    }
    if (this.atRootOfPlantHierarchy(rootAssignment, manageableInstance.getManageableResource())) {
      // If we are at the root of the plant hierarchy we don't need to validate the managed resource against
      // a shape tree managing a parent container. We only need to validate the managed resource against
      // the shape tree that is being planted at the root to ensure it conforms.
      managingShapeTree = await ShapeTreeFactory.getShapeTree(rootAssignment.getShapeTree());
      if (advanceValidationResult === null) {
        // If this validation wasn't performed in advance
        let validationResult: ValidationResult = await managingShapeTree.validateResource(manageableInstance.getManageableResource());
        if (!validationResult.isValid()) {
          return this.failValidation(validationResult);
        }
        matchingFocusNode = validationResult.getMatchingFocusNode();
      }
    } else {

      // Not at the root of the plant hierarchy. Validate proposed resource against the shape tree
      // managing the parent container, then extract the matching shape tree and focus node on success
      if (advanceValidationResult === null) {
        // If this validation wasn't performed in advance
        let parentShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(parentAssignment.getShapeTree());
        let validationResult: ValidationResult = await parentShapeTree.validateContainedResource(manageableInstance.getManageableResource());
        if (!validationResult.isValid()) {
          return this.failValidation(validationResult);
        }
        managingShapeTree = validationResult.getMatchingShapeTree();
        matchingFocusNode = validationResult.getMatchingFocusNode();
      }
    }

    shapeTreeManager = await this.getManagerForAssignment(manageableInstance, rootManager, rootAssignment);
    managingAssignment = this.getAssignment(manageableInstance.getManageableResource(), shapeTreeManager, rootAssignment, managingShapeTree!, matchingFocusNode); // TODO: ST can be null

    // If the primary resource is a container, and its shape tree specifies its contents with st:contains
    // Recursively traverse the hierarchy and perform shape tree assignment
    if (manageableInstance.getManageableResource().isContainer() && managingShapeTree!.getContains().length !== 0) { // TODO: ST can be null

      // If the container is not empty, perform a recursive, depth first validation and assignment for each
      // contained resource by recursively calling this method (assignShapeTreeToResource)
      // TODO - Provide a configurable maximum limit on contained resources for a recursive plant, generate ShapeTreeException
      let containedResources: Array<ManageableInstance> = await this.resourceAccessor.getContainedInstances(shapeTreeContext, manageableInstance.getManageableResource().getUrl());
      if (containedResources.length !== 0) {
        // Evaluate containers, then resources
        containedResources = containedResources.sort(ResourceTypeAssignmentPriority);
        for (const containedResource of containedResources) {
          validationResponse = await this.assignShapeTreeToResource(containedResource, shapeTreeContext, null, rootAssignment, managingAssignment, null);
          if (validationResponse !== null) {
            return validationResponse;
          }
        }
      }
    }
    if (manageableInstance.getManagerResource().isExists()) {
      // update manager resource
      this.resourceAccessor.updateResource(shapeTreeContext, "PUT", manageableInstance.getManagerResource(), shapeTreeManager.getGraph().toString());
    } else {
      // create manager resource
      let headers: ResourceAttributes = new ResourceAttributes();
      headers.setAll(HttpHeaders.CONTENT_TYPE, [TEXT_TURTLE]);
      this.resourceAccessor.createResource(shapeTreeContext, "POST", manageableInstance.getManagerResource().getUrl(), headers, shapeTreeManager.getGraph().toString(), TEXT_TURTLE);
    }
    return null;
  }

  protected async unassignShapeTreeFromResource(manageableInstance: ManageableInstance, shapeTreeContext: ShapeTreeContext, rootAssignment: ShapeTreeAssignment): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    this.ensureInstanceResourceExists(manageableInstance.getManageableResource(), "Cannot remove assignment from non-existent managed resource");
    this.ensureInstanceResourceExists(manageableInstance.getManagerResource(), "Cannot remove assignment from non-existent manager resource");

    let shapeTreeManager: ShapeTreeManager = (await manageableInstance.getManagerResource().getManager())!; // in principle, you shouldn't unassign if the manager doesn't exist -- TODO: verify
    let assignmentToRemove: ShapeTreeAssignment = shapeTreeManager.getAssignmentForRoot(rootAssignment)!; // likewise
    let assignedShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(assignmentToRemove.getShapeTree());

    let validationResponse: DocumentResponse | null;

    // If the managed resource is a container, and its shape tree specifies its contents with st:contains
    // Recursively traverse the hierarchy and perform shape tree unassignment
    if (manageableInstance.getManageableResource().isContainer() && assignedShapeTree.getContains().length !== 0) {

      // TODO - Should there also be a configurable maximum limit on unplanting?
      let containedResources: Array<ManageableInstance> = await this.resourceAccessor.getContainedInstances(shapeTreeContext, manageableInstance.getManageableResource().getUrl());
      // If the container is not empty
      if (containedResources.length !== 0) {
        // Sort contained resources so that containers are evaluated first, then resources
        containedResources = containedResources.sort(ResourceTypeAssignmentPriority);
        // Perform a depth first unassignment for each contained resource
        for (const containedResource of containedResources) {
          // Recursively call this function on the contained resource
          validationResponse = await this.unassignShapeTreeFromResource(containedResource, shapeTreeContext, rootAssignment);
          if (validationResponse !== null) {
            return validationResponse;
          }
        }
      }
    }
    shapeTreeManager.removeAssignment(assignmentToRemove);
    this.deleteOrUpdateManagerResource(shapeTreeContext, manageableInstance.getManagerResource(), shapeTreeManager);
    return null;
  }

  private deleteOrUpdateManagerResource(shapeTreeContext: ShapeTreeContext, managerResource: ManagerResource, shapeTreeManager: ShapeTreeManager): void /* throws ShapeTreeException */ {
    if (shapeTreeManager.getAssignments().length === 0) {
      let response: DocumentResponse = this.resourceAccessor.deleteResource(shapeTreeContext, managerResource);
      this.ensureDeleteIsSuccessful(response);
    } else {
      // Update the existing manager resource for the managed resource
      this.resourceAccessor.updateResource(shapeTreeContext, "PUT", managerResource, shapeTreeManager.getGraph().toString());
    }
  }

  private async getManagerForAssignment(manageableInstance: ManageableInstance, rootManager: ShapeTreeManager | null, rootAssignment: ShapeTreeAssignment): Promise<ShapeTreeManager> /* throws ShapeTreeException */ {
    let shapeTreeManager: ShapeTreeManager | null = null;
    let managerResourceUrl: URL = manageableInstance.getManagerResource().getUrl();

    // When at the top of the plant hierarchy, use the root manager from the initial plant request body
    // TODO: rootManager can be null so method could return null (does not in any test)
    if (this.atRootOfPlantHierarchy(rootAssignment, manageableInstance.getManageableResource())) {
      return <ShapeTreeManager>rootManager;
    }

    if (!manageableInstance.getManagerResource().isExists()) {
      // If the existing manager resource doesn't exist make a new shape tree manager
      shapeTreeManager = new ShapeTreeManager(managerResourceUrl);
    } else {
      // Get the existing shape tree manager from the manager resource graph
      // TODO - this was seemingly incorrect before it was adjusted. Needs to be debugged and confirmed as working properly now
      let managerGraph: Store = await manageableInstance.getManagerResource().getGraph(managerResourceUrl)!;
      shapeTreeManager = ShapeTreeManager.getFromGraph(managerResourceUrl, managerGraph);
    }
    return shapeTreeManager;
  }

  private getAssignment(manageableResource: ManageableResource, shapeTreeManager: ShapeTreeManager, rootAssignment: ShapeTreeAssignment, managingShapeTree: ShapeTree, matchingFocusNode: URL | null): ShapeTreeAssignment /* throws ShapeTreeException */ {
    if (this.atRootOfPlantHierarchy(rootAssignment, manageableResource)) {
      return rootAssignment;
    }
    // Mint a new assignment URL, since it wouldn't have been passed in the initial request body
    let assignmentUrl: URL = shapeTreeManager.mintAssignmentUrl();
    // Build the managed resource assignment
    let matchingNode: URL | null = matchingFocusNode === null ? null : matchingFocusNode;
    let managedResourceAssignment: ShapeTreeAssignment = new ShapeTreeAssignment(managingShapeTree.getId(), manageableResource.getUrl(), rootAssignment.getUrl(), matchingNode, managingShapeTree.getShape(), assignmentUrl);
    // Add the shape tree assignment to the shape tree managed for the managed resource
    shapeTreeManager.addAssignment(managedResourceAssignment);
    return managedResourceAssignment;
  }

  private atRootOfPlantHierarchy(rootAssignment: ShapeTreeAssignment, manageableResource: ManageableResource): boolean {
    return rootAssignment.getManagedResource() === manageableResource.getUrl();
  }

  // Return a root shape tree manager associated with a given shape tree assignment
  private getRootManager(shapeTreeContext: ShapeTreeContext, assignment: ShapeTreeAssignment): Promise<ShapeTreeManager | null> /* throws ShapeTreeException */ {
    let rootAssignmentUrl: URL = assignment.getRootAssignment();
    let instance: ManageableInstance = this.resourceAccessor.getInstance(shapeTreeContext, rootAssignmentUrl);
    return instance.getManagerResource().getManager();
  }

  // Return a root shape tree manager associated with a given shape tree assignment
  private async getRootAssignment(shapeTreeContext: ShapeTreeContext, assignment: ShapeTreeAssignment): Promise<ShapeTreeAssignment | null> /* throws ShapeTreeException */ {
    let rootManager: ShapeTreeManager | null = await this.getRootManager(shapeTreeContext, assignment); // TODO: could be null

    for (const rootAssignment of rootManager!.getAssignments()) {
      if (rootAssignment.getUrl() != null && rootAssignment.getUrl() === assignment.getRootAssignment()) {
        return rootAssignment;
      }
    }
    return null;
  }

  private getUnmatchedFocusNodes(validationResults: IterableIterator<ValidationResult>, focusNodes: Array<URL>): Array<URL> {
    let unmatchedNodes: Array<URL> = new Array();
    for (const focusNode of focusNodes) {
      // Determine if each target focus node was matched
      let matched: boolean = false;
      for (const validationResult of validationResults) {
        if (validationResult.getMatchingShapeTree()!.getShape() != null) { // TODO: could be null
          if (validationResult.getMatchingFocusNode() === focusNode) {
            matched = true;
          }
        }
      }
      if (!matched) {
        unmatchedNodes.push(focusNode);
      }
    }
    return unmatchedNodes;
  }

  private ensureValidationResultIsUsableForAssignment(validationResult: ValidationResult | null, message: string): void /* throws ShapeTreeException */ {
    // Null is a usable state of the validation result in the context of assignment
    if (validationResult != null && (validationResult.getValid() === null || validationResult.getMatchingShapeTree() === null || validationResult.getValidatingShapeTree() === null)) {
      throw new ShapeTreeException(400, message);
    }
  }

  private ensureInstanceResourceExists(instanceResource: InstanceResource, message: string): void /* throws ShapeTreeException */ {
    if (instanceResource === null || !instanceResource.isExists()) {
      throw new ShapeTreeException(404, message);
    }
  }

  private ensureRequestResourceIsContainer(shapeTreeResource: ManageableResource, message: string): void /* throws ShapeTreeException */ {
    if (!shapeTreeResource.isContainer()) {
      throw new ShapeTreeException(400, message);
    }
  }

  private ensureTargetResourceDoesNotExist(shapeTreeContext: ShapeTreeContext, targetResourceUrl: URL, message: string): void /* throws ShapeTreeException */ {
    let targetInstance: ManageableInstance = this.resourceAccessor.getInstance(shapeTreeContext, targetResourceUrl);
    if (targetInstance.wasRequestForManager() || targetInstance.getManageableResource().isExists()) {
      throw new ShapeTreeException(409, message);
    }
  }

  private ensureShapeTreeManagerExists(manager: ShapeTreeManager | null, message: string): ShapeTreeManager /* throws ShapeTreeException */ {
    if (manager === null || manager.getAssignments() === null || manager.getAssignments().length === 0) {
      throw new ShapeTreeException(400, message);
    }
    return manager;
  }

  private ensureAssignmentExists(assignment: ShapeTreeAssignment | null, message: string): ShapeTreeAssignment /* throws ShapeTreeException */ {
    if (assignment === null) {
      throw new ShapeTreeException(400, message);
    }
    return assignment;
  }

  // TODO: replace `ensureAssignmentExists` with `ensureExists` ? Doesn't look like it works for `ensureShapeTreeManagerExists`.
  private ensureExists<T>(checkMe: T | null, message: string): T /* throws ShapeTreeException */ {
    if (checkMe === null) {
      throw new ShapeTreeException(400, message);
    }
    return checkMe;
  }

  private ensureAllRemovedFromManagerByDelete(shapeTreeRequest: ShapeTreeRequest): void /* throws ShapeTreeException */ {
    if (shapeTreeRequest.getMethod() !== ShapeTreeRequestHandler.DELETE) {
      throw new ShapeTreeException(500, "Removal of all ShapeTreeAssignments from a ShapeTreeManager MUST use HTTP DELETE");
    }
  }

  private ensureRemovedAssignmentsAreRoot(delta: ShapeTreeManagerDelta): void /* throws ShapeTreeException */ {
    for (const assignment of delta.getRemovedAssignments()) {
      if (!assignment.isRootAssignment()) {
        throw new ShapeTreeException(500, "Cannot remove non-root assignment: " + assignment.getUrl().toString() + ". Must unplant root assignment at: " + assignment.getRootAssignment().toString());
      }
    }
  }

  private ensureUpdatedAssignmentIsRoot(delta: ShapeTreeManagerDelta): void /* throws ShapeTreeException */ {
    for (const updatedAssignment of delta.getUpdatedAssignments()) {
      if (!updatedAssignment.isRootAssignment()) {
        throw new ShapeTreeException(500, "Cannot update non-root assignment: " + updatedAssignment.getUrl().toString() + ". Must update root assignment at: " + updatedAssignment.getRootAssignment().toString());
      }
    }
  }

  private ensureDeleteIsSuccessful(response: DocumentResponse): void /* throws ShapeTreeException */ {
    let successCodes: Array<number> = [202, 204, 200];
    if (successCodes.indexOf(response.getStatusCode()) === -1) {
      throw new ShapeTreeException(500, "Failed to delete manager resource. Received " + response.getStatusCode() + ": " + response.getBody());
    }
  }

  private successfulValidation(): DocumentResponse {
    return new DocumentResponse(new ResourceAttributes(), "OK", 201);
  }

  private failValidation(validationResult: ValidationResult): DocumentResponse | null {
    return new DocumentResponse(new ResourceAttributes(), validationResult.getMessage() || "Unspecified validation failure", 422);
  }
}
