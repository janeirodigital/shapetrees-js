// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeAssignment } from '@shapetrees/core/src/ShapeTreeAssignment';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { DocumentLoaderManager } from '@shapetrees/core/src/contentloaders/DocumentLoaderManager';
import { HttpExternalDocumentLoader } from '@shapetrees/core/src/contentloaders/HttpExternalDocumentLoader';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { GraphHelper } from '@shapetrees/core/src/helpers/GraphHelper';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';
import { DispatchEntryServer } from './fixtures/DispatchEntryServer';
import {Store} from "n3";
const { toUrl } = DispatchEntryServer;

class ShapeTreeManagerTests {

   private static managerUrl: URL;

   private static manager: ShapeTreeManager;

   private static server: Mockttp;

   private static assignment1: ShapeTreeAssignment;
   private static assignment2: ShapeTreeAssignment;
   private static assignment3: ShapeTreeAssignment;
   private static nonContainingAssignment1: ShapeTreeAssignment;
   private static nonContainingAssignment2: ShapeTreeAssignment;
   private static containingAssignment1: ShapeTreeAssignment;

   private static dispatcher: RequestMatchingFixtureDispatcher = null;

   private static httpExternalDocumentLoader: HttpExternalDocumentLoader;

  public constructor() {
    ShapeTreeManagerTests.httpExternalDocumentLoader = new HttpExternalDocumentLoader();
    DocumentLoaderManager.setLoader(ShapeTreeManagerTests.httpExternalDocumentLoader);
  }

  // @BeforeAll
  static beforeAll(): void /* throws MalformedURLException, ShapeTreeException */ {
    ShapeTreeManagerTests.dispatcher = new RequestMatchingFixtureDispatcher([
      new DispatcherEntry(["shapetrees/manager-shapetree-ttl"], "GET", "/static/shapetrees/managers/shapetree", null)
    ]);
    ShapeTreeManagerTests.server = getLocal({ debug: false });
    ShapeTreeManagerTests.server.setDispatcher(ShapeTreeManagerTests.dispatcher);
    ShapeTreeManagerTests.managerUrl = new URL("https://site.example/resource.shapetree");
    ShapeTreeManagerTests.assignment1 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeOne"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln1"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeOne"), new URL("https://site.example/resource.shapetree#ln1"));
    ShapeTreeManagerTests.assignment2 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeTwo"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln2"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeTwo"), new URL("https://site.example/resource.shapetree#ln2"));
    ShapeTreeManagerTests.assignment3 = new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeThree"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln3"), new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeThree"), new URL("https://site.example/resource.shapetree#ln3"));
    ShapeTreeManagerTests.nonContainingAssignment1 = new ShapeTreeAssignment(toUrl(ShapeTreeManagerTests.server, "/static/shapetrees/managers/shapetree#NonContainingTree"), toUrl(ShapeTreeManagerTests.server, "/data/container/"), toUrl(ShapeTreeManagerTests.server, "/data/container/.shapetree#ln1"), null, null, toUrl(ShapeTreeManagerTests.server, "/data/container/.shapetree#ln1"));
    ShapeTreeManagerTests.containingAssignment1 = new ShapeTreeAssignment(toUrl(ShapeTreeManagerTests.server, "/static/shapetrees/managers/shapetree#ContainingTree"), toUrl(ShapeTreeManagerTests.server, "/data/container/"), toUrl(ShapeTreeManagerTests.server, "/data/container/.shapetree#ln2"), null, null, toUrl(ShapeTreeManagerTests.server, "/data/container/.shapetree#ln2"));
    ShapeTreeManagerTests.nonContainingAssignment2 = new ShapeTreeAssignment(toUrl(ShapeTreeManagerTests.server, "/static/shapetrees/managers/shapetree#NonContainingTree2"), toUrl(ShapeTreeManagerTests.server, "/data/container/"), toUrl(ShapeTreeManagerTests.server, "/data/container/.shapetree#ln3"), null, null, toUrl(ShapeTreeManagerTests.server, "/data/container/.shapetree#ln3"));
  }

  // @BeforeEach
  beforeEach(): void {
    ShapeTreeManagerTests.manager = new ShapeTreeManager(ShapeTreeManagerTests.managerUrl);
  }

  // @SneakyThrows, @Test, @DisplayName("Initialize a new manager")
  initializeShapeTreeManager(): void {
    let newManager: ShapeTreeManager = new ShapeTreeManager(ShapeTreeManagerTests.managerUrl);
    expect(newManager).not.toBeNull();
    expect(newManager.getId()).toEqual(ShapeTreeManagerTests.managerUrl);
  }

  // @SneakyThrows, @Test, @DisplayName("Add a new assignment")
  addNewShapeTreeAssignmentToManager(): void {
    expect(ShapeTreeManagerTests.manager.getAssignments().length === 0).toEqual(true);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.assignment1);
    expect(ShapeTreeManagerTests.manager.getAssignments().length === 0).toEqual(false);
    expect(ShapeTreeManagerTests.manager.getAssignments().length).toEqual(1);
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to add a null assignment")
  failToAddNullAssignmentToManager(): void {
    expect(async () => {
      await ShapeTreeManagerTests.manager.addAssignment(null);
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to add a duplicate assignment")
  failToAddDuplicateAssignment(): void {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.assignment1);
    expect(async () => {
      await ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.assignment1);
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @Test, @DisplayName("Fail to add assignment with certain null values")
  failToAddAssignmentWithBadValues(): void {
    expect(async () => {
      await new ShapeTreeAssignment(null, new URL("https://site.example/resource"), null, new URL("https://site.example/resource#node"), new URL("https://shapes.example/schema#ShapeThree"), new URL("https://site.example/resource.shapetree#ln3"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
    expect(async () => {
      // focus node with no shape
      await new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeThree"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln3"), new URL("https://site.example/resource#node"), null, new URL("https://site.example/resource.shapetree#ln3"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
    expect(async () => {
      // shape with no focus node
      await new ShapeTreeAssignment(new URL("https://tree.example/tree#TreeThree"), new URL("https://site.example/resource"), new URL("https://site.example/resource.shapetree#ln3"), null, new URL("https://shapes.example/schema#ShapeThree"), new URL("https://site.example/resource.shapetree#ln3"));
    }).rejects.toBeInstanceOf(ShapeTreeException);
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to mint the same assignment twice")
  failToMintDuplicateAssignment(): void {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.assignment1);
    let adjustedUrl: URL = ShapeTreeManagerTests.manager.mintAssignmentUrl(ShapeTreeManagerTests.assignment1.getUrl());
    expect(ShapeTreeManagerTests.assignment1.getUrl()).not.toEqual(adjustedUrl);
  }

  // @SneakyThrows, @Test, @DisplayName("Get containing shape tree assignment from shape tree manager")
  async getContainingShapeTreeAssignmentsFromManager(): Promise<void> {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment1);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.containingAssignment1);
    expect(1).toEqual((await ShapeTreeManagerTests.manager.getContainingAssignments()).length);
    expect((await ShapeTreeManagerTests.manager.getContainingAssignments()).indexOf(ShapeTreeManagerTests.containingAssignment1) !== -1).toEqual(true);
    expect((await ShapeTreeManagerTests.manager.getContainingAssignments()).indexOf(ShapeTreeManagerTests.nonContainingAssignment1) !== -1).toEqual(false);
  }

  // @SneakyThrows, @Test, @DisplayName("Get no containing shape tree assignment for shape tree manager")
  async getNoContainingShapeTreeAssignmentFromManager(): Promise<void> {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment1);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment2);
    expect((await ShapeTreeManagerTests.manager.getContainingAssignments()).length === 0).toEqual(true);
  }

  // @SneakyThrows, @Test, @DisplayName("Get no shape tree assignment for shape tree from manager with no assignments")
  getNoShapeTreeAssignmentsFromEmptyManager(): void {
    expect(ShapeTreeManagerTests.manager.getAssignmentForShapeTree(new URL("https://tree.example/shapetree#ExampleTree"))).toBeNull();
  }

  // @SneakyThrows, @Test, @DisplayName("Get shape tree assignment from manager for shape tree")
  getShapeTreeAssignmentFromManagerForShapeTree(): void {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment1);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment2);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.containingAssignment1);
    expect(ShapeTreeManagerTests.containingAssignment1).toEqual(ShapeTreeManagerTests.manager.getAssignmentForShapeTree(ShapeTreeManagerTests.containingAssignment1.getShapeTree()));
  }

  // @SneakyThrows, @Test, @DisplayName("Get no shape tree assignment from manager without matching shape tree")
  getNoShapeTreeAssignmentForShapeTree(): void {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment1);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment2);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.containingAssignment1);
    expect(ShapeTreeManagerTests.manager.getAssignmentForShapeTree(new URL("https://tree.example/shapetree#ExampleTree"))).toBeNull();
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to remove assignment from empty manager")
  failToRemoveAssignmentFromEmptyManager(): void {
    expect(async () => {
      await ShapeTreeManagerTests.manager.removeAssignment(ShapeTreeManagerTests.containingAssignment1);
    }).rejects.toBeInstanceOf(Error);
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to remove assignment from empty manager")
  failToRemoveAssignmentMissingFromManager(): void {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment1);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment2);
    expect(async () => {
      await ShapeTreeManagerTests.manager.removeAssignment(ShapeTreeManagerTests.containingAssignment1);
    }).rejects.toBeInstanceOf(Error);
  }

  // @SneakyThrows, @Test, @DisplayName("Remove assignment from manager")
  removeAssignmentFromManager(): void {
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment1);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.nonContainingAssignment2);
    ShapeTreeManagerTests.manager.addAssignment(ShapeTreeManagerTests.containingAssignment1);
    expect(ShapeTreeManagerTests.manager.getAssignmentForShapeTree(ShapeTreeManagerTests.containingAssignment1.getShapeTree())).toEqual(ShapeTreeManagerTests.containingAssignment1);
    ShapeTreeManagerTests.manager.removeAssignment(ShapeTreeManagerTests.containingAssignment1);
    expect(ShapeTreeManagerTests.manager.getAssignmentForShapeTree(ShapeTreeManagerTests.containingAssignment1.getShapeTree())).toBeNull();
  }

  // @SneakyThrows, @Test, @DisplayName("Get valid assignment from graph")
  async getAssignmentFromGraph(): Promise<void> {
    let managerUri: URL = new URL("https://data.example/container.shapetree");
    let managerGraph: Store = await GraphHelper.readStringIntoModel(managerUri, this.getValidManagerString(), "text/turtle");
    let manager: ShapeTreeManager = ShapeTreeManager.getFromGraph(managerUri, managerGraph);
    expect(manager).not.toBeNull();
    expect(manager.getAssignmentForShapeTree(new URL("https://tree.example/#Tree1"))).not.toBeNull();
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to get assignment from graph due to missing triples")
  async failToGetAssignmentFromGraphMissingTriples(): Promise<void> {
    let managerUri: URL = new URL("https://data.example/container.shapetree");
    let managerGraph: Store = await GraphHelper.readStringIntoModel(managerUri, this.getInvalidManagerMissingTriplesString(), "text/turtle");
    expect(async () => {
      await ShapeTreeManager.getFromGraph(ShapeTreeManagerTests.managerUrl, managerGraph);
    }).rejects.toBeInstanceOf(Error);
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to get assignment from graph due to unexpected values")
  async failToGetAssignmentFromGraphUnexpectedValues(): Promise<void> {
    let managerUri: URL = new URL("https://data.example/container.shapetree");
    let managerGraph: Store = await GraphHelper.readStringIntoModel(managerUri, this.getInvalidManagerUnexpectedTriplesString(), "text/turtle");
    expect(async () => {
      await ShapeTreeManager.getFromGraph(ShapeTreeManagerTests.managerUrl, managerGraph);
    }).rejects.toBeInstanceOf(Error);
  }

  private getValidManagerString(): string {
    return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" + "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" + "PREFIX st: <http://www.w3.org/ns/shapetrees#> \n \n" + "PREFIX ex: <http://www.example.com/ns/ex#> \n" + "\n" + "\n" + "<https://data.example/container.shapetree> \n" + "    a st:Manager ; \n" + "    st:hasAssignment <https://data.example/container.shapetree#ln1> . \n" + "\n" + "<https://data.example/container.shapetree#ln1> \n" + "    st:assigns <https://tree.example/#Tree1> ; \n" + "    st:hasRootAssignment <https://data.example/container.shapetree#ln1> ; \n" + "    st:manages <https://data.example/container> ; \n" + "    st:shape <https://shapes.example/#Shape1> ; \n" + "    st:focusNode <https://data.example/container#node> . \n" + "\n";
  }

  private getInvalidManagerMissingTriplesString(): string {
    return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" + "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" + "PREFIX st: <http://www.w3.org/ns/shapetrees#> \n \n" + "PREFIX ex: <http://www.example.com/ns/ex#> \n" + "\n" + "\n" + "<https://data.example/container.shapetree> \n" + "    a st:Manager ; \n" + "    st:hasAssignment <https://data.example/container.shapetree#ln1> . \n" + "\n" + "<https://data.example/container.shapetree#ln1> \n" + "    st:assigns <https://tree.example/#Tree1> ; \n" + "\n";
  }

  private getInvalidManagerUnexpectedTriplesString(): string {
    return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" + "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" + "PREFIX st: <http://www.w3.org/ns/shapetrees#> \n \n" + "PREFIX ex: <http://www.example.com/ns/ex#> \n" + "\n" + "\n" + "<https://data.example/container.shapetree> \n" + "    a st:Manager ; \n" + "    st:hasAssignment <https://data.example/container.shapetree#ln1> . \n" + "\n" + "<https://data.example/container.shapetree#ln1> \n" + "    st:assigns <https://tree.example/#Tree1> ; \n" + "    st:hasRootAssignment <https://data.example/container.shapetree#ln1> ; \n" + "    st:manages <https://data.example/container> ; \n" + "    st:shape <https://shapes.example/#Shape1> ; \n" + "    st:focusNode <https://data.example/container#node> ; \n" + "    st:unexpected \"why am i here\" . \n" + "\n";
  }
}
