// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { HttpHeaders } from './enums/HttpHeaders';
import { ResourceAttributes } from './ResourceAttributes';

export class DocumentResponse {

   private readonly resourceAttributes: ResourceAttributes | null;

   private readonly body: string | null;

   private readonly statusCode: number;

  public getContentType(): string | null {
    return this.resourceAttributes === null
        ? null
        : this.resourceAttributes.firstValue(HttpHeaders.CONTENT_TYPE);
  }

  // TODO: lots of choices re non-404, not >= 4xx, not 3xx. not 201 (meaning there's no body)
  public isExists(): boolean {
    return Math.floor(this.statusCode / 100) === 2;
  }

  public constructor(resourceAttributes: ResourceAttributes | null, body: string | null, statusCode: number) {
    this.resourceAttributes = resourceAttributes;
    this.body = body;
    this.statusCode = statusCode;
  }

  public getResourceAttributes(): ResourceAttributes | null {
    return this.resourceAttributes;
  }

  public getBody(): string | null {
    return this.body;
  }

  public getStatusCode(): number {
    return this.statusCode;
  }
}
