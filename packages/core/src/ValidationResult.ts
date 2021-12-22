// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeAssignment } from './ShapeTreeAssignment';
import { ShapeTree } from './ShapeTree';

export class ValidationResult {

   private valid: boolean;

   private validatingShapeTree: ShapeTree | null;

   private matchingShapeTree: ShapeTree | null;

   private managingAssignment: ShapeTreeAssignment | null;

   private matchingFocusNode: URL | null;

   private message: string | null;

  public isValid(): boolean {
    return (this.valid != null && this.valid);
  }
/*
  public constructor(valid: boolean, message: string) {
    this.valid = valid;
    this.message = message;
    this.validatingShapeTree = null;
    this.matchingShapeTree = null;
    this.managingAssignment = null;
    this.matchingFocusNode = null;
  }

  public constructor(valid: boolean, validatingShapeTree: ShapeTree) {
    this.valid = valid;
    this.message = null;
    this.validatingShapeTree = validatingShapeTree;
    this.matchingShapeTree = null;
    this.managingAssignment = null;
    this.matchingFocusNode = null;
  }
*/
  public constructor(valid: boolean, validatingShapeTree: ShapeTree | null, message: string);/* {
    this.valid = valid;
    this.message = message;
    this.validatingShapeTree = validatingShapeTree;
    this.matchingShapeTree = null;
    this.managingAssignment = null;
    this.matchingFocusNode = null;
  }

  public constructor(valid: boolean, validatingShapeTree: ShapeTree, matchingFocusNode: URL) {
    this.valid = valid;
    this.message = null;
    this.validatingShapeTree = validatingShapeTree;
    this.matchingShapeTree = null;
    this.managingAssignment = null;
    this.matchingFocusNode = matchingFocusNode;
  }
*/
  public constructor(valid: boolean, validatingShapeTree: ShapeTree, matchingShapeTree: ShapeTree, matchingFocusNode: URL | null);
  public constructor(valid: boolean, validatingShapeTree: ShapeTree | null, matchingShapeTree: ShapeTree | string, matchingFocusNode: URL | null = null) {
    this.valid = valid;
    if (matchingShapeTree instanceof ShapeTree) {
      this.message = null;
      this.matchingShapeTree = matchingShapeTree;
    } else {
      this.message = matchingShapeTree;
      this.matchingShapeTree = null;
    }
    this.validatingShapeTree = validatingShapeTree;
    this.matchingFocusNode = matchingFocusNode;
    this.managingAssignment = null;
  }
/*
  public constructor(valid: boolean, validatingShapeTree: ShapeTree, matchingShapeTree: ShapeTree, managingAssignment: ShapeTreeAssignment, matchingFocusNode: URL, message: string) {
    this.valid = valid;
    this.validatingShapeTree = validatingShapeTree;
    this.matchingShapeTree = matchingShapeTree;
    this.managingAssignment = managingAssignment;
    this.matchingFocusNode = matchingFocusNode;
    this.message = message;
  }
*/
  public getValid(): boolean {
    return this.valid;
  }

  public getValidatingShapeTree(): ShapeTree | null {
    return this.validatingShapeTree;
  }

  public getMatchingShapeTree(): ShapeTree | null {
    return this.matchingShapeTree;
  }

  public getManagingAssignment(): ShapeTreeAssignment | null {
    return this.managingAssignment;
  }

  public getMatchingFocusNode(): URL | null {
    return this.matchingFocusNode;
  }

  public getMessage(): string | null {
    return this.message;
  }
}
