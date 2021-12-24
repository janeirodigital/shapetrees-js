// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp
import { HttpClient } from '@shapetrees/client-http/src/HttpClient';
import { HttpRequest } from '@shapetrees/client-http/src/HttpRequest';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { HttpClientNodeFetchValidatingInterceptor } from './HttpClientNodeFetchValidatingInterceptor';
import fetch from 'node-fetch';
import { Headers, Request, RequestInit, Response } from 'node-fetch';
import https, {Agent} from 'https';
import * as log from 'loglevel';

/**
 * java.net.http implementation of HttpClient
 */
export class HttpClientNodeFetch implements HttpClient {

   private validatingWrapper: HttpClientNodeFetchValidatingInterceptor | null;
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
    const resp = await fetch(request.resourceURL.href, {
        method: request.method,
        body: request.body,
        headers: request.headers?.toList(), // TODO: unsure a list is allowed
    });
    let body: string | null = null;
    try {
      body = await resp.text();
    } catch (ex: any) {
       log.error("Exception retrieving body string");
    }
    const attrs = new ResourceAttributes();
    for (let key in resp.headers) {
      if (HttpClientNodeFetch.ListHeaders.indexOf(key.toLowerCase()) !== -1) {
          const values: string[] = resp.headers.get(key)!.split(/,/);
          attrs.setAll(key, values);
      } else {
          attrs.setAll(key, [resp.headers.get(key)!]);
      }
    }
    return new DocumentResponse(attrs, body, resp.status);
  }

  static ListHeaders = ['link'];

    /**
   * Construct an HttpClientNodeFetch with switches to enable or disable SSL and ShapeTree validation
   * @param useSslValidation
   * @param useShapeTreeValidation
   * @throws NoSuchAlgorithmException potentially thrown while disabling SSL validation
   * @throws KeyManagementException potentially thrown while disabling SSL validation
   */
  public constructor(useSslValidation: boolean, useShapeTreeValidation: boolean) /* throws NoSuchAlgorithmException, KeyManagementException */ {
    this.validatingWrapper = null;
    if (useShapeTreeValidation) {
      this.validatingWrapper = new HttpClientNodeFetchValidatingInterceptor();
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
  private async fetch(request: HttpRequest): Promise<Response> /* throws ShapeTreeException */ {
    let outHeaders: Headers | null = null;
    const opts: RequestInit = {};
    try {
      const fetchRequest = new Request(request.resourceURL.href, opts);
      let contentTypeLowerCase: string | null = null;
      if (request.headers !== null) {
        let headerList: string[] = request.headers.toList("connection", "content-length", "date", "expect", "from", "host", "upgrade", "via", "warning");
        if (headerList.length > 0) {
          outHeaders = opts.headers = new Headers();
          for (let pair of request.headers.toMultimap()) {
            const [key, values] = pair;
            for (let value of values) {
              outHeaders.append(key, value);
              if (key === 'content-type') {
                if (contentTypeLowerCase !== null) {
                  throw new ShapeTreeException(500, "duplicate content-type headers: [" + contentTypeLowerCase! + ', ' + value + "].");
                }
                contentTypeLowerCase = value.toLowerCase();
              }
            }
          }
        }
      }
      switch (request.method) {
        case "GET":
        case "DELETE":
          opts.method = request.method;
          opts.body = null;
          break;
        case "PUT":
        case "POST":
        case "PATCH":
          opts.method = request.method;
          opts.body = request.body;
          if (request.contentType !== null) {
            const ctypeParmLowerCase = request.contentType.toLowerCase();
            if (contentTypeLowerCase !== null) {
              if (ctypeParmLowerCase !== contentTypeLowerCase) {
                throw new ShapeTreeException(500, "headers set Content-Type to \"" + contentTypeLowerCase + "\" but fetch argument was \"" + ctypeParmLowerCase + "\".");
              }
            } else {
              contentTypeLowerCase = request.contentType.toLowerCase();
            }
            if (outHeaders === null) {
              outHeaders = opts.headers = new Headers();
            }
            outHeaders.append("Content-Type", request.contentType);
          } else if (contentTypeLowerCase === null) {
            throw new ShapeTreeException(500, "no content-type for " + request.method + " <" + request.resourceURL.href + ">.");
          }
          break;
        default:
          throw new ShapeTreeException(500, "Unsupported HTTP method for resource creation");
      }
      if (this.validatingWrapper === null) {
        return HttpClientNodeFetch.check(await fetch(fetchRequest));
      } else {
        return this.validatingWrapper.validatingWrap(fetchRequest, opts.body, contentTypeLowerCase);
      }
    } catch (ex: any) {
      if (typeof ex === "object" &&
          ex instanceof TypeError &&
          // @ts-ignore
          ex.code === "ERR_INVALID_URL") { // tsc says TypeError has no `code`, but empirically, these do: `try {new URL("@#$");} catch(ex) { console.log(ex instanceof TypeError && ex.code === "ERR_INVALID_URL"); }`
        throw new ShapeTreeException(500, "Malformed URL <" + request.resourceURL + ">: " + ex.message);
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
