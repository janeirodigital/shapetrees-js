// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { RdfVocabulary } from './vocabularies/RdfVocabulary';
import { ShapeTreeVocabulary } from './vocabularies/ShapeTreeVocabulary';
import {Store, DataFactory, Quad} from 'n3';

/**
 * ShapeTreeAssignment
 *
 * Shape Trees, §3:  Each shape tree assignment identifies a shape tree associated with the managed resource,
 * the focus node for shape validation, and the information needed to navigate the physical hierarchy in
 * which that managed resource resides.
 * https://shapetrees.org/TR/specification/#manager
 */
// @EqualsAndHashCode
export class ShapeTreeAssignment {

  // Identifies the shape tree to be associated with the managed resource
   private readonly shapeTree: URL;

  // Identifies the resource managed by the shape tree assignment
   private readonly managedResource: URL;

  // Identifies the root shape tree assignment
   private readonly rootAssignment: URL;

  // Identifies the focus node for shape validation in the managed resource
   private readonly focusNode: URL | null;

  // Identifies the shape to which focusNode must conform
   private readonly shape: URL | null;
   private readonly url: URL;

  public constructor(shapeTree: URL, managedResource: URL, rootAssignment: URL, focusNode: URL | null, shape: URL | null, url: URL) /* throws ShapeTreeException */ {
    try {
      this.shapeTree = shapeTree;
      this.managedResource = managedResource;
      this.rootAssignment = rootAssignment;
      this.url = url;
      if (shape != null) {
        this.shape = shape;
        this.focusNode = focusNode;
      } else {
        this.shape = null;
        if (focusNode !== null) {
          throw new Error("Cannot provide a focus node when no shape has been provided");
        }
        this.focusNode = null;
      }
    } catch (ex: any) {
       throw new ShapeTreeException(500, "Failed to initialize shape tree assignment: " + ex.message);
     }
  }

  public static getFromGraph(url: URL, managerGraph: Store): ShapeTreeAssignment /* throws MalformedURLException, ShapeTreeException */ {
    let shapeTree: URL | null = null;
    let managedResource: URL | null = null;
    let rootAssignment: URL | null = null;
    let focusNode: URL | null = null;
    let shape: URL | null = null;
    // Look up the ShapeTreeAssignment in the ManagerResource Graph via its URL
    let assignmentTriples: Array<Quad> = managerGraph.getQuads(DataFactory.namedNode(url.href), null, null, null);
    // A valid assignment must have at least a shape tree, managed resource, and root assignment urls
    if (assignmentTriples.length < 3) {
      throw new Error("Incomplete shape tree assignment, Only " + assignmentTriples.length + " attributes found");
    }
    // Lookup and assign each triple in the nested ShapeTreeAssignment
    for (const assignmentTriple of assignmentTriples) {
      switch(assignmentTriple.predicate.value) {
        case RdfVocabulary.TYPE:
          if (assignmentTriple.object.termType !== 'NamedNode' || assignmentTriple.object.value !== ShapeTreeVocabulary.SHAPETREE_ASSIGNMENT) {
            throw new Error("Unexpected value: " + assignmentTriple.predicate.value);
          }
          break;
        case ShapeTreeVocabulary.ASSIGNS_SHAPE_TREE:
          shapeTree = new URL(assignmentTriple.object.value);
          break;
        case ShapeTreeVocabulary.HAS_ROOT_ASSIGNMENT:
          rootAssignment = new URL(assignmentTriple.object.value);
          break;
        case ShapeTreeVocabulary.MANAGES_RESOURCE:
          managedResource = new URL(assignmentTriple.object.value);
          break;
        case ShapeTreeVocabulary.SHAPE:
          shape = new URL(assignmentTriple.object.value);
          break;
        case ShapeTreeVocabulary.FOCUS_NODE:
          focusNode = new URL(assignmentTriple.object.value);
          break;
        default:
          throw new Error("Unexpected value: " + assignmentTriple.predicate.value);
      }
    }
    return new ShapeTreeAssignment(shapeTree!, managedResource!, rootAssignment!, focusNode!, shape!, url); // TODO: are these nullable?
  }

  public isRootAssignment(): boolean {
    return this.getUrl() === this.getRootAssignment();
  }

  public getShapeTree(): URL {
    return this.shapeTree;
  }

  public getManagedResource(): URL {
    return this.managedResource;
  }

  public getRootAssignment(): URL {
    return this.rootAssignment;
  }

  public getFocusNode(): URL | null {
    return this.focusNode;
  }

  public getShape(): URL | null {
    return this.shape;
  }

  public getUrl(): URL {
    return this.url;
  }

  public equals(other: ShapeTreeAssignment): boolean {
    return this.url.href === other.url.href &&
        this.shapeTree.href === other.shapeTree.href &&
        this.managedResource.href === other.managedResource.href &&
        this.rootAssignment.href === other.rootAssignment.href &&
        this.focusNode?.href === other.focusNode?.href &&
        this.shape?.href === other.shape?.href;
  }

  public toString(): string {
    return "ShapeTreeAssignment{" +
        "shapeTree=" + this.shapeTree +
        ", managedResource=" + this.managedResource +
        ", rootAssignment=" + this.rootAssignment +
        ", focusNode=" + this.focusNode +
        ", shape=" + this.shape +
        ", url=" + this.url +
        '}';
  }
}
