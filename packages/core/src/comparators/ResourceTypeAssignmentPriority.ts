// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.comparators
import { ManageableInstance } from '../ManageableInstance';
import {ShapeTreeResourceType} from "../enums/ShapeTreeResourceType";

// Used for sorting by shape tree resource type with the following order
// 1. Containers
// 2. Resources
// 3. Non-RDF Resources
// @SneakyThrows
export function ResourceTypeAssignmentPriority (a: ManageableInstance, b: ManageableInstance): number {
    const l = a.getManageableResource().getResourceType();
    const r = b.getManageableResource().getResourceType();
    if (l === ShapeTreeResourceType.CONTAINER)
      return r === ShapeTreeResourceType.CONTAINER ? 0 : -1;
    if (r === ShapeTreeResourceType.CONTAINER)
      return 1;
    if (l === ShapeTreeResourceType.RESOURCE)
      return r === ShapeTreeResourceType.RESOURCE ? 0 : -1;
    if (r === ShapeTreeResourceType.RESOURCE)
      return 1;
    return 0; // both are ShapeTreeResourceType.NON_RDF
}
