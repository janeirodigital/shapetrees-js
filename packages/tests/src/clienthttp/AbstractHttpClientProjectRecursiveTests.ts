// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.clienthttp
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { DispatcherEntry } from '../fixtures/DispatcherEntry';
import { RequestMatchingFixtureDispatcher } from '../fixtures/RequestMatchingFixtureDispatcher';
import { AbstractHttpClientTests } from './AbstractHttpClientTests';
import * as log from 'loglevel';
// @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
export class AbstractHttpClientProjectRecursiveTests extends AbstractHttpClientTests {

  private static dispatcher: RequestMatchingFixtureDispatcher = null!; // handled in beforeAll

  public constructor() {
    // Call AbstractHttpClient constructor
    super();
  }

  dispatcher = new RequestMatchingFixtureDispatcher([
    new DispatcherEntry(["project/data-container"], "GET", "/data/", null),
    new DispatcherEntry(["project/projects-container"], "GET", "/data/projects/", null),
    new DispatcherEntry(["project/project-1-container"], "GET", "/data/projects/project-1/", null),
    new DispatcherEntry(["project/milestone-3-container"], "GET", "/data/projects/project-1/milestone-3/", null),
    new DispatcherEntry(["project/task-48-container"], "GET", "/data/projects/project-1/milestone-3/task-48/", null),
    new DispatcherEntry(["project/task-6-container-no-contains"], "GET", "/data/projects/project-1/milestone-3/task-6/", null),
    new DispatcherEntry(["project/issue-2"], "GET", "/data/projects/project-1/milestone-3/issue-2", null),
    new DispatcherEntry(["project/issue-3"], "GET", "/data/projects/project-1/milestone-3/issue-3", null),
    new DispatcherEntry(["project/attachment-48"], "GET", "/data/projects/project-1/milestone-3/task-48/attachment-48", null),
    new DispatcherEntry(["project/random-png"], "GET", "/data/projects/project-1/milestone-3/task-48/random.png", null),
    new DispatcherEntry(["shapetrees/project-shapetree-ttl"], "GET", "/static/shapetrees/project/shapetree", null),
    new DispatcherEntry(["schemas/project-shex"], "GET", "/static/shex/project/shex", null),
    // new DispatcherEntry(["http/201"], "POST", "/data/.shapetree", null),
    // new DispatcherEntry(["http/201"], "POST", "/data/projects/.shapetree", null),
    new DispatcherEntry(["project/data-container-manager"], "GET", "/data/.shapetree", null),
    new DispatcherEntry(["project/projects-container-manager"], "GET", "/data/projects/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/attachment-48.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/random.png.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-48/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/task-6/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/issue-3.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/issue-2.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/milestone-3/.shapetree", null),
    new DispatcherEntry(["http/201"], "POST", "/data/projects/project-1/.shapetree", null),
  ]);

  public startServer() { return this.server.start(this.dispatcher); }
  public stopServer() { return this.server.stop(); }

  runTests (driver: string) {
    describe(`AbstractHttpClientProjectRecursiveTests using ${driver}`, () => {

/*
// plantDataRecursively
test("Recursively Plant Data Set", async () => {
    let targetResource: URL = this.server.urlFor("/data/");
    let targetShapeTree: URL = this.server.urlFor("/static/shapetrees/project/shapetree#DataRepositoryTree");
    let focusNode: URL = this.server.urlFor("/data/#repository");
    // Plant the data collection recursively on already existing hierarchy
    let response: DocumentResponse = await this.shapeTreeClient.plantShapeTree(this.context, targetResource, targetShapeTree, focusNode);
    expect(201).toEqual(response.getStatusCode());
});
*/

// plantProjectsRecursively
test("Recursively Plant Projects Collection", async () => {
    // Add planted data set
    let targetResource: URL = this.server.urlFor("/data/projects/");
    let targetShapeTree: URL = this.server.urlFor("/static/shapetrees/project/shapetree#ProjectCollectionTree");
    // Plant the projects collection recursively on already existing hierarchy
    let response: DocumentResponse = await this.shapeTreeClient.plantShapeTree(this.context, targetResource, targetShapeTree, null!);
    expect(201).toEqual(response.getStatusCode());
});

    });
  }
}
