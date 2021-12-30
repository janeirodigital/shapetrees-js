// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { DispatcherEntry } from '../fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientDiscoverTests extends AbstractHttpClientTests {

  private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll()

  public constructor() {
    // Call AbstractHttpClient constructor
    super();
  }

  // @BeforeAll
  beforeAll(): void {
    let dispatcherList: Array<DispatcherEntry> = [];
    dispatcherList.push(new DispatcherEntry(["discover/unmanaged"], "GET", "/unmanaged", null));
    dispatcherList.push(new DispatcherEntry(["discover/unmanaged-manager"], "GET", "/unmanaged.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["discover/managed"], "GET", "/managed", null));
    dispatcherList.push(new DispatcherEntry(["discover/managed-manager"], "GET", "/managed.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["discover/managed-invalid-1"], "GET", "/managed-invalid-1", null));
    dispatcherList.push(new DispatcherEntry(["discover/managed-invalid-1-manager"], "GET", "/managed-invalid-1.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["discover/managed-invalid-2"], "GET", "/managed-invalid-2", null));
    dispatcherList.push(new DispatcherEntry(["discover/managed-invalid-2-manager"], "GET", "/managed-invalid-2.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["discover/no-manager"], "GET", "/no-manager", null));
    AbstractHttpClientDiscoverTests.dispatcher = new RequestMatchingFixtureDispatcher(dispatcherList);
  }

  // @Order(1), @SneakyThrows, @Test, @Label("Discover unmanaged resource")
  async discoverUnmanagedResource(): Promise<void> {
    const server = new DispatchEntryServer(AbstractHttpClientDiscoverTests.dispatcher);
    let targetResource: URL = server.toUrl("/unmanaged");
    // Use the discover operation to see if the root container is managed
    let manager: ShapeTreeManager = await this.shapeTreeClient.discoverShapeTree(this.context, targetResource) as ShapeTreeManager;
    // The root container isn't managed so check to ensure that a NULL value is returned
    expect(manager).toBeNull();
  }

  // @Order(2), @SneakyThrows, @Test, @Label("Discover managed resource")
  async discoverManagedResource(): Promise<void> {
    const server = new DispatchEntryServer();
    server.setDispatcher(AbstractHttpClientDiscoverTests.dispatcher);
    let targetResource: URL = server.toUrl("/managed");
    // Perform a discover on a resource that has a shape tree manager already planted
    let manager: ShapeTreeManager = await this.shapeTreeClient.discoverShapeTree(this.context, targetResource) as ShapeTreeManager;
    // Ensure that it was planted successfully
    expect(manager).not.toBeNull();
    expect(1).toEqual(manager.getAssignments().length);
    let assignment: ShapeTreeAssignment = manager.getAssignments()[0];
    expect(new URL("http://www.example.com/ns/ex#DataTree")).toEqual(assignment.getShapeTree());
    expect(targetResource.toString()).toEqual(assignment.getManagedResource().toString());
    expect(assignment.getUrl()).toEqual(assignment.getRootAssignment());
    expect(server.toUrl("/managed").toString() + "#set").toEqual(assignment.getFocusNode()!.toString());
    expect("http://www.example.com/ns/ex#DataSetShape").toEqual(assignment.getShape()!.toString());
  }

  // @Order(3), @SneakyThrows, @Test, @Label("Fail to discover managed resource with multiple managers")
  failToDiscoverDueToMultipleManagers(): void {
    const server = new DispatchEntryServer();
    server.setDispatcher(AbstractHttpClientDiscoverTests.dispatcher);
    let targetResource: URL = server.toUrl("/managed-invalid-1");
    // If a manager resource has multiple shapetree managers it is considered invalid
    await expect(async () => {
      let manager: ShapeTreeManager | null = await this.shapeTreeClient.discoverShapeTree(this.context, targetResource);
    }).rejects.toBeInstanceOf(Error);
  }

  // @Order(4), @SneakyThrows, @Test, @Label("Fail to discover managed resource with no managers")
  failToDiscoverDueToNoManagers(): void {
    const server = new DispatchEntryServer();
    server.setDispatcher(AbstractHttpClientDiscoverTests.dispatcher);
    let targetResource: URL = server.toUrl("/managed-invalid-2");
    // If a manager resource exists, but has no managers it is considered invalid
    await expect(async () => {
      let manager: ShapeTreeManager | null = await this.shapeTreeClient.discoverShapeTree(this.context, targetResource);
    }).rejects.toBeInstanceOf(Error);
  }

  // @Order(5), @SneakyThrows, @Test, @Label("Discover server doesn't support ShapeTrees")
  failToDiscoverDueToNoManagerLink(): void {
    const server = new DispatchEntryServer();
    server.setDispatcher(AbstractHttpClientDiscoverTests.dispatcher);
    let targetResource: URL = server.toUrl("/no-manager");
    // If a manager resource exists, but has no managers it is considered invalid
    await expect(async () => {
      let manager: ShapeTreeManager | null = await this.shapeTreeClient.discoverShapeTree(this.context, targetResource);
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }
}
