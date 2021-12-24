// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeResourceType } from './enums/ShapeTreeResourceType';
import { ResourceAttributes } from './ResourceAttributes';

export interface ShapeTreeRequest {

  getMethod(): string;

  getUrl(): URL;

  getHeaders(): ResourceAttributes;

  getLinkHeaders(): ResourceAttributes;

  getHeaderValues(header: string): Array<string>;

  getHeaderValue(header: string): string | null;

  getBody(): string;

  getContentType(): string | null;

  getResourceType(): ShapeTreeResourceType | null;

  setResourceType(resourceType: ShapeTreeResourceType): void;
}
