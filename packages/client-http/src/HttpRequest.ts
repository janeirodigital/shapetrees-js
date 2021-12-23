// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.client.http
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';

export class HttpRequest {

   public method: string;

   public resourceURL: URL;

   public headers: ResourceAttributes | null;

   public body: string | null;

   public contentType: string | null;

  public constructor(method: string, resourceURL: URL, headers: ResourceAttributes | null, body: string | null, contentType: string | null) {
    this.method = method;
    this.resourceURL = resourceURL;
    this.headers = headers;
    this.body = body;
    this.contentType = contentType;
  }
}
