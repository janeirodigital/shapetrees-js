// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.helpers
import { ShapeTreeManager } from '../ShapeTreeManager';
import { ShapeTreeContext } from '../ShapeTreeContext';
import { ManageableInstance } from '../ManageableInstance';
import { InstanceResource } from '../InstanceResource';
import { ManagerResource } from '../ManagerResource';
import { ShapeTreeRequest } from '../ShapeTreeRequest';
import { HttpHeaders } from '../enums/HttpHeaders';
import { LinkRelations } from '../enums/LinkRelations';
import { ShapeTreeResourceType } from '../enums/ShapeTreeResourceType';
import { ShapeTreeException } from '../exceptions/ShapeTreeException';
import { LdpVocabulary } from '../vocabularies/LdpVocabulary';
import { Store } from "n3";
import log from 'loglevel';
import { N3Sparql } from '../todo/n3-sparql';
import fetch from 'cross-fetch';
import {GraphHelper} from "./GraphHelper";


export class RequestHelper {

   private static readonly PUT: string = "PUT";

   private static readonly PATCH: string = "PATCH";

   private static readonly DELETE: string = "DELETE";

   private static readonly supportedRDFContentTypes: Set<string> = new Set(["text/turtle", "application/rdf+xml", "application/n-triples", "application/ld+json"]);

   private static readonly supportedSPARQLContentTypes: Set<string> = new Set(["application/sparql-update"]);

  /**
   * Builds a ShapeTreeContext from the incoming request.  Specifically it retrieves
   * the incoming Authorization header and stashes that value for use on any additional requests made during
   * validation.
   * @param shapeTreeRequest Incoming request
   * @return ShapeTreeContext object populated with authentication details, if present
   */
  public static buildContextFromRequest(shapeTreeRequest: ShapeTreeRequest): ShapeTreeContext {
    return new ShapeTreeContext(shapeTreeRequest.getHeaderValue(HttpHeaders.AUTHORIZATION));
  }

  /**
   * This determines the type of resource being processed.
   *
   * Initial test is based on the incoming request headers, specifically the Content-Type header.
   * If the content type is not one of the accepted RDF types, it will be treated as a NON-RDF source.
   *
   * Then the determination becomes whether or not the resource is a container.
   *
   * If it is a PATCH or PUT and the URL provided already exists, then the existing resource's Link header(s)
   * are used to determine if it is a container or not.
   *
   * If it is a POST or if the resource does not already exist, the incoming request Link header(s) are relied
   * upon.
   *
   * @param shapeTreeRequest The current incoming request
   * @param existingResource The resource located at the incoming request's URL
   * @return ShapeTreeResourceType aligning to current request
   * @throws ShapeTreeException ShapeTreeException throw, specifically if Content-Type is not included on request
   */
  public static determineResourceType(shapeTreeRequest: ShapeTreeRequest, existingResource: ManageableInstance): ShapeTreeResourceType /* throws ShapeTreeException */ {
    let isNonRdf: boolean;
    if (shapeTreeRequest.getMethod() !== RequestHelper.DELETE) {
      let incomingRequestContentType: string | null = shapeTreeRequest.getContentType();
      // Ensure a content-type is present
      if (incomingRequestContentType === null) {
        throw new ShapeTreeException(400, "Content-Type is required");
      }
      isNonRdf = RequestHelper.determineIsNonRdfSource(incomingRequestContentType);
    } else {
      isNonRdf = false;
    }
    if (isNonRdf) {
      return ShapeTreeResourceType.NON_RDF;
    }
    let isContainer: boolean = false;
    let resourceAlreadyExists: boolean = existingResource.getManageableResource().isExists();
    if ((shapeTreeRequest.getMethod() === RequestHelper.PUT || shapeTreeRequest.getMethod() === RequestHelper.PATCH) && resourceAlreadyExists) {
      isContainer = existingResource.getManageableResource().isContainer();
    } else if (shapeTreeRequest.getLinkHeaders() != null) {
      isContainer = RequestHelper.getIsContainerFromRequest(shapeTreeRequest);
    }
    return isContainer ? ShapeTreeResourceType.CONTAINER : ShapeTreeResourceType.RESOURCE;
  }

  public static getIncomingFocusNodes(shapeTreeRequest: ShapeTreeRequest, baseUrl: URL): Array<URL> /* throws ShapeTreeException */ {
    const focusNodeStrings: Array<string> = shapeTreeRequest.getLinkHeaders().allValues(LinkRelations.FOCUS_NODE);
    const focusNodeUrls: Array<URL> = new Array();
    if (focusNodeStrings.length > 0) {
      for (const focusNodeUrlString of focusNodeStrings) {
        try {
          const focusNodeUrl: URL = new URL(baseUrl.href, focusNodeUrlString);
          focusNodeUrls.push(focusNodeUrl);
        } catch (ex) {
            throw new ShapeTreeException(500, "Malformed focus node when resolving <" + focusNodeUrlString + "> against <" + baseUrl + ">");
        }
      }
    }
    return focusNodeUrls;
  }

  /**
   * Gets target shape tree / hint from request header
   * @param shapeTreeRequest Request
   * @return URL value of target shape tree
   * @throws ShapeTreeException ShapeTreeException
   */
  public static getIncomingTargetShapeTrees(shapeTreeRequest: ShapeTreeRequest, baseUrl: URL): Array<URL> /* throws ShapeTreeException */ {
    const targetShapeTreeStrings: Array<string> = shapeTreeRequest.getLinkHeaders().allValues(LinkRelations.TARGET_SHAPETREE);
    const targetShapeTreeUrls: Array<URL> = new Array();
    if (targetShapeTreeStrings.length > 0) {
      for (const targetShapeTreeUrlString of targetShapeTreeStrings) {
        try {
          const targetShapeTreeUrl: URL = new URL(targetShapeTreeUrlString);
          targetShapeTreeUrls.push(targetShapeTreeUrl);
        } catch (ex) {
           throw new ShapeTreeException(500, "Malformed focus node when resolving <" + targetShapeTreeUrlString + "> against <" + baseUrl + ">");
        }
      }
    }
    return targetShapeTreeUrls;
  }

  public static async getIncomingShapeTreeManager(shapeTreeRequest: ShapeTreeRequest, managerResource: ManagerResource): Promise<ShapeTreeManager | null> /* throws ShapeTreeException */ {
    let incomingBodyGraph: Store | null = await RequestHelper.getIncomingBodyGraph(shapeTreeRequest, RequestHelper.normalizeSolidResourceUrl(shapeTreeRequest.getUrl(), null, ShapeTreeResourceType.RESOURCE), managerResource);
    if (incomingBodyGraph === null) {
      return null;
    }
    return ShapeTreeManager.getFromGraph(shapeTreeRequest.getUrl(), incomingBodyGraph);
  }

  /**
   * Normalizes the BaseURL to use for a request based on the incoming request.
   * @param url URL of request
   * @param requestedName Requested name of resource (provided on created resources via POST)
   * @param resourceType Description of resource (Container, NonRDF, Resource)
   * @return BaseURL to use for RDF Graphs
   * @throws ShapeTreeException ShapeTreeException
   */
  public static normalizeSolidResourceUrl(url: URL, requestedName: string | null, resourceType: ShapeTreeResourceType): URL /* throws ShapeTreeException */ {
    let urlString: string = url.toString();
    if (requestedName != null) {
      urlString += requestedName;
    }
    if (resourceType === ShapeTreeResourceType.CONTAINER && !urlString.endsWith("/")) {
      urlString += "/";
    }
    try {
      return new URL(urlString);
    } catch (ex) {
       throw new ShapeTreeException(500, "normalized to malformed URL <" + urlString + "> - " + (ex as Error).message); // TODO: why doesn't `(Error<ex>).message` compile?
    }
  }

  /**
   * Loads body of request into graph
   * @param shapeTreeRequest Request
   * @param baseUrl BaseURL to use for graph
   * @param targetResource
   * @return Graph representation of request body
   * @throws ShapeTreeException ShapeTreeException
   */
  public static async getIncomingBodyGraph(shapeTreeRequest: ShapeTreeRequest, baseUrl: URL, targetResource: InstanceResource | null): Promise<Store | null> /* throws ShapeTreeException */ {
    log.debug("Reading request body into graph with baseUrl {}", baseUrl);
    if ((shapeTreeRequest.getResourceType() === ShapeTreeResourceType.NON_RDF && shapeTreeRequest.getContentType()!.toLowerCase() !== "application/sparql-update") || shapeTreeRequest.getBody() === null || shapeTreeRequest.getBody().length === 0) { // TODO: contentType could be null
      return null;
    }
    let targetResourceGraph: Promise<Store> | null = null;
    if (shapeTreeRequest.getMethod() === RequestHelper.PATCH) {
      // In the event of a SPARQL PATCH, we get the SPARQL query and evaluate it, passing the
      // resultant graph back to the caller
      if (targetResource != null) {
        targetResourceGraph = targetResource.getGraph(baseUrl);
      }
      if (targetResourceGraph === null) {
        // if the target resource doesn't exist or has no content
        log.debug("Existing target resource graph to patch does not exist.  Creating an empty graph.");
        targetResourceGraph = Promise.resolve(new Store());
      }
      // Perform a SPARQL update locally to ensure that resulting graph validates against ShapeTree
      const {deletions, insertions} = new N3Sparql(shapeTreeRequest.getBody(), {baseIRI: baseUrl.toString()}).executeQuery(await targetResourceGraph);
      if (targetResourceGraph === null) {
        throw new ShapeTreeException(400, "No graph after update");
      }
    } else {
      targetResourceGraph = GraphHelper.readStringIntoModel(baseUrl, shapeTreeRequest.getBody(), shapeTreeRequest.getContentType());
    }
    return targetResourceGraph;
  }

  /**
   * Determines whether a content type is a supported RDF type
   * @param incomingRequestContentType Content type to test
   * @return Boolean indicating whether it is RDF or not
   */
  private static determineIsNonRdfSource(incomingRequestContentType: string): boolean {
    return (!RequestHelper.supportedRDFContentTypes.has(incomingRequestContentType.toLowerCase()) && !RequestHelper.supportedSPARQLContentTypes.has(incomingRequestContentType.toLowerCase()));
  }

  /**
   * Determines if a resource should be treated as a container based on its request Link headers
   * @param shapeTreeRequest Request
   * @return Is the resource a container?
   */
  private static getIsContainerFromRequest(shapeTreeRequest: ShapeTreeRequest): boolean {
    // First try to determine based on link headers
    if (shapeTreeRequest.getLinkHeaders() != null) {
      const typeLinks: Array<string> = shapeTreeRequest.getLinkHeaders().allValues(LinkRelations.TYPE);
      if (typeLinks.length !== 0) {
        return (typeLinks.indexOf(LdpVocabulary.CONTAINER) !== -1 || typeLinks.indexOf(LdpVocabulary.BASIC_CONTAINER) !== -1);
      }
    }
    // As a secondary attempt, use slash path semantics
    return shapeTreeRequest.getUrl().pathname.endsWith("/");
  }
}
