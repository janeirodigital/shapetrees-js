// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DispatcherEntry } from '../fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';

export class AbstractHttpClientValidationTests extends AbstractHttpClientTests {

  private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll

  public constructor() {
    // Call AbstractHttpClient constructor
    super();
  }

    // > For this set of tests, we reinitialize the dispatcher set for every test, because almost every test needs a
    // > slightly different context. Consequently, we could either modify the state from test to test (which felt a
    // > little dirty as we couldn't run tests standalone, or set the context for each test (which we're doing)
    // ... Not sure this is true anymore -- ericP
  dispatcher = new RequestMatchingFixtureDispatcher([
  new DispatcherEntry(["validation/container-1"], "GET", "/data/container-1/", null),
  new DispatcherEntry(["shapetrees/containment-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null),
  new DispatcherEntry(["schemas/containment-shex"], "GET", "/static/shex/validation/shex", null),
  new DispatcherEntry(["validation/container-1-twocontains-manager"], "GET", "/data/container-1/.shapetree", null),
  new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-1/resource-1", null),
  new DispatcherEntry(["http/201"], "POST", "/data/container-1/", null),
  new DispatcherEntry(["http/201"], "POST", "/data/container-1/resource-1.shapetree", null),

  new DispatcherEntry(["validation/container-1-samecontains-manager"], "GET", "/data/container-same/.shapetree", null),
  new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-same/resource-1", null),
  new DispatcherEntry(["http/201"], "POST", "/data/container-same/", null),
  new DispatcherEntry(["http/201"], "POST", "/data/container-same/resource-1.shapetree", null),

  new DispatcherEntry(["http/404"], "GET", "/data/container-1/resource-1", null),
  new DispatcherEntry(["http/404"], "GET", "/data/container-1/resource-1.shapetree", null),
  new DispatcherEntry(["http/404"], "GET", "/data/container-same/", null),
  ]);

  public startServer() { return this.server.start(this.dispatcher); }
  public stopServer() { return this.server.stop(); }

  runTests (driver: string) {
    describe(`AbstractHttpClientValidationTests using ${driver}`, () => {

// validateTwoContainsTwoShapesTwoNodes
test("Create resource - two containing trees, two shapes, two nodes", async () => {
    let targetResource: URL = this.server.urlFor("/data/container-1/");
    let targetShapeTrees: Array<URL> = [this.server.urlFor("/static/shapetrees/validation/shapetree#AttributeTree"), this.server.urlFor("/static/shapetrees/validation/shapetree#ElementTree")];
    let focusNodes: Array<URL> = [this.server.urlFor("/data/container-1/resource-1#resource"), this.server.urlFor("/data/container-1/resource-1#element")];
    // Plant the data repository on newly created data container
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(201).toEqual(response.getStatusCode());
});

// validateTwoContainsSameContainingTree
test("Create resource - two containing trees of same tree", async () => {
    // Validate multiple contains, same shape tree, same node
    let targetResource: URL = this.server.urlFor("/data/container-same/");
    let targetShapeTrees: Array<URL> = [this.server.urlFor("/static/shapetrees/validation/shapetree#ChildTree")];
    let focusNodes: Array<URL> = [this.server.urlFor("/data/container-same/resource-1#resource")];
    // Plant the data repository on newly created data container
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(201).toEqual(response.getStatusCode());
});

// failToValidateTwoContainsWithBadFocusNodes
test("Fail to create - two containing trees and focus node issues", async () => {
    let targetResource: URL = this.server.urlFor("/data/container-1/");
    let targetShapeTrees: Array<URL> = [this.server.urlFor("/static/shapetrees/validation/shapetree#AttributeTree"), this.server.urlFor("/static/shapetrees/validation/shapetree#ElementTree")];
    // Only one matching target focus node is provided
    let focusNodes: Array<URL> = [this.server.urlFor("/super/bad#node")];
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // Multiple non-matching target focus nodes are provided
    focusNodes = [this.server.urlFor("/super/bad#node"), this.server.urlFor("/data/container-1/resource-1#badnode"), this.server.urlFor("/data/container-1/#badnode")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // Only one matching target focus node is provided when two are needed
    focusNodes = [this.server.urlFor("/data/container-1/resource-1#resource")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
});

  /* TODO - Cannot execute this test predicatably as constituted when passing focus nodes from client. Need to test closer to shape tree validation
// failToValidateTwoContainsTargetNodeUnused
test("Fail to validate created resource - two containing trees, target node unused", async () => {
    URL targetResource = this.server.urlFor("/data/container-1/");
    List<URL> targetShapeTrees = [this.server.urlFor("/static/shapetrees/validation/shapetree#AttributeTree"),
            this.server.urlFor("/static/shapetrees/validation/shapetree#ElementTree")];
    // Two target nodes are provided, but one of the nodes is matched twice, and the other isn't matched at all
    List<URL> focusNodes = [this.server.urlFor("/data/container-1/resource-1#resource")];

    DocumentResponse response = this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
})'
  */

// failToValidateTwoContainsWithBadTargetShapeTrees
test("Fail to create - two containing trees, bad target shape trees", async () => {
    let targetResource: URL = this.server.urlFor("/data/container-1/");
    let focusNodes: Array<URL> = [this.server.urlFor("/data/container-1/resource-1#resource"), this.server.urlFor("/data/container-1/resource-1#element")];
    // Only one matching target shape tree is provided
    let targetShapeTrees: Array<URL> = [this.server.urlFor("/static/shapetrees/validation/shapetree#AttributeTree")];
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // Multiple non-matching target focus nodes are provided
    targetShapeTrees = [this.server.urlFor("/static/shapetrees/validation/shapetree#OtherAttributeTree"), this.server.urlFor("/static/shapetrees/validation/shapetree#OtherElementTree")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // One tree provided that isn't in either st:contains lists
    targetShapeTrees = [this.server.urlFor("/static/shapetrees/validation/shapetree#AttributeTree"), this.server.urlFor("/static/shapetrees/validation/shapetree#StandaloneTree")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
});
          });
  }

  private getResource1BodyString(): string {
    return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" + "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" + "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" + "PREFIX ex: <http://www.example.com/ns/ex#> \n" + "\n" + "\n" + "<#resource> \n" + "    ex:name \"Some Development Task\" ; \n" + "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n" + "\n" + "<#element> \n" + "    ex:name \"Some element\" ; \n" + "    ex:description \"This is a description of an element\" ; \n" + "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n";
  }
}

