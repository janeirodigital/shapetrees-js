// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.comparators
import { ShapeTree } from '../ShapeTree';
import { ShapeTreeFactory } from '../ShapeTreeFactory';

export function ShapeTreeContainsPriority (st1: ShapeTree, st2: ShapeTree): number {
    let st1Priority: number = 0;
    let st2Priority: number = 0;
    if (st1.getShape() != null) {
      st1Priority += 2;
    }
    if (st1.getLabel() != null) {
      st1Priority++;
    }
    // st:expectsType is required so it doesn't affect score priority
    if (st2.getShape() != null) {
      st2Priority += 2;
    }
    if (st2.getLabel() != null) {
      st2Priority++;
    }
    // Reversed to ensure ordering goes from most strict to least
    return st2Priority - st1Priority;
}
