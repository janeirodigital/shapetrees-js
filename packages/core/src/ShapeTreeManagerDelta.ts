// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { ShapeTreeAssignment } from './ShapeTreeAssignment';
import { ShapeTreeManager } from './ShapeTreeManager';

export class ShapeTreeManagerDelta {

   private existingManager: ShapeTreeManager | null = null;
   private updatedManager: ShapeTreeManager | null = null;
   private updatedAssignments: Array<ShapeTreeAssignment> = [];
   private removedAssignments: Array<ShapeTreeAssignment> = [];

  /**
   * Compares an updated ShapeTreeManager (updatedManager) with an existing one (existingManager). Neither may
   * be null, managers with no assignments are acceptable for the purposes of comparison.
   * @param existingManager
   * @param updatedManager
   * @return ShapeTreeManagerDelta
   */
  public static evaluate(existingManager: ShapeTreeManager, updatedManager: ShapeTreeManager): ShapeTreeManagerDelta /* throws ShapeTreeException */ {
    if (existingManager === null && updatedManager === null) {
      throw new ShapeTreeException(422, "Cannot compare two null managers");
    }
    let delta: ShapeTreeManagerDelta = new ShapeTreeManagerDelta();

    delta.existingManager = existingManager;
    delta.updatedManager = updatedManager;
    delta.updatedAssignments = new Array();
    delta.removedAssignments = new Array();

    if (updatedManager === null || updatedManager.getAssignments().length === 0) {
      // All assignments have been removed in the updated manager, so any existing assignments should
      // similarly be removed. No need for further comparison.
      delta.removedAssignments = existingManager.getAssignments();
      return delta;
    }

    if (existingManager === null || existingManager.getAssignments().length === 0) {
      // This existing manager doesn't have any assignments (which means it shouldn't exist)
      // Anything in the updated manager is being added as new. No need for further comparison.
      delta.updatedAssignments = updatedManager.getAssignments();
      return delta;
    }

    for (const existingAssignment of existingManager.getAssignments()) {
      // Assignments match, and are unchanged, so continue
      if (updatedManager.getAssignmentById(existingAssignment.getUrl())) {
        continue;
      }
      // Assignments have the same URL but are different, so update
      let updatedAssignment: ShapeTreeAssignment | null = ShapeTreeManagerDelta.containsSameUrl(existingAssignment, updatedManager.getAssignments());
      if (updatedAssignment != null) {
        delta.updatedAssignments.push(updatedAssignment);
        continue;
      }
      // existing assignment isn't in the updated assignment, so remove
      delta.removedAssignments.push(existingAssignment);
    }
    for (const updatedAssignment of updatedManager.getAssignments()) {
      // Assignments match, and are unchanged, so continue
      if (existingManager.getAssignmentById(updatedAssignment.getUrl())) {
        continue;
      }
      // If this was already processed and marked as updated continue
      if (delta.updatedAssignments.find(assignment => assignment.getUrl() === updatedAssignment.getUrl())) {
        continue;
      }
      // updated assignment isn't in the existing assignments, so it is new, add it
      delta.updatedAssignments.push(updatedAssignment);
    }
    return delta;
  }

  public static containsSameUrl(assignment: ShapeTreeAssignment, targetAssignments: Array<ShapeTreeAssignment>): ShapeTreeAssignment | null /* throws ShapeTreeException */ {
    for (const targetAssignment of targetAssignments) {
      let assignmentUri: URL;
      let targetAssignmentUri: URL;
      try {
        assignmentUri = assignment.getUrl();
        targetAssignmentUri = targetAssignment.getUrl();
      } catch (ex: any) {
         throw new ShapeTreeException(500, "Unable to convert assignment URLs for comparison: " + ex.message);
       }
      if (assignmentUri === targetAssignmentUri) {
        return targetAssignment;
      }
    }
    return null;
  }

  public allRemoved(): boolean {
    return (!this.isUpdated() && this.existingManager !== null && this.removedAssignments.length === this.existingManager.getAssignments().length);
  }

  public isUpdated(): boolean {
    return this.updatedAssignments.length !== 0;
  }

  public wasReduced(): boolean {
    return this.removedAssignments.length !== 0;
  }

  public getExistingManager(): ShapeTreeManager | null {
    return this.existingManager;
  }

  public getUpdatedManager(): ShapeTreeManager | null {
    return this.updatedManager;
  }

  public getUpdatedAssignments(): Array<ShapeTreeAssignment> {
    return this.updatedAssignments;
  }

  public getRemovedAssignments(): Array<ShapeTreeAssignment> {
    return this.removedAssignments;
  }
}
