// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.fixtures
import { DispatcherEntry } from './DispatcherEntry';
import { CompletedRequest } from "mockttp";
import { Fixture } from "./Fixture";
import { URL } from "url";
import { CallbackResponseMessageResult } from "mockttp/src/rules/requests/request-handlers";
import { Headers } from 'mockttp/src/types'
import { HeadersMultiMap } from '@shapetrees/core/src/todo/HeadersMultiMap';
import * as log from 'loglevel';
import Fs from "fs";
import Path from "path";

export class RequestMatchingFixtureDispatcher {

   configuredFixtures: Array<DispatcherEntry>;

   private readonly fixtureHitCounts: Map<DispatcherEntry, number> = new Map();

  public constructor(configuredFixtures: Array<DispatcherEntry>) {
    this.configuredFixtures = configuredFixtures;
  }

  // @NotNull
  public dispatch(recordedRequest: CompletedRequest): CallbackResponseMessageResult {
    for (const entry of this.configuredFixtures) {
      // console.log('srv -> ' + recordedRequest.method + ' ' + recordedRequest.url); // DEBUG
      if (this.matchesRequest(recordedRequest, entry)) {
        try {
          const serverBaseUrl = new URL(recordedRequest.url)
          const serverBase = serverBaseUrl.protocol + "://" + serverBaseUrl.hostname + ":" + serverBaseUrl.port;
          let fixture = entry.fixtures[entry.hit];
          if (entry.hit < entry.fixtures.length - 1) { ++entry.hit; } // stop on last one
          let resp: CallbackResponseMessageResult = fixture.toMockResponse();
          if (resp.statusCode === 200 && recordedRequest.method === "POST") {
            const msg: string = "Mock: response to POST " + recordedRequest + " with " + entry + " returns " + resp.statusCode;
            log.error(msg);
            // This will show up in a stack trace,
            resp.statusCode = 999;
            // but we can add it as a body as well.
            resp.body = msg;
          }
          return resp;
        } catch (ex: any) {
          let msg: string = ex.message;
          const headers: Headers = {};
          const exceptionResponse: CallbackResponseMessageResult = {
              statusCode: 999,
              body: msg,
              headers: headers
          };
          console.error(ex);
          log.error(msg);
          return exceptionResponse;
        }
      }
    }
    const failureMessage = `Mock: no response found for ${recordedRequest.method} ${recordedRequest.path}`
    log.error(failureMessage);
    return {
        statusCode: 404,
        body: failureMessage,
    };
  }
    /*

      public getFixtureByPath(expectedPath: string): DispatcherEntry {
        for (const entry of this.configuredFixtures) {
          if (entry.getExpectedPath() === expectedPath) {
            return entry;
          }
        }
        return null;
      }

      public removeFixtureByPath(expectedPath: string): void {
        let fixture: DispatcherEntry = getFixtureByPath(expectedPath);
        if (fixture != null) {
          this.configuredFixtures.remove(fixture);
        }
      }
    */
      private getFixtureName(entry: DispatcherEntry): string | null {
        let hits: number;
        if (!this.fixtureHitCounts.has(entry)) {
          this.fixtureHitCounts.set(entry, 1);
          hits = 1;
        } else {
          let existingHits: number = this.fixtureHitCounts.get(entry) || 0;
          existingHits++;
          this.fixtureHitCounts.set(entry, existingHits);
          hits = existingHits;
        }
        if (entry.getFixtureNames().length === 1) {
          return entry.getFixtureNames()[0];
        } else if (entry.getFixtureNames().length > 1) {
          let listIndex: number = hits - 1;
          if (listIndex >= entry.getFixtureNames().length) {
            return entry.getFixtureNames()[entry.getFixtureNames().length - 1];
          }
          return entry.getFixtureNames()[listIndex];
        } else if (entry.getFixtureNames().length < 1) {
          return null;
        }
        return null;
      }

      private matchesRequest(recordedRequest: CompletedRequest, configuredFixture: DispatcherEntry): boolean {
        if (recordedRequest.method === null)
          return false;
        if (recordedRequest.path === null)
          return false;
        if (recordedRequest.method !== configuredFixture.getExpectedMethod())
          return false;
        if (recordedRequest.path !== configuredFixture.getExpectedPath())
          return false;
        if (configuredFixture.getExpectedHeaders() === null)
          return true;
        let recordedHeaders = new HeadersMultiMap();
        for (const [key, value] of Object.entries(recordedRequest.headers)) {
            if (value === undefined) {
            } else if (typeof value === 'string') { // repeated (link) headers appear to come in as a single, comma-separated string
                recordedHeaders.replace(key, value);
            } else {
                recordedHeaders.set(key, value);
            }
        }
        for (const [expectedHeaderName, expectedHeaderValues] of configuredFixture.getExpectedHeaders()!.entries()) {
          if (!recordedHeaders.has(expectedHeaderName))
            return false;
          for (const expectedHeaderValue of expectedHeaderValues) {
            if (recordedHeaders.get(expectedHeaderName)!.indexOf(expectedHeaderValue) === -1)
              return false;
          }
        }
        return true;
      }
    /*
      public getConfiguredFixtures(): Array<DispatcherEntry> {
        return this.configuredFixtures;
      }

      public getFixtureHitCounts(): Map<DispatcherEntry, number> {
        return this.fixtureHitCounts;
      }
    */
}
