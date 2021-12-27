// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { ShapeTreeManagerDelta } from '@shapetrees/core/src/ShapeTreeManagerDelta';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ShapeTreeManagerDeltaTests {

   private static existingManager: ShapeTreeManager = null;

   private static updatedManager: ShapeTreeManager = null;

   private static assignmentOne: ShapeTreeAssignment = null;

   private static assignmentTwo: ShapeTreeAssignment = null;

   private static assignmentThree: ShapeTreeAssignment = null;

   private static assignmentFour: ShapeTreeAssignment = null;

   private static assignmentFive: ShapeTreeAssignment = null;

  // @BeforeEach
  beforeEach(): void /* throws ShapeTreeException, MalformedURLException */ {
    ShapeTreeManagerDeltaTests.existingManager = new ShapeTreeManager(new URL("https://manager.example/#existing"));
    ShapeTreeManagerDeltaTests.updatedManager = new ShapeTreeManager(new URL("https://manager.example/#updated"));
    ShapeTreeManagerDeltaTests.assignmentOne = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#firstTree"), // ManageableResource
    new URL("http://data.example/resourceOne"), // RootAssignment
    new URL("http://data.example/resourceOne.shapetree#assignmentOne"), // FocusNode
    new URL("http://data.example/resourceOne#focus"), // Shape
    new URL("http://shapes.example/#firstShape"), // Uri
    new URL("http://data.example/resourceOne.shapetree#assignmentOne"));
    ShapeTreeManagerDeltaTests.assignmentTwo = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#secondTree"), // ManageableResource
    new URL("http://data.example/resourceTwo"), // RootAssignment
    new URL("http://data.example/resourceTwo.shapetree#assignmentTwo"), // FocusNode
    new URL("http://data.example/resourceTwo#focus"), // Shape
    new URL("http://shapes.example/#secondShape"), // Uri
    new URL("http://data.example/resourceTwo.shapetree#assignmentTwo"));
    ShapeTreeManagerDeltaTests.assignmentThree = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#thirdTree"), // ManageableResource
    new URL("http://data.example/resourceThree"), // RootAssignment
    new URL("http://data.example/resourceThree.shapetree#assignmentThree"), // FocusNode
    new URL("http://data.example/resourceThree#focus"), // Shape
    new URL("http://shapes.example/#thirdShape"), // Uri
    new URL("http://data.example/resourceThree.shapetree#assignmentThree"));
    ShapeTreeManagerDeltaTests.assignmentFour = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#fourthTree"), // ManageableResource
    new URL("http://data.example/resourceFour"), // RootAssignment
    new URL("http://data.example/resourceFour.shapetree#assignmentFour"), // FocusNode
    new URL("http://data.example/resourceFour#focus"), // Shape
    new URL("http://shapes.example/#fourthShape"), // Uri
    new URL("http://data.example/resourceFour.shapetree#assignmentFour"));
    ShapeTreeManagerDeltaTests.assignmentFive = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#fifthTree"), // ManageableResource
    new URL("http://data.example/resourceFive"), // RootAssignment
    new URL("http://data.example/resourceFive.shapetree#assignmentFive"), // FocusNode
    new URL("http://data.example/resourceFive#focus"), // Shape
    new URL("http://shapes.example/#fifthShape"), // Uri
    new URL("http://data.example/resourceFive.shapetree#assignmentFive"));
  }

  // @SneakyThrows, @Test, @Label("Delete all existing assignments")
  deleteAllExistingAssignments(): void {
    // Compare an existing manager with multiple assignments with an empty updated manager
    // This should show that all assignments are removed with none left
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.getUpdatedAssignments().length).toEqual(0);
    expect(2).toEqual(delta.getRemovedAssignments().length);
    expect(delta.allRemoved()).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentOne) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentTwo) !== -1).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Delete existing assignments and add new ones")
  deleteAllExistingAssignmentsAndAddNew(): void {
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentThree);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(true);
    expect(delta.allRemoved()).toEqual(false);
    expect(1).toEqual(delta.getUpdatedAssignments().length);
    expect(2).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentThree) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentOne) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentTwo) !== -1).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Delete an assignment, update another, and add one")
  deleteUpdateAndAddAssignments(): void {
    // remove assignment one
    // update assignment two
    // add assignment four
    let assignmentThreeUpdated: ShapeTreeAssignment = this.duplicateAssignment(ShapeTreeManagerDeltaTests.assignmentThree, new URL("http://shapetrees.pub/appleTree"), null);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentThree);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(assignmentThreeUpdated);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentFour);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(true);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(1).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThreeUpdated) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentFour) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentOne) !== -1).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Update assignment and add another")
  updateAssignmentAndAddAnother(): void {
    let assignmentThreeUpdated: ShapeTreeAssignment = this.duplicateAssignment(ShapeTreeManagerDeltaTests.assignmentThree, new URL("http://shapetrees.pub/appleTree"), null);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentThree);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(assignmentThreeUpdated);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentFour);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(false);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(0).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThreeUpdated) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentFour) !== -1).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Delete assignment and update another")
  DeleteAssignmentAndUpdateAnother(): void {
    let assignmentThreeUpdated: ShapeTreeAssignment = this.duplicateAssignment(ShapeTreeManagerDeltaTests.assignmentThree, new URL("http://shapetrees.pub/appleTree"), null);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentThree);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(assignmentThreeUpdated);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(true);
    expect(delta.allRemoved()).toEqual(false);
    expect(1).toEqual(delta.getUpdatedAssignments().length);
    expect(1).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThreeUpdated) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentTwo) !== -1).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Add a new assignments to an empty set")
  AddNewAssignmentToEmptySet(): void {
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(false);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(0).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentOne) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(ShapeTreeManagerDeltaTests.assignmentTwo) !== -1).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Update existing assignments")
  UpdateExistingAssignment(): void {
    let assignmentOneUpdated: ShapeTreeAssignment = this.duplicateAssignment(ShapeTreeManagerDeltaTests.assignmentOne, null, new URL("http://data.example/resourceOne#Otherfocus"));
    let assignmentTwoUpdated: ShapeTreeAssignment = this.duplicateAssignment(ShapeTreeManagerDeltaTests.assignmentTwo, null, new URL("http://data.example/resourceTwo#Otherfocus"));
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(assignmentOneUpdated);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(assignmentTwoUpdated);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(false);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(0).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentOneUpdated) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(assignmentTwoUpdated) !== -1).toEqual(true);
  }

  // @Test, @Label("Compare two null managers")
  compareTwoNullManagers(): void {
    expect(() => ShapeTreeManagerDelta.evaluate(null, null)).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @SneakyThrows, @Test, @Label("Check null values on updated manager")
  checkNullsOnUpdatedManager(): void {
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.existingManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, null);
    expect(delta.allRemoved()).toEqual(true);
    ShapeTreeManagerDeltaTests.updatedManager.getAssignments().length = 0;
    delta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.allRemoved()).toEqual(true);
  }

  // @SneakyThrows, @Test, @Label("Check null values on existing manager")
  checkNullsOnExistingManager(): void {
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentOne);
    ShapeTreeManagerDeltaTests.updatedManager.addAssignment(ShapeTreeManagerDeltaTests.assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(null, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    ShapeTreeManagerDeltaTests.existingManager.getAssignments().length = 0;
    delta = ShapeTreeManagerDelta.evaluate(ShapeTreeManagerDeltaTests.existingManager, ShapeTreeManagerDeltaTests.updatedManager);
    expect(delta.isUpdated()).toEqual(true);
  }

  private duplicateAssignment(assignment: ShapeTreeAssignment, /*const*/ shapeTree: URL, /*const*/ focusNode: URL): ShapeTreeAssignment /* throws MalformedURLException, ShapeTreeException */ {
    let duplicateAssignment: ShapeTreeAssignment = new ShapeTreeAssignment(shapeTree != null ? shapeTree : assignment.getShapeTree(), assignment.getManagedResource(), assignment.getRootAssignment(), focusNode != null ? focusNode : assignment.getFocusNode(), assignment.getShape(), assignment.getUrl());
    return duplicateAssignment;
  }
}
