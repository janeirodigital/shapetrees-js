// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeResourceType } from './enums/ShapeTreeResourceType';
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { InstanceResource } from './InstanceResource';
import { ResourceAttributes } from './ResourceAttributes';

/**
 * A ManageableResource represents a regular resource that could be managed by
 * one or more shape trees. Each possible state is represented by typed
 * subclasses; ManagedResource, UnmanagedResource, and
 * MissingManageableResource. When the state is known, the appropriate
 * typed subclass should be used.
 */
export class ManageableResource extends InstanceResource {

   private readonly managerResourceUrl: URL | null;

   private readonly _isContainer: boolean;

  /**
   * Construct a manageable resource.
   * @param url URL of the resource
   * @param resourceType Identified shape tree resource type
   * @param attributes Associated resource attributes
   * @param body Body of the resource
   * @param name Name of the resource
   * @param exists Whether the resource exists
   * @param managerResourceUrl URL of the shape tree manager resource
   * @param isContainer Whether the resource is a container
   */
  public constructor(url: URL, resourceType: ShapeTreeResourceType, attributes: ResourceAttributes, body: string, name: string, exists: boolean, managerResourceUrl: URL | null, isContainer: boolean) {
    super(url, resourceType, attributes, body, name, exists);
    this.managerResourceUrl = managerResourceUrl;
    this._isContainer = isContainer;
  }

  /**
   * Get the URL of the resource's parent container
   * @return URL of the parent container
   * @throws ShapeTreeException
   */
  public getParentContainerUrl(): URL /* throws ShapeTreeException */ {
    const rel: string = this.isContainer() ? ".." : ".";
    try {
      return new URL(this.getUrl().href, rel);
    } catch (ex: unknown) {
      // ex.code === "ERR_INVALID_URL"
      throw new ShapeTreeException(500, "Malformed focus node when resolving <" + rel + "> against <" + this.getUrl() + ">");
    }
  }

  public getManagerResourceUrl(): URL | null {
    return this.managerResourceUrl;
  }

  public isContainer(): boolean {
    return this._isContainer;
  }
}
