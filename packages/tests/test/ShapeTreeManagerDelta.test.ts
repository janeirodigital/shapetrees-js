// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { ShapeTreeManagerDelta } from '@shapetrees/core/src/ShapeTreeManagerDelta';

let existingManager: ShapeTreeManager = null!;
let updatedManager: ShapeTreeManager = null!;
let assignmentOne: ShapeTreeAssignment = null!;
let assignmentTwo: ShapeTreeAssignment = null!;
let assignmentThree: ShapeTreeAssignment = null!;
let assignmentFour: ShapeTreeAssignment = null!;
let assignmentFive: ShapeTreeAssignment = null!;

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)

beforeEach(() => {
    existingManager = new ShapeTreeManager(new URL("https://manager.example/#existing"));
    updatedManager = new ShapeTreeManager(new URL("https://manager.example/#updated"));
    assignmentOne = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#firstTree"), // ManageableResource
    new URL("http://data.example/resourceOne"), // RootAssignment
    new URL("http://data.example/resourceOne.shapetree#assignmentOne"), // FocusNode
    new URL("http://data.example/resourceOne#focus"), // Shape
    new URL("http://shapes.example/#firstShape"), // Uri
    new URL("http://data.example/resourceOne.shapetree#assignmentOne"));
    assignmentTwo = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#secondTree"), // ManageableResource
    new URL("http://data.example/resourceTwo"), // RootAssignment
    new URL("http://data.example/resourceTwo.shapetree#assignmentTwo"), // FocusNode
    new URL("http://data.example/resourceTwo#focus"), // Shape
    new URL("http://shapes.example/#secondShape"), // Uri
    new URL("http://data.example/resourceTwo.shapetree#assignmentTwo"));
    assignmentThree = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#thirdTree"), // ManageableResource
    new URL("http://data.example/resourceThree"), // RootAssignment
    new URL("http://data.example/resourceThree.shapetree#assignmentThree"), // FocusNode
    new URL("http://data.example/resourceThree#focus"), // Shape
    new URL("http://shapes.example/#thirdShape"), // Uri
    new URL("http://data.example/resourceThree.shapetree#assignmentThree"));
    assignmentFour = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#fourthTree"), // ManageableResource
    new URL("http://data.example/resourceFour"), // RootAssignment
    new URL("http://data.example/resourceFour.shapetree#assignmentFour"), // FocusNode
    new URL("http://data.example/resourceFour#focus"), // Shape
    new URL("http://shapes.example/#fourthShape"), // Uri
    new URL("http://data.example/resourceFour.shapetree#assignmentFour"));
    assignmentFive = new ShapeTreeAssignment(// ShapeTree
    new URL("http://shapetrees.example/#fifthTree"), // ManageableResource
    new URL("http://data.example/resourceFive"), // RootAssignment
    new URL("http://data.example/resourceFive.shapetree#assignmentFive"), // FocusNode
    new URL("http://data.example/resourceFive#focus"), // Shape
    new URL("http://shapes.example/#fifthShape"), // Uri
    new URL("http://data.example/resourceFive.shapetree#assignmentFive"));
})

// deleteAllExistingAssignments
test("Delete all existing assignments", () => {
    // Compare an existing manager with multiple assignments with an empty updated manager
    // This should show that all assignments are removed with none left
    existingManager.addAssignment(assignmentOne);
    existingManager.addAssignment(assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.getUpdatedAssignments().length).toEqual(0);
    expect(2).toEqual(delta.getRemovedAssignments().length);
    expect(delta.allRemoved()).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(assignmentOne) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(assignmentTwo) !== -1).toEqual(true);
})

// deleteAllExistingAssignmentsAndAddNew
test("Delete existing assignments and add new ones", () => {
    existingManager.addAssignment(assignmentOne);
    existingManager.addAssignment(assignmentTwo);
    updatedManager.addAssignment(assignmentThree);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(true);
    expect(delta.allRemoved()).toEqual(false);
    expect(1).toEqual(delta.getUpdatedAssignments().length);
    expect(2).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThree) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(assignmentOne) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(assignmentTwo) !== -1).toEqual(true);
})

// deleteUpdateAndAddAssignments
test("Delete an assignment, update another, and add one", () => {
    // remove assignment one
    // update assignment two
    // add assignment four
    let assignmentThreeUpdated: ShapeTreeAssignment = duplicateAssignment(assignmentThree, new URL("http://shapetrees.pub/appleTree"), null);
    existingManager.addAssignment(assignmentOne);
    existingManager.addAssignment(assignmentTwo);
    existingManager.addAssignment(assignmentThree);
    updatedManager.addAssignment(assignmentTwo);
    updatedManager.addAssignment(assignmentThreeUpdated);
    updatedManager.addAssignment(assignmentFour);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(true);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(1).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThreeUpdated) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(assignmentFour) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(assignmentOne) !== -1).toEqual(true);
})

// updateAssignmentAndAddAnother
test("Update assignment and add another", () => {
    let assignmentThreeUpdated: ShapeTreeAssignment = duplicateAssignment(assignmentThree, new URL("http://shapetrees.pub/appleTree"), null);
    existingManager.addAssignment(assignmentThree);
    updatedManager.addAssignment(assignmentThreeUpdated);
    updatedManager.addAssignment(assignmentFour);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(false);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(0).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThreeUpdated) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(assignmentFour) !== -1).toEqual(true);
})

// DeleteAssignmentAndUpdateAnother
test("Delete assignment and update another", () => {
    let assignmentThreeUpdated: ShapeTreeAssignment = duplicateAssignment(assignmentThree, new URL("http://shapetrees.pub/appleTree"), null);
    existingManager.addAssignment(assignmentTwo);
    existingManager.addAssignment(assignmentThree);
    updatedManager.addAssignment(assignmentThreeUpdated);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(true);
    expect(delta.allRemoved()).toEqual(false);
    expect(1).toEqual(delta.getUpdatedAssignments().length);
    expect(1).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentThreeUpdated) !== -1).toEqual(true);
    expect(delta.getRemovedAssignments().indexOf(assignmentTwo) !== -1).toEqual(true);
})

// AddNewAssignmentToEmptySet
test("Add a new assignments to an empty set", () => {
    updatedManager.addAssignment(assignmentOne);
    updatedManager.addAssignment(assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(false);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(0).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentOne) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(assignmentTwo) !== -1).toEqual(true);
})

// UpdateExistingAssignment
test("Update existing assignments", () => {
    let assignmentOneUpdated: ShapeTreeAssignment = duplicateAssignment(assignmentOne, null, new URL("http://data.example/resourceOne#Otherfocus"));
    let assignmentTwoUpdated: ShapeTreeAssignment = duplicateAssignment(assignmentTwo, null, new URL("http://data.example/resourceTwo#Otherfocus"));
    existingManager.addAssignment(assignmentOne);
    existingManager.addAssignment(assignmentTwo);
    updatedManager.addAssignment(assignmentOneUpdated);
    updatedManager.addAssignment(assignmentTwoUpdated);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    expect(delta.wasReduced()).toEqual(false);
    expect(delta.allRemoved()).toEqual(false);
    expect(2).toEqual(delta.getUpdatedAssignments().length);
    expect(0).toEqual(delta.getRemovedAssignments().length);
    expect(delta.getUpdatedAssignments().indexOf(assignmentOneUpdated) !== -1).toEqual(true);
    expect(delta.getUpdatedAssignments().indexOf(assignmentTwoUpdated) !== -1).toEqual(true);
})

// compareTwoNullManagers
test("Compare two null managers", () => {
    expect(() => ShapeTreeManagerDelta.evaluate(null, null)).toThrow(ShapeTreeException);
})

// checkNullsOnUpdatedManager
test("Check null values on updated manager", () => {
    existingManager.addAssignment(assignmentOne);
    existingManager.addAssignment(assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(existingManager, null);
    expect(delta.allRemoved()).toEqual(true);
    updatedManager.getAssignments().length = 0;
    delta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.allRemoved()).toEqual(true);
})

// checkNullsOnExistingManager
test("Check null values on existing manager", () => {
    updatedManager.addAssignment(assignmentOne);
    updatedManager.addAssignment(assignmentTwo);
    let delta: ShapeTreeManagerDelta = ShapeTreeManagerDelta.evaluate(null, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
    existingManager.getAssignments().length = 0;
    delta = ShapeTreeManagerDelta.evaluate(existingManager, updatedManager);
    expect(delta.isUpdated()).toEqual(true);
})

  function duplicateAssignment(assignment: ShapeTreeAssignment, /*const*/ shapeTree: URL | null, /*const*/ focusNode: URL | null): ShapeTreeAssignment /* throws MalformedURLException, ShapeTreeException */ {
    let duplicateAssignment: ShapeTreeAssignment = new ShapeTreeAssignment(shapeTree != null ? shapeTree : assignment.getShapeTree(), assignment.getManagedResource(), assignment.getRootAssignment(), focusNode != null ? focusNode : assignment.getFocusNode(), assignment.getShape(), assignment.getUrl());
    return duplicateAssignment;
  }
