// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DispatcherEntry } from '../fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientTypeTests extends AbstractHttpClientTests {

   private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll

  public constructor() {
    // Call AbstractHttpClientTests constructor
    super();
  }

  // @BeforeEach
  initializeDispatcher(): void {
    let dispatcherList: Array<DispatcherEntry> = new Array();
    dispatcherList.push(new DispatcherEntry(["type/containers-container"], "GET", "/containers/", null));
    dispatcherList.push(new DispatcherEntry(["type/containers-container-manager"], "GET", "/containers/.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["type/resources-container"], "GET", "/resources/", null));
    dispatcherList.push(new DispatcherEntry(["type/resources-container-manager"], "GET", "/resources/.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["type/non-rdf-resources-container"], "GET", "/non-rdf-resources/", null));
    dispatcherList.push(new DispatcherEntry(["type/non-rdf-resources-container-manager"], "GET", "/non-rdf-resources/.shapetree", null));
    dispatcherList.push(new DispatcherEntry(["shapetrees/type-shapetree-ttl"], "GET", "/static/shapetrees/type/shapetree", null));
    AbstractHttpClientTypeTests.dispatcher = new RequestMatchingFixtureDispatcher(dispatcherList);
  }

  // @SneakyThrows, @Test, @Label("Create container when only containers are allowed")
  async createContainer(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientTypeTests.dispatcher);
    // Add fixture to handle successful POST response
    AbstractHttpClientTypeTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["type/valid-container-create-response"], "POST", "/containers/valid-container/", null));
    AbstractHttpClientTypeTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/containers/valid-container/.shapetree", null));
    let response: DocumentResponse;

    // Provide target shape tree
    // TODO: (this and following tests) can we POST a null bodyString?
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/containers/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ContainerTree")], "valid-container", true);
    expect(201).toEqual(response.getStatusCode());

    // Do not provide target shape tree
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/containers/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, null, "valid-container", true);
    expect(201).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @Label("Fail to create resource when only containers are allowed")
  async failToCreateNonContainer(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientTypeTests.dispatcher);
    let response: DocumentResponse;

    // Provide target shape tree for a resource when container shape tree is expected
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/containers/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ResourceTree")], "invalid-resource", false);
    expect(422).toEqual(response.getStatusCode());

    // Provide target shape tree for a container even though what's being sent is a resource
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/containers/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ContainerTree")], "invalid-resource", false);
    expect(422).toEqual(response.getStatusCode());

    // Don't provide a target shape tree at all
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/containers/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, null, "invalid-resource", false);
    expect(422).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @Label("Create resource when only resources are allowed")
  async createResource(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientTypeTests.dispatcher);

    // Add fixture to handle successful POST response
    AbstractHttpClientTypeTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["type/valid-resource-create-response"], "POST", "/resources/valid-resource", null));
    AbstractHttpClientTypeTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/resources/valid-resource.shapetree", null));
    let response: DocumentResponse;

    // Provide target shape tree
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ResourceTree")], "valid-resource", false);
    expect(201).toEqual(response.getStatusCode());

    // Do not provide target shape tree
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, null, "valid-resource", false);
    expect(201).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @Label("Fail to create container when only resources are allowed")
  async failToCreateNonResource(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientTypeTests.dispatcher);
    let response: DocumentResponse;

    // Provide target shape tree for a container when resource shape tree is expected
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ContainerTree")], "invalid-container", true);
    expect(422).toEqual(response.getStatusCode());

    // Provide target shape tree for a resource even though what's being sent is a container
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ResourceTree")], "invalid-container", true);
    expect(422).toEqual(response.getStatusCode());

    // Don't provide a target shape tree at all
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, null, "invalid-container", true);
    expect(422).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @Label("Create non-rdf resource when only non-rdf resources are allowed")
  async createNonRDFResource(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientTypeTests.dispatcher);

    // Add fixture to handle successful POST response
    AbstractHttpClientTypeTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["type/valid-non-rdf-resource-create-response"], "POST", "/non-rdf-resources/valid-non-rdf-resource", null));
    // TODO: Test: should this fail? should it have already failed?
    AbstractHttpClientTypeTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/non-rdf-resources/valid-non-rdf-resource.shapetree", null));
    let response: DocumentResponse;

    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/non-rdf-resources/"), null, null!, "application/octet-stream", [this.toUrl(server, "/static/shapetrees/type/shapetree#NonRDFResourceTree")], "valid-non-rdf-resource", false);
    expect(201).toEqual(response.getStatusCode());

    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/non-rdf-resources/"), null, null!, "application/octet-stream", null, "valid-non-rdf-resource", false);
    expect(201).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @Label("Fail to create resource when only non-rdf resources are allowed")
  async failToCreateNonRDFResource(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientTypeTests.dispatcher);
    let response: DocumentResponse;

    // Provide target shape tree for a resource when non-rdf-resource shape tree is expected
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/non-rdf-resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#ResourceTree")], "invalid-non-rdf-resource", false);
    expect(422).toEqual(response.getStatusCode());

    // Provide target shape tree for a non-rdf-resource even though what's being sent is a resource
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/non-rdf-resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, [this.toUrl(server, "/static/shapetrees/type/shapetree#NonRDFResourceTree")], "invalid-non-rdf-resource", false);
    expect(422).toEqual(response.getStatusCode());

    // Don't provide a target shape tree at all
    response = await this.shapeTreeClient.postManagedInstance(this.context, this.toUrl(server, "/non-rdf-resources/"), null, null!, AbstractHttpClientTests.TEXT_TURTLE, null, "invalid-non-rdf-resource", false);
    expect(422).toEqual(response.getStatusCode());
  }
}
