// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DispatcherEntry } from '../fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientTypeTests extends AbstractHttpClientTests {

  private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll

  public constructor() {
    // Call AbstractHttpClientTests constructor
    super();
  }

  dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["type/containers-container"], "GET", "/containers/", null),
  new DispatcherEntry(["type/containers-container-manager"], "GET", "/containers/.shapetree", null),
  new DispatcherEntry(["type/resources-container"], "GET", "/resources/", null),
  new DispatcherEntry(["type/resources-container-manager"], "GET", "/resources/.shapetree", null),
  new DispatcherEntry(["type/non-rdf-resources-container"], "GET", "/non-rdf-resources/", null),
  new DispatcherEntry(["type/non-rdf-resources-container-manager"], "GET", "/non-rdf-resources/.shapetree", null),
  new DispatcherEntry(["shapetrees/type-shapetree-ttl"], "GET", "/static/shapetrees/type/shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/containers/valid-container/", null),
  new DispatcherEntry(["http/404"], "GET", "/containers/valid-container/.shapetree", null),
  new DispatcherEntry(["type/valid-container-create-response"], "POST", "/containers/valid-container/", null),
  new DispatcherEntry(["http/201"], "POST", "/containers/valid-container/.shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/containers/invalid-resource", null),
  new DispatcherEntry(["http/404"], "GET", "/resources/valid-resource", null),
  new DispatcherEntry(["http/404"], "GET", "/resources/valid-resource.shapetree", null),
  new DispatcherEntry(["type/valid-resource-create-response"], "POST", "/resources/valid-resource", null),
  new DispatcherEntry(["http/201"], "POST", "/resources/valid-resource.shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/resources/invalid-container/", null),
  new DispatcherEntry(["http/404"], "GET", "/non-rdf-resources/valid-non-rdf-resource", null),
  new DispatcherEntry(["http/404"], "GET", "/non-rdf-resources/valid-non-rdf-resource.shapetree", null),
  new DispatcherEntry(["type/valid-non-rdf-resource-create-response"], "POST", "/non-rdf-resources/valid-non-rdf-resource", null),
  new DispatcherEntry(["http/201"], "POST", "/non-rdf-resources/valid-non-rdf-resource.shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/non-rdf-resources/invalid-non-rdf-resource", null),
  ]);

  public startServer() { return this.server.start(this.dispatcher); }
  public stopServer() { return this.server.stop(); }

  runTests (driver: string) {
    describe(`AbstractHttpClientTypeTests using ${driver}`, () => {

// createContainer
test("Create container when only containers are allowed", async () => {
  let response: DocumentResponse;

  // Provide target shape tree
  // TODO: (this and following tests) can we POST a null bodyString?
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/containers/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ContainerTree")], "valid-container", true);
  expect(201).toEqual(response.getStatusCode());

  // Do not provide target shape tree
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/containers/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, null, "valid-container", true);
  expect(201).toEqual(response.getStatusCode());
});

// failToCreateNonContainer
test("Fail to create resource when only containers are allowed", async () => {
  let response: DocumentResponse;

  // Provide target shape tree for a resource when container shape tree is expected
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/containers/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ResourceTree")], "invalid-resource", false);
  expect(422).toEqual(response.getStatusCode());

  // Provide target shape tree for a container even though what's being sent is a resource
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/containers/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ContainerTree")], "invalid-resource", false);
  expect(422).toEqual(response.getStatusCode());

  // Don't provide a target shape tree at all
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/containers/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, null, "invalid-resource", false);
  expect(422).toEqual(response.getStatusCode());
});

// createResource
test("Create resource when only resources are allowed", async () => {
  let response: DocumentResponse;

  // Provide target shape tree
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ResourceTree")], "valid-resource", false);
  expect(201).toEqual(response.getStatusCode());

  // Do not provide target shape tree
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, null, "valid-resource", false);
  expect(201).toEqual(response.getStatusCode());
});

// failToCreateNonResource
test("Fail to create container when only resources are allowed", async () => {
  let response: DocumentResponse;

  // Provide target shape tree for a container when resource shape tree is expected
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ContainerTree")], "invalid-container", true);
  expect(422).toEqual(response.getStatusCode());

  // Provide target shape tree for a resource even though what's being sent is a container
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ResourceTree")], "invalid-container", true);
  expect(422).toEqual(response.getStatusCode());

  // Don't provide a target shape tree at all
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, null, "invalid-container", true);
  expect(422).toEqual(response.getStatusCode());
});

// createNonRDFResource
test("Create non-rdf resource when only non-rdf resources are allowed", async () => {
  // TODO: Test: should this fail? should it have already failed?
  let response: DocumentResponse;

  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/non-rdf-resources/"), null, "", "application/octet-stream", [this.server.urlFor("/static/shapetrees/type/shapetree#NonRDFResourceTree")], "valid-non-rdf-resource", false);
  expect(201).toEqual(response.getStatusCode());

  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/non-rdf-resources/"), null, "", "application/octet-stream", null, "valid-non-rdf-resource", false);
  expect(201).toEqual(response.getStatusCode());
});

// failToCreateNonRDFResource
test("Fail to create resource when only non-rdf resources are allowed", async () => {
  let response: DocumentResponse;

  // Provide target shape tree for a resource when non-rdf-resource shape tree is expected
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/non-rdf-resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#ResourceTree")], "invalid-non-rdf-resource", false);
  expect(422).toEqual(response.getStatusCode());

  // Provide target shape tree for a non-rdf-resource even though what's being sent is a resource
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/non-rdf-resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, [this.server.urlFor("/static/shapetrees/type/shapetree#NonRDFResourceTree")], "invalid-non-rdf-resource", false);
  expect(422).toEqual(response.getStatusCode());

  // Don't provide a target shape tree at all
  response = await this.shapeTreeClient.postManagedInstance(this.context, this.server.urlFor("/non-rdf-resources/"), null, "", AbstractHttpClientTests.TEXT_TURTLE, null, "invalid-non-rdf-resource", false);
  expect(422).toEqual(response.getStatusCode());
});

    })
  }
}
