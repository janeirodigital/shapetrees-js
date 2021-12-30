// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ShapeTreeContext } from '@shapetrees/core/src/ShapeTreeContext';
import { ShapeTreeManager } from '@shapetrees/core/src/ShapeTreeManager';
import { DispatcherEntry } from './fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from './fixtures/RequestMatchingFixtureDispatcher';
import { DocumentResponse } from "../../core/src/DocumentResponse";
import { InstanceResource } from "../../core/src/InstanceResource";
import { ResourceAccessor } from "../../core/src/ResourceAccessor";
import { ResourceAttributes } from "../../core/src/ResourceAttributes";
import { ManageableInstance } from '@shapetrees/core/src/ManageableInstance'
import { MissingManageableResource } from '@shapetrees/core/src/MissingManageableResource'
import { MissingManagerResource } from '@shapetrees/core/src/MissingManagerResource'
import { ManagedResource } from '@shapetrees/core/src/ManagedResource'
import { UnmanagedResource } from '@shapetrees/core/src/UnmanagedResource'
import { ManagerResource } from '@shapetrees/core/src/ManagerResource'
import { ManageableResource } from '@shapetrees/core/src/ManageableResource'
import {Mockttp, getLocal} from "mockttp";

resourceAccessor: ResourceAccessor = null;
context: ShapeTreeContext;

const httpExternalDocumentLoader = new HttpExternalDocumentLoader();
DocumentLoaderManager.setLoader(httpExternalDocumentLoader);

const server = new DispatchEntryServer();
const dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["resourceAccessor/resource-no-link-headers"], "GET", "/static/resource/resource-no-link-headers", null),
  new DispatcherEntry(["resourceAccessor/resource-empty-link-header"], "GET", "/static/resource/resource-empty-link-header", null),
  new DispatcherEntry(["resourceAccessor/resource-container-link-header"], "GET", "/static/resource/resource-container-link-header", null),
  new DispatcherEntry(["resourceAccessor/resource-container-link-header"], "GET", "/static/resource/resource-container-link-header/", null),
  new DispatcherEntry(["resourceAccessor/resource-container-invalid-link-header"], "GET", "/static/resource/resource-container-invalid-link-header/", null),
  new DispatcherEntry(["resourceAccessor/managed-container-1"], "GET", "/static/resource/managed-container-1/", null),
  new DispatcherEntry(["resourceAccessor/managed-resource-1-create"], "PUT", "/static/resource/managed-container-1/managed-resource-1/", null),
  new DispatcherEntry(["resourceAccessor/managed-resource-1-manager"], "GET", "/static/resource/managed-container-1/managed-resource-1/.shapetree", null),
  new DispatcherEntry(["resourceAccessor/managed-container-1-manager"], "GET", "/static/resource/managed-container-1/.shapetree", null),
  new DispatcherEntry(["resourceAccessor/unmanaged-container-2"], "GET", "/static/resource/unmanaged-container-2/", null),
  new DispatcherEntry(["resourceAccessor/managed-container-2"], "GET", "/static/resource/managed-container-2/", null),
  new DispatcherEntry(["resourceAccessor/unmanaged-resource-1-create"], "PUT", "/static/resource/unmanaged-resource-1", null),
  new DispatcherEntry(["resourceAccessor/managed-container-2-manager-create"], "PUT", "/static/resource/managed-container-2/.shapetree", null),
  new DispatcherEntry(["errors/404"], "GET", "/static/resource/missing-resource-1.shapetree", null),
  new DispatcherEntry(["errors/404"], "GET", "/static/resource/missing-resource-2", null),
  new DispatcherEntry(["resourceAccessor/missing-resource-2-manager-create"], "PUT", "/static/resource/missing-resource-2.shapetree", null),
  new DispatcherEntry(["shapetrees/project-shapetree-ttl"], "GET", "/static/shapetrees/project/shapetree", null),
  new DispatcherEntry(["schemas/project-shex"], "GET", "/static/shex/project/shex", null),
  new DispatcherEntry(["errors/404"], "GET", "/static/resource/notpresent", null)
]);

beforeAll(() => { return server.start(dispatcher); });
afterAll(() => { return server.stop(); });

this.context = new ShapeTreeContext(null);

// Tests to Get ManageableInstances
// getInstanceFromMissingResource
test("Get instance from missing resource", async () => {
  let instance: ManageableInstance = await this.resourceAccessor.getInstance(this.context, this.server.urlFor("/static/resource/notpresent"));
  expect(instance.getManageableResource() instanceof MissingManageableResource).toEqual(true);
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(true);
  expect(instance.isManaged()).toEqual(false);
  expect(instance.getManageableResource().getUrl()).toEqual(this.server.urlFor("/static/resource/notpresent"));
  expect(instance.getManageableResource().isExists()).toEqual(false);
  expect(instance.getManagerResource().isExists()).toEqual(false);
});

// getInstanceFromManagedResource
test("Get instance from managed resource", async () => {
  // If the resource is Manageable - determine if it is managed by getting manager
  // Get and store a ManagedResource in instance - Manager exists - store manager in instance too
  let instance: ManageableInstance = await this.resourceAccessor.getInstance(this.context, this.server.urlFor("/static/resource/managed-container-1/"));
  expect(instance.getManageableResource() instanceof ManagedResource).toEqual(true);
  expect(instance.getManagerResource()).not.toBeNull();
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(false);
  expect(instance.isManaged()).toEqual(true);
  expect(instance.isUnmanaged()).toEqual(false);
  let managerResource: ManagerResource = instance.getManagerResource();
  let manager: ShapeTreeManager = await managerResource.getManager();
  expect(1).toEqual(manager.getAssignments().length);
});

// getInstanceFromManagedResourceFromManager
test("Get instance for managed resource from manager request", async () => {
  let instance: ManageableInstance = await this.resourceAccessor.getInstance(this.context, this.server.urlFor("/static/resource/managed-container-1/.shapetree"));
  expect(instance.getManagerResource()).not.toBeNull();
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(false);
  expect(instance.getManagerResource().isExists()).toEqual(true);
  expect(instance.getManageableResource() instanceof ManagedResource).toEqual(true);
  expect(instance.getManagerResource().getManagedResourceUrl()).toEqual(instance.getManageableResource().getUrl());
});

// failToGetInstanceForMissingManageableResourceFromManager
test("Fail to get instance for missing resource from manager request", async () => {
  // Note that in this request, the manager is also non-existent
  await expect(async () => {
    let instance: ManageableInstance = await this.resourceAccessor.getInstance(this.context, this.server.urlFor("/static/resource/missing-resource-1.shapetree"));
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// getInstanceFromUnmanagedResource
test("Get instance from unmanaged resource", async () => {
  // If the resource is Manageable - determine if it is managed by getting manager
  // Get and store an UnmanagedResource in instance - No manager exists - store the location of the manager url
  let instance: ManageableInstance = await this.resourceAccessor.getInstance(this.context, this.server.urlFor("/static/resource/unmanaged-container-2/"));
  expect(instance.getManageableResource() instanceof UnmanagedResource).toEqual(true);
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(true);
  expect(instance.isUnmanaged()).toEqual(true);
  expect(instance.isManaged()).toEqual(false);
});

// getInstanceFromUnmanagedResourceFromManager
test("Get instance from unmanaged resource from manager request", async () => {
  // Manager resource doesn't exist. Unmanaged resource associated with it does exist
  let instance: ManageableInstance = await this.resourceAccessor.getInstance(this.context, this.server.urlFor("/static/resource/unmanaged-container-2/.shapetree"));
  expect(instance.getManageableResource() instanceof UnmanagedResource).toEqual(true);
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(true);
  expect(instance.wasRequestForManager()).toEqual(true);
  expect(instance.isUnmanaged()).toEqual(true);
  expect(instance.isManaged()).toEqual(false);
});

// Tests to Create ManageableInstances
// createInstanceFromManagedResource
test("Create instance from managed resource", async () => {
  let headers: ResourceAttributes = new ResourceAttributes();
  let instance: ManageableInstance = await this.resourceAccessor.createInstance(this.context, "PUT", this.server.urlFor("/static/resource/managed-container-1/managed-resource-1/"), headers, this.getMilestoneThreeBodyGraph(), "text/turtle");
  expect(instance.isManaged()).toEqual(true);
  expect(instance.getManageableResource() instanceof ManagedResource).toEqual(true);
  expect(instance.getManageableResource() instanceof MissingManageableResource).toEqual(false);
  expect(instance.getManagerResource().isExists()).toEqual(true);
  expect(instance.getManagerResource().getManagedResourceUrl()).toEqual(instance.getManageableResource().getUrl());
  let managerResource: ManagerResource = instance.getManagerResource();
  let manager: ShapeTreeManager = await managerResource.getManager();
  expect(1).toEqual(manager.getAssignments().length);
});

// createInstanceFromUnmanagedResource
test("Create instance from unmanaged resource", async () => {
  let headers: ResourceAttributes = new ResourceAttributes();
  let instance: ManageableInstance = await this.resourceAccessor.createInstance(this.context, "PUT", this.server.urlFor("/static/resource/unmanaged-resource-1"), headers, "<#a> <#b> <#c>", "text/turtle");
  expect(instance.isUnmanaged()).toEqual(true);
  expect(instance.getManageableResource() instanceof UnmanagedResource).toEqual(true);
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(true);
});

// failToCreateInstanceFromExistingResource
test("Fail to create instance from existing manageable resource", async () => {
  // Resource exists - ERROR - can't create a manageable resource when one already exists
  // May need to populate this
  let headers: ResourceAttributes = new ResourceAttributes();
  await expect(async () => {
    let instance: ManageableInstance = await this.resourceAccessor.createInstance(this.context, "PUT", this.server.urlFor("/static/resource/unmanaged-container-2/"), headers, "<#a> <#b> <#c>", "text/turtle");
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// createInstanceFromManagerResource
test("Create instance from manager resource", async () => {
  // Create a new manager and store in instance and load the managed resource and store in instance (possibly just pre-fetch metadata if lazily loading)
  let headers: ResourceAttributes = new ResourceAttributes();
  let instance: ManageableInstance = await this.resourceAccessor.createInstance(this.context, "PUT", this.server.urlFor("/static/resource/managed-container-2/.shapetree"), headers, this.getProjectTwoManagerGraph(), "text/turtle");
  expect(instance.isManaged()).toEqual(true);
  expect(instance.getManageableResource() instanceof ManagedResource).toEqual(true);
  expect(instance.getManagerResource() instanceof MissingManagerResource).toEqual(false);
  // Probably need some additional tests
});

// failToCreateInstanceFromIsolatedManagerResource
test("Fail to create instance from isolated manager resource", async () => {
  let headers: ResourceAttributes = new ResourceAttributes();
  await expect(async () => {
    let instance: ManageableInstance = await this.resourceAccessor.createInstance(this.context, "PUT", this.server.urlFor("/static/resource/missing-resource-2.shapetree"), headers, this.getProjectTwoManagerGraph(), "text/turtle");
  }).rejects.toBeInstanceOf(ShapeTreeException);
});

// TODO - currently missing dedicated tests for create and delete. only one test for update (which is a failure test)
// getResourceWithNoLinkHeaders
test("Get a resource without any link headers", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-no-link-headers"));
  // This is a strange way to check whether something has no link headers
  expect(resource.isExists()).toEqual(true);
  expect((<ManageableResource>resource).getManagerResourceUrl() === null).toEqual(true);
});

// getResourceWithEmptyLinkHeader
test("Get a resource with an empty link header", async () => {
  // Link header is present but has nothing in it
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-empty-link-header"));
  expect(resource.isExists()).toEqual(true);
  expect((<ManageableResource>resource).getManagerResourceUrl() === null).toEqual(true);
});

// failToAccessResourceWithInvalidUrlString
test("Fail to get a resource with an invalid URL string", async () => {
  // TODO: Test: may as well deleted as it's only testing URL.create()
  await expect(async () => await this.resourceAccessor.getResource(this.context, new URL(":invalid"))).rejects.toBeInstanceOf(MalformedURLException);
  // TODO - this should also test create, update, delete, getContained, (also get/create instance)
});

// getMissingResourceWithNoSlash
test("Get a missing resource with no slash", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/not-existing-no-slash"));
  expect(resource.isExists()).toEqual(false);
  expect((<ManageableResource>resource).isContainer()).toEqual(false);
});

// getMissingContainerWithSlash
test("Get a missing container with slash", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/not-existing-slash/"));
  expect(resource.isExists()).toEqual(false);
  expect((<ManageableResource>resource).isContainer()).toEqual(true);
});

// getMissingContainerWithSlashAndFragment
test("Get a missing container with slash and fragment", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/not-existing-slash/#withfragment"));
  expect(resource.isExists()).toEqual(false);
  expect((<ManageableResource>resource).isContainer()).toEqual(true);
});

// getExistingContainerNoSlash
test("Get an existing container with no slash", async () => {
  // TODO - In Solid at least, the slash must be present, so I question whether setting this as a container helps or hurts
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-container-link-header"));
  expect(resource.isExists()).toEqual(true);
  expect((<ManageableResource>resource).isContainer()).toEqual(true);
});

// getExistingContainer
test("Get an existing container", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-container-link-header/"));
  expect(resource.isExists()).toEqual(true);
  expect((<ManageableResource>resource).isContainer()).toEqual(true);
});

// failToLookupInvalidAttributes
test("Fail to lookup invalid resource attributes", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-container-link-header"));
  expect(resource.isExists()).toEqual(true);
  expect(resource.getAttributes().firstValue("invalid")).toBeNull();
});

// getMissingResource
test("Get a missing resource", async () => {
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/notpresent"));
  expect("").toEqual(resource.getBody());
  // TODO - what other tests and assertions should be included here? isExists()?
});

// getContainerWithInvalidLinkTypeHeader
test("Get a container with an invalid link type header", async () => {
  // TODO - at the moment we process this happily. Aside from not marking it as a container, should there be a more severe handling?
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-container-invalid-link-header/"));
  expect(resource.isExists()).toEqual(true);
  expect((<ManageableResource>resource).isContainer()).toEqual(false);
});

// failToUpdateResource
test("Fail to update resource", async () => {
  // Succeed in getting a resource
  let resource: InstanceResource = await this.resourceAccessor.getResource(this.context, this.server.urlFor("/static/resource/resource-container-link-header/"));
  // Fail to update it
  let response: DocumentResponse = await this.resourceAccessor.updateResource(this.context, "PUT", resource, "BODY");
  expect(response.isExists()).toEqual(false);
});

private getMilestoneThreeBodyGraph(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "\n" +
    "\n" +
    "<#milestone> \n" +
    "    ex:uri </static/resource/managed-container-1/managed-resource-1/#milestone> ; \n" +
    "    ex:id 12345 ; \n" +
    "    ex:name \"Milestone 3 of Project 1\" ; \n" +
    "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime ; \n" +
    "    ex:target \"2021-06-05T20:15:47.000Z\"^^xsd:dateTime ; \n" +
    "    ex:inProject </static/resource/managed-container-1/#project> . \n";
}

private getProjectTwoManagerGraph(): string {
  return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" +
    "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
    "PREFIX ex: <http://www.example.com/ns/ex#> \n" +
    "\n" +
    "<> \n" +
    "    a st:Manager ; \n" +
    "    st:hasAssignment <#ln1> . \n" +
    "\n" +
    "<#ln1> \n" +
    "    st:assigns <${SERVER_BASE}/static/shapetrees/project/shapetree#ProjectTree> ; \n" +
    "    st:manages </static/resource/managed-container-2/> ; \n" +
    "    st:hasRootAssignment <#ln1> ; \n" +
    "    st:focusNode </static/resource/managed-container-2/#project> ; \n" +
    "    st:shape <${SERVER_BASE}/static/shex/project/shex#ProjectShape> . \n";
}
