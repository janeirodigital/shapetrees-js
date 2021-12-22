// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.contentloaders
import { DocumentResponse } from '../DocumentResponse';
import { ResourceAttributes } from '../ResourceAttributes';
import { ShapeTreeException } from '../exceptions/ShapeTreeException';
import { ExternalDocumentLoader } from './ExternalDocumentLoader';
import fetch from 'node-fetch';

/**
 * Simple HTTP implementation of ExternalDocumentLoader provided as an example
 * as well as for its utility in unit tests.
 */
export class HttpExternalDocumentLoader implements ExternalDocumentLoader {

  private readonly FetchOpts = {redirect: 'error'};
  static CommaSeparatedHeaders = ['link'];

    public async loadExternalDocument(resourceUrl: URL): Promise<DocumentResponse> /* throws ShapeTreeException */ {
    try {
        const response = await fetch(resourceUrl.href/*, this.FetchOpts*/);
        if (!response.ok) {
            throw new Error("Failed to load contents of document: " + resourceUrl);
        }
        const myHeaders = new Map<string, Array<string>>();
        response.headers.forEach((value, key) => {
            if (HttpExternalDocumentLoader.CommaSeparatedHeaders.indexOf(key) !== -1) {
                myHeaders.set(key, value.split(/,/));
            } else {
                myHeaders.set(key, [value]);
            }
        });
      let attributes: ResourceAttributes = new ResourceAttributes(myHeaders);
      return new DocumentResponse(attributes, await response.text(), response.status);
    } catch (ex: unknown) {
      throw new ShapeTreeException(500, "Error retrieving <" + resourceUrl + ">: " + (<Error>ex).message);
    }
  }
}
