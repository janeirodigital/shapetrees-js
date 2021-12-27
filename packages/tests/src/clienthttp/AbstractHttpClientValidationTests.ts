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

  // @BeforeEach
  initializeDispatcher(): void {
    // For this set of tests, we reinitialize the dispatcher set for every test, because almost every test needs a
    // slightly different context. Consequently, we could either modify the state from test to test (which felt a
    // little dirty as we couldn't run tests standalone, or set the context for each test (which we're doing)
    let dispatcherList: Array<DispatcherEntry> = new Array();
    dispatcherList.push(new DispatcherEntry(["validation/container-1"], "GET", "/data/container-1/", null));
    dispatcherList.push(new DispatcherEntry(["shapetrees/containment-shapetree-ttl"], "GET", "/static/shapetrees/validation/shapetree", null));
    dispatcherList.push(new DispatcherEntry(["schemas/containment-shex"], "GET", "/static/shex/validation/shex", null));
    AbstractHttpClientValidationTests.dispatcher = new RequestMatchingFixtureDispatcher(dispatcherList);
  }

  // @SneakyThrows, @Test, @DisplayName("Create resource - two containing trees, two shapes, two nodes")
  async validateTwoContainsTwoShapesTwoNodes(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientValidationTests.dispatcher);
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/container-1-twocontains-manager"], "GET", "/data/container-1/.shapetree", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-1/resource-1", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/resource-1.shapetree", null));
    let targetResource: URL = this.toUrl(server, "/data/container-1/");
    let targetShapeTrees: Array<URL> = [this.toUrl(server, "/static/shapetrees/validation/shapetree#AttributeTree"), this.toUrl(server, "/static/shapetrees/validation/shapetree#ElementTree")];
    let focusNodes: Array<URL> = [this.toUrl(server, "/data/container-1/resource-1#resource"), this.toUrl(server, "/data/container-1/resource-1#element")];
    // Plant the data repository on newly created data container
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(201).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @DisplayName("Create resource - two containing trees of same tree")
  async validateTwoContainsSameContainingTree(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientValidationTests.dispatcher);
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/container-1-samecontains-manager"], "GET", "/data/container-1/.shapetree", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-1/resource-1", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/resource-1.shapetree", null));
    // Validate multiple contains, same shape tree, same node
    let targetResource: URL = this.toUrl(server, "/data/container-1/");
    let targetShapeTrees: Array<URL> = [this.toUrl(server, "/static/shapetrees/validation/shapetree#ChildTree")];
    let focusNodes: Array<URL> = [this.toUrl(server, "/data/container-1/resource-1#resource")];
    // Plant the data repository on newly created data container
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(201).toEqual(response.getStatusCode());
  }

  // @SneakyThrows, @Test, @DisplayName("Fail to create - two containing trees and focus node issues")
  async failToValidateTwoContainsWithBadFocusNodes(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientValidationTests.dispatcher);
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/container-1-twocontains-manager"], "GET", "/data/container-1/.shapetree", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-1/resource-1", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/resource-1.shapetree", null));
    let targetResource: URL = this.toUrl(server, "/data/container-1/");
    let targetShapeTrees: Array<URL> = [this.toUrl(server, "/static/shapetrees/validation/shapetree#AttributeTree"), this.toUrl(server, "/static/shapetrees/validation/shapetree#ElementTree")];
    // Only one matching target focus node is provided
    let focusNodes: Array<URL> = [this.toUrl(server, "/super/bad#node")];
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // Multiple non-matching target focus nodes are provided
    focusNodes = [this.toUrl(server, "/super/bad#node"), this.toUrl(server, "/data/container-1/resource-1#badnode"), this.toUrl(server, "/data/container-1/#badnode")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // Only one matching target focus node is provided when two are needed
    focusNodes = [this.toUrl(server, "/data/container-1/resource-1#resource")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
  }

  /* TODO - Cannot execute this test predicatably as constituted when passing focus nodes from client. Need to test closer to shape tree validation
    @SneakyThrows
    @Test
    @DisplayName("Fail to validate created resource - two containing trees, target node unused")
    void failToValidateTwoContainsTargetNodeUnused() {
        const server = getLocal({ debug: false });
        server.setDispatcher(AbstractHttpClientValidationTests.dispatcher);

        AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/container-1-twocontains-onenode-manager"], "GET", "/data/container-1/.shapetree", null));
        AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-1/resource-1", null));
        AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/", null));
        AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/resource-1.shapetree", null));

        URL targetResource = this.toUrl(server, "/data/container-1/");
        List<URL> targetShapeTrees = [this.toUrl(server, "/static/shapetrees/validation/shapetree#AttributeTree"),
                this.toUrl(server, "/static/shapetrees/validation/shapetree#ElementTree")];
        // Two target nodes are provided, but one of the nodes is matched twice, and the other isn't matched at all
        List<URL> focusNodes = [this.toUrl(server, "/data/container-1/resource-1#resource")];

        DocumentResponse response = this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
        expect(422).toEqual(response.getStatusCode());

    }
    */
  // @SneakyThrows, @Test, @DisplayName("Fail to create - two containing trees, bad target shape trees")
  async failToValidateTwoContainsWithBadTargetShapeTrees(): Promise<void> {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientValidationTests.dispatcher);
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/container-1-twocontains-manager"], "GET", "/data/container-1/.shapetree", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["validation/resource-1-create-response"], "POST", "/data/container-1/resource-1", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/", null));
    AbstractHttpClientValidationTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/container-1/resource-1.shapetree", null));
    let targetResource: URL = this.toUrl(server, "/data/container-1/");
    let focusNodes: Array<URL> = [this.toUrl(server, "/data/container-1/resource-1#resource"), this.toUrl(server, "/data/container-1/resource-1#element")];
    // Only one matching target shape tree is provided
    let targetShapeTrees: Array<URL> = [this.toUrl(server, "/static/shapetrees/validation/shapetree#AttributeTree")];
    let response: DocumentResponse = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // Multiple non-matching target focus nodes are provided
    targetShapeTrees = [this.toUrl(server, "/static/shapetrees/validation/shapetree#OtherAttributeTree"), this.toUrl(server, "/static/shapetrees/validation/shapetree#OtherElementTree")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
    // One tree provided that isn't in either st:contains lists
    targetShapeTrees = [this.toUrl(server, "/static/shapetrees/validation/shapetree#AttributeTree"), this.toUrl(server, "/static/shapetrees/validation/shapetree#StandaloneTree")];
    response = await this.shapeTreeClient.postManagedInstance(this.context, targetResource, focusNodes, this.getResource1BodyString(), "text/turtle", targetShapeTrees, "resource-1", false);
    expect(422).toEqual(response.getStatusCode());
  }

  private getResource1BodyString(): string {
    return "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \n" + "PREFIX xml: <http://www.w3.org/XML/1998/namespace> \n" + "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" + "PREFIX ex: <http://www.example.com/ns/ex#> \n" + "\n" + "\n" + "<#resource> \n" + "    ex:name \"Some Development Task\" ; \n" + "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n" + "\n" + "<#element> \n" + "    ex:name \"Some element\" ; \n" + "    ex:description \"This is a description of an element\" ; \n" + "    ex:created_at \"2021-04-04T20:15:47.000Z\"^^xsd:dateTime . \n";
  }
}
