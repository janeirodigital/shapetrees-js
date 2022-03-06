// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { GraphHelper } from './helpers/GraphHelper';
import { RdfVocabulary } from './vocabularies/RdfVocabulary';
import { ShapeTreeVocabulary } from './vocabularies/ShapeTreeVocabulary';
import { ShapeTreeAssignment } from './ShapeTreeAssignment';
import { ShapeTree } from './ShapeTree';
import {DataFactory, NamedNode, Quad, Store} from "n3";
import {ShapeTreeFactory} from "./ShapeTreeFactory";
import {URL} from "url";

/**
 * ShapeTreeManager
 *
 * Shape Trees, §3:  A shape tree manager associates a managed resource with one or more shape trees. No more
 * than one shape tree manager may be associated with a managed resource. A shape tree manager includes
 * one or more shape tree assignments via st:hasAssignment.
 * https://shapetrees.org/TR/specification/#manager
 */
export class ShapeTreeManager {

   private readonly id: URL;

  // Each ShapeTreeManager has one or more ShapeTreeAssignments
   private readonly assignments: Array<ShapeTreeAssignment> = [];

  /**
   * Constructor for a new ShapeTreeManager
   * @param id URL of the ShapeTreeManager resource
   */
  public constructor(id: URL) {
    this.id = id;
  }

  public toString():string {
    return `ShapeTreeManager{
    id=${this.id}
    assignments=[${this.assignments.map(a => a.toString().replace(/\n/g, "\n    "))}]
}`;
  }

  /**
   * Get the URL (identifier) of the ShapeTreeManager
   * @return URL identifier of the ShapeTreeManager
   */
  protected getUrl(): URL {
    return this.id;
  }

  /**
   * Get the ShapeTreeManager as an RDF Graph
   * @return Graph of the ShapeTreeManager
   * @throws ShapeTreeException
   */
  public getGraph(): Store /* throws ShapeTreeException */ {
    let managerGraph: Store = GraphHelper.getEmptyGraph();
    let managerSubject: URL = this.getUrl();
    // <> a st:Manager
    managerGraph.add(GraphHelper.newTriple(managerSubject, new URL(RdfVocabulary.TYPE), new URL(ShapeTreeVocabulary.SHAPETREE_MANAGER)));
    // For each assignment create a blank node and populate
    for (const assignment of this.assignments.values()) {
      // <> st:hasAssignment <assignment1>, <assignment2>
      managerGraph.add(GraphHelper.newTriple(managerSubject, new URL(ShapeTreeVocabulary.HAS_ASSIGNMENT), assignment.getUrl()));
      const subject: URL = assignment.getUrl();
      managerGraph.add(GraphHelper.newTriple(subject, new URL(ShapeTreeVocabulary.ASSIGNS_SHAPE_TREE), assignment.getShapeTree()));
      managerGraph.add(GraphHelper.newTriple(subject, new URL(ShapeTreeVocabulary.MANAGES_RESOURCE), assignment.getManagedResource()));
      managerGraph.add(GraphHelper.newTriple(subject, new URL(ShapeTreeVocabulary.HAS_ROOT_ASSIGNMENT), assignment.getRootAssignment()));
      if (assignment.getShape() !== null) {
        managerGraph.add(GraphHelper.newTriple(subject, new URL(ShapeTreeVocabulary.SHAPE), assignment.getShape()!));
      }
      if (assignment.getFocusNode() !== null) {
        managerGraph.add(GraphHelper.newTriple(subject, new URL(ShapeTreeVocabulary.FOCUS_NODE), assignment.getFocusNode()!));
      }
    }
    return managerGraph;
  }

  /**
   * Add a {@link com.janeirodigital.shapetrees.core.ShapeTreeAssignment} to the ShapeTreeManager.
   * @param assignment Shape tree assignment to add
   * @throws ShapeTreeException
   */
  public addAssignment(assignment: ShapeTreeAssignment | null): void /* throws ShapeTreeException */ {
    if (assignment === null) {
      throw new ShapeTreeException(500, "Must provide a non-null assignment to an initialized List of assignments");
    }
    let key = assignment.getUrl();
    if (this.assignments.find(existingAssignment => existingAssignment.equals(assignment))) {
      throw new ShapeTreeException(422, "Identical shape tree assignment cannot be added to Shape Tree Manager: " + this.id);
    }
    this.assignments.push(assignment);
  }

  /**
   * Generates or "mints" a URL for a new ShapeTreeAssignment
   * @return URL minted for a new shape tree assignment
   */
  public inventAssignmentUrl(): URL {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let fragment: string = Array.from(Array(8).keys()).map(() => characters[Math.floor(Math.random() * characters.length)]).join('')
    let assignmentString: string = this.getUrl().toString() + "#" + fragment;
    try {
      return new URL(assignmentString);
    } catch (ex: any) {
       throw new Error("Minted illegal URL <" + assignmentString + "> - " + ex.message);
     }
  }

  /**
   * Ensure a proposed URL for a new ShapeTreeAssigment doesn't conflict with
   * other assignment URLs already allocated for the ShapeTreeManager
   * @param proposedAssignmentUrl URL of the proposed shape tree assignment
   * @return Minted URL for a new shape tree assignment
   */
  public mintAssignmentUrl(proposedAssignmentUrl: URL = this.inventAssignmentUrl()): URL {
    if (this.assignments.find(existingAssignment => existingAssignment.getUrl().href === proposedAssignmentUrl.href)) {
      return this.mintAssignmentUrl();
    }
    return proposedAssignmentUrl;
  }

  public async getContainingAssignments(): Promise<Array<ShapeTreeAssignment>> /* throws ShapeTreeException */ {

    const containingAssignments: Array<ShapeTreeAssignment> = [];

    for (let assignment of this.assignments.values()) {
      const shapeTree = await ShapeTreeFactory.getShapeTree(assignment.getShapeTree());
      if (shapeTree.getContains().length !== 0) {
        containingAssignments.push(assignment);
      }
    }

    return containingAssignments;
  }

  public static getFromGraph(id: URL, managerGraph: Store): ShapeTreeManager /* throws ShapeTreeException */ {
    let manager: ShapeTreeManager = new ShapeTreeManager(id);
    // Look up the ShapeTreeManager in the ManagerResource Graph via (any subject node, rdf:type, st:ShapeTreeManager)
    let managerTriples: Array<Quad> = managerGraph.getQuads(null, DataFactory.namedNode(RdfVocabulary.TYPE), DataFactory.namedNode(ShapeTreeVocabulary.SHAPETREE_MANAGER), null);
    // Shape Trees, §3: No more than one shape tree manager may be associated with a managed resource.
    // https://shapetrees.org/TR/specification/#manager
    if (managerTriples.length > 1) {
      throw new Error("Multiple ShapeTreeManager instances found: " + managerTriples.length);
    } else if (managerTriples.length === 0) {
      // Given the fact that a manager resource exists, there should never be a case where the manager resource
      // exists but no manager is found inside of it.
      throw new Error("No ShapeTreeManager instances found.");
    }
    // Get the URL of the ShapeTreeManager subject node
    let managerUrl: string = managerTriples[0].subject.value; // TODO: what if not a URL?
    // Look up ShapeTreeAssignment nodes (manager subject node, st:hasAssignment, any st:hasAssignment nodes).
    // There should be one result per nested ShapeTreeAssignment, each identified by a unique url.
    // Shape Trees, §3: A shape tree manager includes one or more shape tree assignments via st:hasAssignment
    // https://shapetrees.org/TR/specification/#manager
    const s: NamedNode = DataFactory.namedNode(managerUrl);
    const stAssignment: NamedNode = DataFactory.namedNode(ShapeTreeVocabulary.HAS_ASSIGNMENT);
    let assignmentNodes: Array<Quad> = managerGraph.getQuads(s, stAssignment, null, null);
    // For each st:hasAssignment node, extract a new ShapeTreeAssignment
    for (const assignmentNode of assignmentNodes) {
      let id: URL = null!;
      try {
        if (assignmentNode.object.termType !== "NamedNode") {
          throw new Error("I'll be caught with the invalid URLs");
        }
        id = new URL(assignmentNode.object.value); // TODO: what if it's not a NamedNode?
      } catch (ex) {
        throw new ShapeTreeException(500, "Object of { " + s.value + " " + stAssignment.value + " " + assignmentNode.object.value + " } must be a URL.");
      }
      manager.assignments.push(ShapeTreeAssignment.getFromGraph(id, managerGraph));
    }
    return manager;
  }

  // public getAssignmentById(id: URL): ShapeTreeAssignment | null { // TODO: return list of assignments with same ST but different roots
  //   return this.assignments.get(id) || null;
  // }

  public getAssignmentForShapeTree(shapeTreeUrl: URL): ShapeTreeAssignment | null { // TODO: return list of assignments with same ST but different roots
    return Array.from(this.assignments.values()).find(assignment => assignment.getShapeTree().href === shapeTreeUrl.href) || null;
  }

  // Given a root assignment, lookup the corresponding assignment in a shape tree manager that has the same root assignment
  public getAssignmentForRoot(rootAssignment: ShapeTreeAssignment): ShapeTreeAssignment | null {
    if (this.getAssignments() === null || this.getAssignments().length === 0) {
      return null;
    }
    for (const assignment of this.getAssignments()) {
      if (rootAssignment.getUrl().href === assignment.getRootAssignment().href) {
        return assignment;
      }
    }
    return null;
  }

  public removeAssignment(assignment: ShapeTreeAssignment | null): void {
    if (assignment === null) {
      throw new Error("Cannot remove a null assignment");
    }
    if (this.assignments.length === 0) {
      throw new Error("Cannot remove assignments from empty set");
    }
    let idx = this.assignments.indexOf(assignment);
    if (idx === -1) {
      throw new Error("Cannot remove assignment that does not exist in set");
    }
    this.assignments.splice(idx, 1);
  }

  public removeAssignmentForShapeTree(shapeTreeUrl: URL): void {
    this.removeAssignment(this.getAssignmentForShapeTree(shapeTreeUrl));
  }

  public getId(): URL {
    return this.id;
  }

  public getAssignments(): Array<ShapeTreeAssignment> {
    return Array.from(this.assignments.values());
  }

  public containsAssignment(lookFor: ShapeTreeAssignment): ShapeTreeAssignment | null {
    for (const sta of this.assignments.values()) {
      if (sta.equals(lookFor)) return sta;
    }
    return null;
  }
}
