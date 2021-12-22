// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';

export class ShapeTreeReference {

   readonly referenceUrl: URL;

   readonly shapePath: string | null;

   readonly predicate: URL | null;

  public constructor(referenceUrl: URL, shapePath: string | null, predicate: URL | null) /* throws ShapeTreeException */ {
    this.referenceUrl = referenceUrl;
    if (shapePath === null && predicate === null) {
      throw new ShapeTreeException(500, "Shape tree reference must have either a shape path or a predicate");
    } else if (shapePath != null && predicate != null) {
      throw new ShapeTreeException(500, "Shape tree reference cannot have a shape path and a predicate");
    } else if (shapePath != null) {
      this.shapePath = shapePath;
      this.predicate = null;
    } else {
      this.predicate = predicate;
      this.shapePath = null;
    }
  }

  public viaShapePath(): boolean {
    return this.shapePath !== null;
  }

  public viaPredicate(): boolean {
    return this.predicate !== null;
  }

  public getReferenceUrl(): URL {
    return this.referenceUrl;
  }

  public getShapePath(): string | null {
    return this.shapePath;
  }

  public getPredicate(): URL | null {
    return this.predicate;
  }
}
