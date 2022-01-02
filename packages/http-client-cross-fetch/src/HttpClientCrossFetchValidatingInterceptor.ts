// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.javahttp
import { HttpResourceAccessor } from '@shapetrees/client-http/src/HttpResourceAccessor';
import { DocumentResponse } from '@shapetrees/core/src/DocumentResponse';
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';
import { ResourceAccessor } from '@shapetrees/core/src/ResourceAccessor';
import { ShapeTreeRequest } from '@shapetrees/core/src/ShapeTreeRequest';
import { HttpHeaders } from '@shapetrees/core/src/enums/HttpHeaders';
import { ShapeTreeResourceType } from '@shapetrees/core/src/enums/ShapeTreeResourceType';
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { ValidatingMethodHandler } from '@shapetrees/core/src/methodhandlers/ValidatingMethodHandler';
import { ValidatingDeleteMethodHandler } from '@shapetrees/core/src/methodhandlers/ValidatingDeleteMethodHandler';
import { ValidatingPutMethodHandler } from '@shapetrees/core/src/methodhandlers/ValidatingPutMethodHandler';
import { ValidatingPatchMethodHandler } from '@shapetrees/core/src/methodhandlers/ValidatingPatchMethodHandler';
import { ValidatingPostMethodHandler } from '@shapetrees/core/src/methodhandlers/ValidatingPostMethodHandler';
import { HeadersMultiMap } from '@shapetrees/core/src/todo/HeadersMultiMap';
import fetch, { Headers, Request, Response } from 'cross-fetch';
import * as log from 'loglevel';
import { HttpClientCrossFetch } from "./HttpClientCrossFetch";

/**
 * Wrapper used for client-side validation
 */
export class HttpClientCrossFetchValidatingInterceptor {

    private static readonly POST: string = "POST";

    private static readonly PUT: string = "PUT";

    private static readonly PATCH: string = "PATCH";

    private static readonly DELETE: string = "DELETE";

    // @NotNull
    public async validatingWrap(input: Request | string, init?: RequestInit | undefined): Promise<Response> /* throws IOException, InterruptedException */ {
        const fetchRequest = input instanceof Request
            ? input
            : new Request(input, init);
        const body: string | null = fetchRequest.body ? await fetchRequest.text() : null;
        let shapeTreeRequest: ShapeTreeRequest = new JsHttpShapeTreeRequest(fetchRequest, body, fetchRequest.headers.get(HttpHeaders.CONTENT_TYPE));
        let resourceAccessor: ResourceAccessor = new HttpResourceAccessor();
        // Get the handler
        let handler: ValidatingMethodHandler | null = HttpClientCrossFetchValidatingInterceptor.getHandler(shapeTreeRequest.getMethod(), resourceAccessor);
        if (handler != null) {
            try {
                let shapeTreeResponse: DocumentResponse | null = await handler.validateRequest(shapeTreeRequest);
                if (shapeTreeResponse === null) {
                    return HttpClientCrossFetch.check(await fetch(fetchRequest));
                } else {
                    return HttpClientCrossFetchValidatingInterceptor.createResponse(shapeTreeResponse);
                }
            } catch (ex: any) {
                if (ex instanceof ShapeTreeException) {
                    log.error("Error processing shape tree request: ", ex);
                    return HttpClientCrossFetchValidatingInterceptor.createErrorResponse(ex);
                } else {
                    log.error("Error processing shape tree request: ", ex);
                    return HttpClientCrossFetchValidatingInterceptor.createErrorResponse(new ShapeTreeException(500, ex.message));
                }
            }
        } else {
            log.warn("No handler for method [{}] - passing through request", shapeTreeRequest.getMethod());
            return HttpClientCrossFetch.check(await fetch(fetchRequest));
        }
    }

    private static getHandler(requestMethod: string, resourceAccessor: ResourceAccessor): ValidatingMethodHandler | null {
        switch (requestMethod) {
            case "POST":
                return new ValidatingPostMethodHandler(resourceAccessor);
            case "PUT":
                return new ValidatingPutMethodHandler(resourceAccessor);
            case "PATCH":
                return new ValidatingPatchMethodHandler(resourceAccessor);
            case "DELETE":
                return new ValidatingDeleteMethodHandler(resourceAccessor);
            default:
                return null;
        }
    }

    private static createErrorResponse(exception: ShapeTreeException): Response {
        const status = exception.getStatusCode();
        return new Response(exception.message, {status});
    }

    // @SneakyThrows
    private static createResponse(response: DocumentResponse): Response {
      const headers = new Headers();
      const resourceAttributesOpt = response.getResourceAttributes();
      if (resourceAttributesOpt !== null) {
          for (let pair of resourceAttributesOpt.toMultimap()) {
              const [key, values] = pair;
              for (let value of values) {
                  headers.append(key, value);
              }
          }
      }
      const status = response.getStatusCode();
      return new Response(response.getBody(), {status, headers});
    }
}

  class JsHttpShapeTreeRequest implements ShapeTreeRequest {

     private readonly request: Request;

     private resourceType: ShapeTreeResourceType | null;

     private readonly body: string | null;

     private readonly contentType: string | null;

     private readonly headers: ResourceAttributes;

    public constructor(request: Request, body: string | null, contentType: string | null) {
      this.request = request;
      this.body = body;
      this.contentType = contentType;
      this.resourceType = null;
      const tm = new HeadersMultiMap();
      this.request.headers.forEach((value, key) => {
          tm.setCommaSeparated(key, value);
      });
      this.headers = new ResourceAttributes(tm);
    }

    public getMethod(): string {
      return this.request.method;
    }

    public getUrl(): URL {
      try {
        return new URL(this.request.url);
      } catch (ex: any) {
         throw new Error("request has a malformed URL <" + this.request.url + ">: " + ex.message);
       }
    }

    public getHeaders(): ResourceAttributes {
      return this.headers;
    }

    public getLinkHeaders(): ResourceAttributes {
      return ResourceAttributes.parseLinkHeaders(this.getHeaderValues(HttpHeaders.LINK));
    }

    public getHeaderValues(header: string): Array<string> {
      return this.headers.allValues(header);
    }

    public getHeaderValue(header: string): string | null {
      return this.request.headers.get(header) || null;
    }

    public getContentType(): string | null {
      return this.request.headers.get(HttpHeaders.CONTENT_TYPE) || null;
    }

    public getResourceType(): ShapeTreeResourceType | null {
      return this.resourceType;
    }

    public setResourceType(resourceType: ShapeTreeResourceType): void {
      this.resourceType = resourceType;
    }

    public getBody(): string | null {
      return this.body;
    }
  }
