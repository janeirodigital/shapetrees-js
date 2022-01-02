// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { HttpRequest } from '@shapetrees/client-http/src/HttpRequest';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { HttpClientCrossFetchValidatingInterceptor } from './HttpClientCrossFetchValidatingInterceptor';
import { HeadersMultiMap } from '@shapetrees/core/src/todo/HeadersMultiMap';
import fetch from 'cross-fetch';
import { Headers, Request, Response } from 'cross-fetch';
import https, {Agent} from 'https';
import * as log from 'loglevel';

/**
 * java.net.http implementation of HttpClient
 */
export class HttpClientCrossFetch implements HttpClient {

  private validatingWrapper: HttpClientCrossFetchValidatingInterceptor | null;
  private agent: Agent = new https.Agent({
    rejectUnauthorized: true,
  });

  /**
   * Execute an HTTP request to create a DocumentResponse object
   * Implements `HttpClient` interface
   * @param request an HTTP request with appropriate headers for ShapeTree interactions
   * @return new DocumentResponse with response headers and contents
   * @throws ShapeTreeException
   */
  public async fetchShapeTreeResponse(request: HttpRequest): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    const headers = new Headers();
    if (request.headers !== null) {
      for (const [key, values] of request.headers.toMultimap()) {
        for (const value of values) {
          headers.append(key, value);
        }
      }
    }
    const opts: RequestInit = {
      method: request.method,
      headers,
      body: request.body,
    };
    const fetchRequest = new Request(request.resourceURL.href, opts);
    const resp = await this.fetch(fetchRequest);

    let body: string | null = null;
    try {
      body = await resp.text();
    } catch (ex: any) {
      log.error("Exception retrieving body string");
    }

    const attrs = new HeadersMultiMap();
    for (const [key, value] of resp.headers.entries()) {
      attrs.setCommaSeparated(key, value);
    }
    return new DocumentResponse(new ResourceAttributes(attrs), body, resp.status);
  }

  static ListHeaders = ['link'];

  /**
   * Construct an HttpClientCrossFetch with switches to enable or disable SSL and ShapeTree validation
   * @param useSslValidation
   * @param useShapeTreeValidation
   * @throws NoSuchAlgorithmException potentially thrown while disabling SSL validation
   * @throws KeyManagementException potentially thrown while disabling SSL validation
   */
  public constructor(useSslValidation: boolean, useShapeTreeValidation: boolean) /* throws NoSuchAlgorithmException, KeyManagementException */ {
    this.validatingWrapper = null;
    if (useShapeTreeValidation) {
      this.validatingWrapper = new HttpClientCrossFetchValidatingInterceptor();
    }
    if (!useSslValidation) {
      this.agent = new https.Agent({
        rejectUnauthorized: false,
      })
    }
  }

  /**
   * Internal function to execute HTTP request and return java.net.http response
   * @param request
   * @return
   * @throws ShapeTreeException
   */
  private async fetch(fetchRequest: Request): Promise<Response> /* throws ShapeTreeException */ {
    try {
      if (this.validatingWrapper === null) {
        return HttpClientCrossFetch.check(await fetch(fetchRequest));
      } else {
        return this.validatingWrapper.validatingWrap(fetchRequest);
      }
    } catch (ex: any) {
      if (typeof ex === "object" &&
        ex instanceof TypeError &&
        // @ts-ignore
        ex.code === "ERR_INVALID_URL") { // tsc says TypeError has no `code`, but empirically, these do: `try {new URL("@#$");} catch(ex) { console.log(ex instanceof TypeError && ex.code === "ERR_INVALID_URL"); }`
        throw new ShapeTreeException(500, "Malformed URL <" + fetchRequest.url + ">: " + ex.message);
      }
      throw new ShapeTreeException(500, ex.message);
    }
  }

  public static async check(resp: Response): Promise<Response> {
    if (resp.status > 599) {
      const body: string = await resp.text();
      throw new Error("invalid HTTP response: " + resp + (body.length === 0 ? "" : "\n" + body));
    }
    return resp;
  }
}
