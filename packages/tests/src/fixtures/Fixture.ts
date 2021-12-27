// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.fixtures
import * as Fs from 'fs';
import * as Path from 'path';
import Yaml from 'js-yaml';
import {CallbackResponseResult} from "mockttp/dist/rules/requests/request-handlers";
import {CallbackResponseMessageResult} from "mockttp/src/rules/requests/request-handlers";
import { Headers } from 'mockttp/src/types'

/**
 * Originated from: https://github.com/orhanobut/mockwebserverplus (apache license)
 * Key changes:
 *  - Did not support non-JSON body response
 *  - Added minor token replacement for server base url in fixture contents
 *
 * A value container that holds all information about the fixture file.
 */
export class Fixture {

    // ignore nulls on fields written by YAML for now
   public statusCode: number = null!;
   public body: string = null!;
   public headers: Array<string> | null = null;
   public delay: number = null!;

    public toString(): string {
        return "Fixture{" +
            "statusCode=" + this.statusCode +
            ", body='" + this.body + '\'' +
            ", headers=" + this.headers +
            ", delay=" + this.delay +
            '}';
    }

    toMockResponse(): CallbackResponseMessageResult {
        /*
            statusCode?: number;
            status?: number; // exists for backwards compatibility only
            statusMessage?: string;
            headers?: Headers;

            json?: any;
            body?: string | Buffer | Uint8Array;
         */
        const headers: Headers = {};
        this.headers?.forEach(s => {
            const i = s.indexOf(':');
            if (i === -1) throw new Error(`can't parse header value ${s}`);
            const key = s.substring(0, i);
            const value = s.substring(i+1);
            if (key in headers) headers[key] += ", " + value;
            else headers[key] = value;
        })
        return {
            statusCode: this.statusCode,
            headers,
            body: this.body,
        }
    }

  /**
   * Parse the given filename and returns the Fixture object.
   *
   * @param fileName filename should not contain extension or relative path. ie: login
   */
  public static parseFrom(text: string, serverBase: string): Fixture {
      const ret = Yaml.load(text) as Fixture;
      Object.setPrototypeOf(ret, Fixture.prototype);
      return ret;
  }
}
