// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ResourceAccessor } from './ResourceAccessor';
import { ShapeTreeContext } from './ShapeTreeContext';
import { ManageableResource } from './ManageableResource';
import { ManagerResource } from './ManagerResource';
import { MissingManagerResource } from './MissingManagerResource';

/**
 * A ManageableInstance represents a pairing of a shape tree ManagerResource
 * and a ManageableResource.
 *
 * The ManageableInstance may represent a managed
 * state, where the ManageableResource is a ManagedResource that is
 * managed by one or more shape trees assigned by the ShapeTreeManager
 * in the ManagedResource.Conversely, it could represent an unmanaged
 * state, where the ManageableResource is an UnmanagedResource and the
 * ManagedResource is a MissingManagedResource. Lastly, it may
 * represent other state combinations where one or both of the
 * ManageableResource or ManagedResource are missing.
 *
 * Both ManageableResource and ManagedResource are looked up and loaded
 * upon construction of the ManageableInstance, which should be done
 * through a ResourceAccessor. Once constructed, the ManageableInstance
 * is immutable.
 */
export class ManageableInstance {

   public static readonly TEXT_TURTLE: string = "text/turtle";

   private readonly resourceAccessor: ResourceAccessor;

   private readonly shapeTreeContext: ShapeTreeContext;

   private readonly _wasRequestForManager: boolean;

   private readonly manageableResource: ManageableResource;

   private readonly managerResource: ManagerResource;

  /**
   * Indicates whether the HTTP request that triggered the initialization of the
   * ManageableInstance was targeted towards the ManagerResource or the
   * ManageableResource.
   * @return True when the request targeted the ManagerResource
   */
  public wasRequestForManager(): boolean {
    return this._wasRequestForManager;
  }

  /**
   * Indicates whether the ManageableInstance represents an unmanaged state, with a
   * UnmanagedResource and a MissingManagerResource
   * @return True when the instance is in an unmanaged state
   */
  public isUnmanaged(): boolean {
    return this.managerResource instanceof MissingManagerResource;
  }

  /**
   * Indicates whether the ManageableInstance represents a managed state, with a
   * ManagedResource assigned one or more shape trees by a ShapeTreeManager in
   * a ManagerResource
   * @return True when the instance is in an managed state
   */
  public isManaged(): boolean {
    return !this.isUnmanaged();
  }

  /**
   * Constructor for a ManageableInstance. Since a ManageableInstance is immutable, all
   * elements must be provided, and cannot be null. ManageableInstances should be
   * constructed through a ResourceAccessor:
   * {@link ResourceAccessor#createInstance(ShapeTreeContext, String, URL, ResourceAttributes, String, String)}
   * {@link ResourceAccessor#getInstance(ShapeTreeContext, URL)}
   * @param context Shape tree context
   * @param resourceAccessor Resource accessor in use
   * @param wasRequestForManager True if the manager resource was the target of the associated request
   * @param manageableResource Initialized manageable resource, which may be a typed sub-class
   * @param managerResource Initialized manager resource, which may be a typed sub-class
   */
  public constructor(context: ShapeTreeContext, resourceAccessor: ResourceAccessor, wasRequestForManager: boolean, manageableResource: ManageableResource, managerResource: ManagerResource) {
    this.shapeTreeContext = context;
    this.resourceAccessor = resourceAccessor;
    this._wasRequestForManager = wasRequestForManager;
    this.manageableResource = manageableResource;
    this.managerResource = managerResource;
  }

  public getTEXT_TURTLE(): string {
    return ManageableInstance.TEXT_TURTLE;
  }

  public getResourceAccessor(): ResourceAccessor {
    return this.resourceAccessor;
  }

  public getShapeTreeContext(): ShapeTreeContext {
    return this.shapeTreeContext;
  }

  public getWasRequestForManager(): boolean {
    return this._wasRequestForManager;
  }

  public getManageableResource(): ManageableResource {
    return this.manageableResource;
  }

  public getManagerResource(): ManagerResource {
    return this.managerResource;
  }
}
