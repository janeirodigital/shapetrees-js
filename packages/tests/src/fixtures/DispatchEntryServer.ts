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
}

export class DispatchEntryServer {

  mockServer: Mockttp = getLocal({ debug: false });
  start(dispatcher: RequestMatchingFixtureDispatcher): Promise<ServerStartResults> {
    return Promise.all([
      this.mockServer.start().then(() => this.prepareServer(dispatcher.configuredFixtures)),
      this.mockServer.forAnyRequest().thenCallback(request => this.handleRequest(request)),
    ]).then((pz): ServerStartResults => {
      return {endpoint: pz[1]};
    }); // start's return is void; just return the endpoint
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
    const ret = {statusCode: 200, headers: {'mock-header': 'set'}, body: request.method + ' ' + request.path};
    return Promise.resolve(ret);
  }

  prepareServer(dispatchers: DispatcherEntry[]): Promise<any> {
    return Promise.all(dispatchers.map(
      (d) => {
        const baseUrl = this.mockServer.urlFor('/').slice(0, -1);
        let fixtureText = Fs.readFileSync(Path.join(__dirname, '../../fixtures', d.fixtureNames[0] + '.yaml'), 'utf8');
        fixtureText = fixtureText.replace(/\$\{SERVER_BASE\}/g, baseUrl);
        const fixture = Fixture.parseFrom(fixtureText, "");
        // console.log(fixture.toString());
        // fixture.body = fixture.body.replace(/\$\{SERVER_BASE\}/g, baseUrl);
      }
    ))
  }

  stop(): Promise<void> {
    return this.mockServer.stop();
  }

  // wrapped mockttp functions
  urlFor(path: string): string { return this.mockServer.urlFor(path); }
}
