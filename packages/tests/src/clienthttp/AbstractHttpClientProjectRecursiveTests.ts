// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DispatcherEntry } from '../fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import {Mockttp, getLocal} from 'mockttp';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';

// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientProjectRecursiveTests extends AbstractHttpClientTests {

   private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll

  public constructor() {
    // Call AbstractHttpClient constructor
    super();
  }

  // @BeforeAll
  static beforeAll(): void {
    let dispatcherList: Array<DispatcherEntry> = new Array();
    dispatcherList.push(new DispatcherEntry(["project/data-container"], "GET", "/data/", null));
    dispatcherList.push(new DispatcherEntry(["project/projects-container"], "GET", "/data/projects/", null));
    dispatcherList.push(new DispatcherEntry(["project/project-1-container"], "GET", "/data/projects/project-1/", null));
    dispatcherList.push(new DispatcherEntry(["project/milestone-3-container"], "GET", "/data/projects/project-1/milestone-3/", null));
    dispatcherList.push(new DispatcherEntry(["project/task-48-container"], "GET", "/data/projects/project-1/milestone-3/task-48/", null));
    dispatcherList.push(new DispatcherEntry(["project/task-6-container-no-contains"], "GET", "/data/projects/project-1/milestone-3/task-6/", null));
    dispatcherList.push(new DispatcherEntry(["project/issue-2"], "GET", "/data/projects/project-1/milestone-3/issue-2", null));
    dispatcherList.push(new DispatcherEntry(["project/issue-3"], "GET", "/data/projects/project-1/milestone-3/issue-3", null));
    dispatcherList.push(new DispatcherEntry(["project/attachment-48"], "GET", "/data/projects/project-1/milestone-3/task-48/attachment-48", null));
    dispatcherList.push(new DispatcherEntry(["project/random-png"], "GET", "/data/projects/project-1/milestone-3/task-48/random.png", null));
    dispatcherList.push(new DispatcherEntry(["shapetrees/project-shapetree-ttl"], "GET", "/static/shapetrees/project/shapetree", null));
    dispatcherList.push(new DispatcherEntry(["schemas/project-shex"], "GET", "/static/shex/project/shex", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher = new RequestMatchingFixtureDispatcher(dispatcherList);
  }

  // @Order(1), @SneakyThrows, @Test, @Label("Recursively Plant Data Set")
  plantDataRecursively(): void {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientProjectRecursiveTests.dispatcher);
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/.shapetree", null));
    let targetResource: URL = this.toUrl(server, "/data/");
    let targetShapeTree: URL = this.toUrl(server, "/static/shapetrees/project/shapetree#DataRepositoryTree");
    let focusNode: URL = this.toUrl(server, "/data/#repository");
    // Plant the data collection recursively on already existing hierarchy
    let response: DocumentResponse = this.shapeTreeClient.plantShapeTree(this.context, targetResource, targetShapeTree, focusNode);
    expect(201).toEqual(response.getStatusCode());
  }

  // @Order(2), @SneakyThrows, @Test, @Label("Recursively Plant Projects Collection")
  plantProjectsRecursively(): void {
    const server = getLocal({ debug: false });
    server.setDispatcher(AbstractHttpClientProjectRecursiveTests.dispatcher);
    // Add planted data set
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["project/data-container-manager"], "GET", "/data/.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["project/projects-container-manager"], "GET", "/data/projects/.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/attachment-48.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/random.png.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-6/.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/issue-3.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/issue-2.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/.shapetree", null));
    AbstractHttpClientProjectRecursiveTests.dispatcher.getConfiguredFixtures().push(new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/.shapetree", null));
    let targetResource: URL = this.toUrl(server, "/data/projects/");
    let targetShapeTree: URL = this.toUrl(server, "/static/shapetrees/project/shapetree#ProjectCollectionTree");
    // Plant the projects collection recursively on already existing hierarchy
    let response: DocumentResponse = this.shapeTreeClient.plantShapeTree(this.context, targetResource, targetShapeTree, null);
    expect(201).toEqual(response.getStatusCode());
  }
}
