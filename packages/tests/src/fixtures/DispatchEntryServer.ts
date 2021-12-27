// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.fixtures
import {Mockttp, getLocal, RequestRuleBuilder, CompletedRequest, MockedEndpoint} from 'mockttp';
import {RequestMatchingFixtureDispatcher} from "./RequestMatchingFixtureDispatcher";
import {DispatcherEntry} from "./DispatcherEntry";
import * as Fs from "fs";
import * as Path from "path";
import {Fixture} from "./Fixture";
import {CallbackResponseResult} from "mockttp/dist/rules/requests/request-handlers";

export interface ServerStartResults {
  endpoint: MockedEndpoint,
  fixtures: any[],
}

export class DispatchEntryServer {

  mockServer: Mockttp = getLocal({ debug: false });
  dispatcher: RequestMatchingFixtureDispatcher | null = null;

  async start(dispatcher: RequestMatchingFixtureDispatcher): Promise<ServerStartResults> {
    this.dispatcher = dispatcher;
    await this.mockServer.start();
    const fixtures = await this.prepareServer(dispatcher.configuredFixtures);
    const endpoint = await this.mockServer.forAnyRequest().thenCallback(request => this.handleRequest(request));
    const ret: ServerStartResults = {endpoint, fixtures}; // start's return is void; just return the endpoint
    return ret;
  }

  async handleRequest(request: CompletedRequest): Promise<CallbackResponseResult> {
    /*
     * CompletedRequest looks like:
     *   id: '07fd9cd4-f0e7-4ec9-893b-0a5267ef831c',
     *   matchedRuleId: '4719d8ab-b639-4bdc-81c0-d85b7738df3a',
     *   protocol: 'http', httpVersion: '1.1',
     *   method: 'POST', url: 'http://localhost:8014/path/1/', path: '/path/1/',
     *   remoteIpAddress: '::ffff:127.0.0.1', remotePort: 36754,
     *   headers: { link: 'link1, link2', 'content-type': 'text/plain;charset=UTF-8', ... },
     *   tags: [],
     *   timingEvents: { startTime: 1640576995492, startTimestamp: 4478.407497, bodyReceivedTimestamp: 4480.648247 },
     *   body: { getText(): P<string|undef>, getJSON(): P<object|undef>, getDecodedBuffer(): P<Buffer|undef>, getFormData(): P<{[key: string]:string|string[]|undef;}|undef>}
     */
    if (this.dispatcher !== null) {
      return Promise.resolve(this.dispatcher.dispatch(request));
    }
    const ret = {statusCode: 404, headers: {'mock-header': 'set'}, body: request.method + ' ' + request.path};
    return Promise.resolve(ret);
  }

  async prepareServer(dispatchers: DispatcherEntry[]): Promise<any> {
    return Promise.all(dispatchers.map((dispatcherEntry) => { // Doesn't use promise yet 'cause file access is synchronous.
        const loaded = dispatcherEntry.fixtureNames.map((fixtureName:string ) => {
          const baseUrl = this.mockServer.urlFor('/').slice(0, -1);
          const fixtureFilePath = Path.join(__dirname, '../../fixtures', fixtureName + '.yaml');
          let fixtureText = Fs.readFileSync(fixtureFilePath, 'utf8');
          fixtureText = fixtureText.replace(/\$\{SERVER_BASE\}/g, baseUrl);
          const fixture = Fixture.parseFrom(fixtureText, "");
          dispatcherEntry.fixtures.push(fixture);
          return {fixtureFilePath, fixture};
          // fixture.body = fixture.body.replace(/\$\{SERVER_BASE\}/g, baseUrl);
        });
        return { dispatcherEntry, loaded };
    }))
  }

  stop(): Promise<void> {
    // console.log('srv stop ' + this.urlFor("")); // DEBUG
    return this.mockServer.stop();
  }

  // wrapped mockttp functions
  urlFor(path: string): URL { return new URL(this.mockServer.urlFor(path)); }
}
