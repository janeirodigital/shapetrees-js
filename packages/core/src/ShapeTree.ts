// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeContainsPriority } from './comparators/ShapeTreeContainsPriority';
import { DocumentLoaderManager } from './contentloaders/DocumentLoaderManager';
import { HttpHeaders } from './enums/HttpHeaders';
import { ShapeTreeGeneratorControl, ShapeTreeGeneratorReference, ShapeTreeGeneratorResult } from './todo/ShapeTreeGenerator';
// import { RecursionMethods } from './enums/RecursionMethods';
import { ShapeTreeResourceType } from './enums/ShapeTreeResourceType';
import { ShapeTreeException } from './exceptions/ShapeTreeException';
import { GraphHelper } from './helpers/GraphHelper';
import * as ShExUtil from '@shexjs/util';
import * as ShExParser from '@shexjs/parser';
import * as ShExValidator from '@shexjs/validator';
import * as ShExJ from 'shexj';
type ShexSchema = ShExJ.Schema;
import * as log from 'loglevel';

import { ShapeTreeReference } from './ShapeTreeReference';
import { DocumentResponse } from './DocumentResponse';
import { ManageableResource } from './ManageableResource';
import { ValidationResult } from './ValidationResult';
import {Store} from "n3";
import {SchemaCache} from "./SchemaCache";
import {rdfjsDB} from "@shexjs/util";
import {ShapeTreeFactory} from "./ShapeTreeFactory";

export class ShapeTree {

  // @NotNull
   private readonly id: URL;

  // @NotNull
   private readonly expectedResourceType: URL;

   private readonly shape: URL | null;

   private readonly label: string | null;

  // @NotNull
   private readonly contains: Array<URL>;

  // @NotNull
   private readonly references: Array<ShapeTreeReference>;

  public constructor(/* @NotNull */ id: URL, /* @NotNull */ expectedResourceType: URL, label: string | null, shape: URL | null, /* @NotNull */ references: Array<ShapeTreeReference>, /* @NotNull */ contains: Array<URL>) {
    this.id = id;
    this.expectedResourceType = expectedResourceType;
    this.label = label;
    this.shape = shape;
    this.references = references;
    this.contains = contains;
  }

  public validateResource(targetResource: ManageableResource): Promise<ValidationResult> /* throws ShapeTreeException */;

  public validateResource(targetResource: ManageableResource, focusNodeUrls: Array<URL>): Promise<ValidationResult> /* throws ShapeTreeException */;

  public validateResource(requestedName: string | null, focusNodeUrls: Array<URL>| null, resourceType: ShapeTreeResourceType, bodyGraph: Store | null): Promise<ValidationResult> /* throws ShapeTreeException */;

  public async validateResource(requestedName: ManageableResource | string | null, focusNodeUrls?: Array<URL> | null, resourceType?: Array<URL> | ShapeTreeResourceType | null, bodyGraph?: Store | null): Promise<ValidationResult> /* throws ShapeTreeException */ {

      if (requestedName instanceof ManageableResource) {
          const targetResource = requestedName as ManageableResource;

          let bodyGraph: Store | null = null;
          if (targetResource.getResourceType() != ShapeTreeResourceType.NON_RDF) {
              bodyGraph = await GraphHelper.readStringIntoModel(targetResource.getUrl(), targetResource.getBody(), targetResource.getAttributes().firstValue(HttpHeaders.CONTENT_TYPE) || null);
          }
          requestedName = targetResource.getName();
          resourceType = targetResource.getResourceType();
      }

    // Check whether the proposed resource is the same type as what is expected by the shape tree
    if (this.expectedResourceType.href !== resourceType!.toString()) {
      return new ValidationResult(false, this, "Resource type " + resourceType + " is invalid. Expected " + this.expectedResourceType);
    }
    // If a label is specified, check if the proposed name is the same
    if (this.label != null && this.label !== requestedName) {
      return new ValidationResult(false, this, "Proposed resource name " + requestedName + " is invalid. Expected " + this.label);
    }
    // If the shape tree specifies a shape to validate, perform shape validation
    if (this.shape != null) {
      if (focusNodeUrls === undefined || focusNodeUrls === null) {
        focusNodeUrls = [];
      }
      return this.validateGraph(bodyGraph!, focusNodeUrls); // TODO: can bodyGraph be undefined here if arrived here by different prototype?
    }
    // Allow if we fall through to here. Focus node is set to null because we only get here if no shape validation was performed
    return new ValidationResult(true, this, this, null);
  }

  public async validateGraph(graph: Store, focusNodeUrls: Array<URL>): Promise<ValidationResult> /* throws ShapeTreeException */ {
    // if (true) return new ValidationResult(true, this, this, focusNodeUrl); // [debug] ShExC parser brings debugger to its knees
    if (this.shape === null) {
      throw new ShapeTreeException(400, "Attempting to validate a shape for ShapeTree " + this.id + "but it doesn't specify one");
    }
    let schema: ShexSchema;
    if (SchemaCache.isInitialized() && SchemaCache.containsSchema(this.shape)) {
      log.debug("Found cached schema {}", this.shape);
      schema = SchemaCache.getSchema(this.shape);
    } else {
      log.debug("Did not find schema in cache {} will retrieve and parse", this.shape);
      let shexShapeContents: DocumentResponse = await DocumentLoaderManager.getLoader().loadExternalDocument(this.shape);
      if (shexShapeContents === null || shexShapeContents.getBody() === null || shexShapeContents.getBody()!.length === 0) {
        throw new ShapeTreeException(400, "Attempting to validate a ShapeTree (" + this.id + ") - Shape at (" + this.shape + ") is not found or is empty");
      }
      let shapeBody: string = shexShapeContents.getBody()!;
      const shexCParser = ShExParser.construct(this.shape.href, {});
      try {
        schema = shexCParser.parse(shapeBody);
        if (SchemaCache.isInitialized()) {
          SchemaCache.putSchema(this.shape, schema);
        }
      } catch (ex: any) {
         throw new ShapeTreeException(500, "Error parsing ShEx schema - " + ex.message);
       }
    }
    // Tell ShExJava we want to use Jena as our graph library
    let validationDb = ShExUtil.rdfjsDB(graph);
    const validator = ShExValidator.construct(schema, validationDb, {});
    let shapeLabel = this.shape.href;
    if (focusNodeUrls.length > 0) {
      // One or more focus nodes were provided for validator
      for (const focusNodeUrl of focusNodeUrls) {
        // Evaluate each provided focus node
        const focusNode = focusNodeUrl.href;
        log.debug("Validating Shape Label = %s, Focus Node = %s", shapeLabel, focusNode);
        const res = validator.validate([{node: focusNode, shape: shapeLabel}]);
        let valid: boolean = !('errors' in res);
        if (valid) {
          return new ValidationResult(valid, this, this, focusNodeUrl);
        }
      }
      // None of the provided focus nodes were valid - this will return the last failure
      return new ValidationResult(false, this, "Failed to validate: " + shapeLabel);
    } else {
      // No focus nodes were provided for validator, so all subject nodes will be evaluated
      let evaluateNodes: Array<Node> = validationDb.getSubjects(); // graph, Node.ANY, Node.ANY).toList();
      for (const focusNodeUrl of evaluateNodes) {
        const focusUriString: string = focusNodeUrl.toString(); // TODO: handle different node types, ald look at objects if static analysis shows focus is value of any inverse property
        const res = validator.validate(focusUriString, shapeLabel);
        let valid: boolean = !('errors' in res);
        if (valid) {
          try {
            return new ValidationResult(valid, this, this, new URL(focusUriString));
          } catch (ex: any) {
             throw new ShapeTreeException(500, "Error reporting validator success on malformed URL <" + focusUriString + ">: " + ex.message);
           }
        }
      };
      return new ValidationResult(false, this, "Failed to validate: " + shapeLabel);
    }
  }

  public async validateContainedResource(containedResource: ManageableResource): Promise<ValidationResult> /* throws ShapeTreeException */;
  public async validateContainedResource(requestedName: string | ManageableResource, resourceType: ShapeTreeResourceType, targetShapeTreeUrls: Array<URL>, bodyGraph: Store, focusNodeUrls: Array<URL>): Promise<ValidationResult> /* throws ShapeTreeException */;

  public async validateContainedResource(requestedName: string | ManageableResource, resourceType?: ShapeTreeResourceType, targetShapeTreeUrls?: Array<URL>, bodyGraph?: Store, focusNodeUrls?: Array<URL>): Promise<ValidationResult> /* throws ShapeTreeException */ {
    if (requestedName instanceof ManageableResource) {
      const containedResource = requestedName as ManageableResource;
      // TODO: this same test gets performed in the call to the 2nd valdateContainedResource (after potentially parsing the graph)
      if (this.contains === null || this.contains.length === 0) {
        // TODO: say it can't be null?
        // The contained resource is permitted because this shape tree has no restrictions on what it contains
        return Promise.resolve(new ValidationResult(true, this, this, null));
      }

      resourceType = containedResource.getResourceType();
      if (resourceType != ShapeTreeResourceType.NON_RDF) {
        bodyGraph = await GraphHelper.readStringIntoModel(containedResource.getUrl(),
            containedResource.getBody(),
            containedResource.getAttributes().firstValue(HttpHeaders.CONTENT_TYPE) || null);
      }
      // TODO: what happens if we validateResource with bodyGraph undefined?

      targetShapeTreeUrls = [];
      focusNodeUrls = [];
      requestedName = containedResource.getName();
    }

    if (this.contains === null || this.contains.length === 0) {
      // The contained resource is permitted because this shape tree has no restrictions on what it contains
      return Promise.resolve(new ValidationResult(true, this, this, null));
    }
    // If one or more target shape trees have been supplied
    if (targetShapeTreeUrls!.length !== 0) {
      // Test each supplied target shape tree
      for (const targetShapeTreeUrl of targetShapeTreeUrls!) {
        // Check if it exists in st:contains
        if (this.contains.indexOf(targetShapeTreeUrl) !== -1) {
          let targetShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(targetShapeTreeUrl);
          // Evaluate the shape tree against the attributes of the proposed resources
          let result: ValidationResult = await targetShapeTree.validateResource(requestedName, focusNodeUrls!, resourceType!, bodyGraph!);
          if (result.getValid()) {
            // Return a successful validation result, including the matching shape tree
            return new ValidationResult(true, this, targetShapeTree, result.getMatchingFocusNode());
          }
        }
      }
      // None of the provided target shape trees matched
      return new ValidationResult(false, null, "Failed to validate " + targetShapeTreeUrls);
    } else {
      // For each shape tree in st:contains
      for (const containsShapeTreeUrl of await this.getPrioritizedContains()) {
        let containsShapeTree: ShapeTree = await ShapeTreeFactory.getShapeTree(containsShapeTreeUrl);
        // Continue if the shape tree isn't gettable
        if (containsShapeTree === null) {
          continue;
        }
        // Evaluate the shape tree against the attributes of the proposed resources
        let result: ValidationResult = await containsShapeTree.validateResource(requestedName, focusNodeUrls!, resourceType!, bodyGraph!);
        // Continue if the proposed attributes were not a match
        if (!result.getValid()) {
          continue;
        }
        // Return the successful validation result
        return new ValidationResult(true, this, containsShapeTree, result.getMatchingFocusNode());
      }
    }
    return new ValidationResult(false, null, "Failed to validate shape tree: " + this.id);
  }

  // Return the list of shape tree contains by priority from most to least strict
  public async getPrioritizedContains(): Promise<Array<URL>> {
    const prioritized: Array<URL> = [...this.contains];
    const loaded: Array<ShapeTree> = await Promise.all(prioritized.map(
        async url => await ShapeTreeFactory.getShapeTree(url)
    ));
    return loaded.sort(ShapeTreeContainsPriority).map(
        st => st.id
    );
  }

/*
*/
  /**
   * recursively get the list of referenced ShapeTree steps
   * @TODO:
   *   use generator?
   *   make efficient (capture and proxy nested iterators in .next())
   *   add referrers stack a la: { referrers: [<#org>, <#repo>, <#issue>, <#comment>] }
   * @returns {Iterable}
   replaces:
   public getReferencedShapeTrees(): Iterator<ShapeTreeReference>;
   public getReferencedShapeTrees(recursionMethods: RecursionMethods): Iterator<ShapeTreeReference>;
   public getReferencedShapeTrees(recursionMethods?: RecursionMethods): Iterator<ShapeTreeReference>;
   private getReferencedShapeTreesList(recursionMethods: RecursionMethods): Array<ShapeTreeReference>;
   private getReferencedShapeTreesListBreadthFirst(): Array<ShapeTreeReference>;
   private getReferencedShapeTreesListDepthFirst(currentReferencedShapeTrees: Array<ShapeTreeReference>, referencedShapeTrees: Array<ShapeTreeReference>): Array<ShapeTreeReference>;
   */
  async* getReferencedShapeTrees(control = ShapeTreeGeneratorControl.DEFAULT, via: ShapeTreeGeneratorReference[] = []): AsyncGenerator<ShapeTreeGeneratorResult, void, ShapeTreeGeneratorControl | undefined> {
    // eslint-disable-next-line no-underscore-dangle
    const _RemoteShapeTree = this;
    yield* walkLocalTree(this.id, control, via);

    // Iterate over this ShapeTree.
    async function* walkLocalTree(from: URL, control: ShapeTreeGeneratorControl, via: ShapeTreeGeneratorReference[] = []): AsyncGenerator<ShapeTreeGeneratorResult, void, ShapeTreeGeneratorControl | undefined> {
      const stepOrNull: ShapeTree | null = await ShapeTreeFactory.getShapeTree(from)!!;
      if (stepOrNull === null)
        throw new ShapeTreeException(422, `ShapeTree ${from} not found`); // @@ not found in [...] would be more helpful but reveals cache
      const step: ShapeTree = stepOrNull; // @@ better dance?

      // Queue contents and references.
      // eslint-disable-next-line guard-for-in
      for (const i in step.contains) {
        const r = step.contains[i];

        // Steps have URLs so reference by id.
        const result = { type: 'contains', target: r };
        if (control & ShapeTreeGeneratorControl.REPORT_CONTAINS) // Only report references (for now).
            // eslint-disable-next-line no-param-reassign
          control = defaultControl(yield { result, via }, control);

        if (control & ShapeTreeGeneratorControl.RECURSE_CONTAINS)
          yield* visit(r, result);
      }

      // eslint-disable-next-line guard-for-in
      for (const i in step.references) {
        const r = step.references[i];

        // References don't have URLs so so include verbatim.
        const result = { type: 'reference', target: r.getReferenceUrl() };
        if (control & ShapeTreeGeneratorControl.REPORT_REERENCES)
            // eslint-disable-next-line no-param-reassign
          control = defaultControl(yield { result, via }, control);

        if (control & ShapeTreeGeneratorControl.RECURSE_REERENCES)
          yield* visit(r.getReferenceUrl(), result);
      }

      async function* visit(stepName: URL, result: ShapeTreeGeneratorReference): AsyncGenerator<ShapeTreeGeneratorResult, void, ShapeTreeGeneratorControl | undefined> {
        let remote: ShapeTree | null = null;
        // Avoid cycles by looking in via for stepName.
        if (!(via.find((v) => v.target.href === stepName.href))) {
          if (noHash(stepName).href === noHash(_RemoteShapeTree.id).href)
              // (optimization) In-tree links can recursively call this generator.
            yield* walkLocalTree(stepName, control, via.concat(result));
          else {
            // (general case) Parse a new RemoteShapeTree.
            remote = await ShapeTreeFactory.getShapeTree(stepName);
            if (remote !== null)
              yield* remote.getReferencedShapeTrees(control, via.concat(result));
          }
        }
      }
    }

    function noHash(url: URL) {
      const u = url.href;
      return new URL(u.substr(0, u.length - url.hash.length));
    }

    function defaultControl (newValue: ShapeTreeGeneratorControl | undefined, oldValue: ShapeTreeGeneratorControl): ShapeTreeGeneratorControl {
      return newValue === undefined
          ? oldValue
          : newValue;
    }
  }

  public getId(): URL {
    return this.id;
  }

  public getExpectedResourceType(): URL {
    return this.expectedResourceType;
  }

  public getShape(): URL | null {
    return this.shape;
  }

  public getLabel(): string | null {
    return this.label;
  }

  public getContains(): Array<URL> {
    return this.contains;
  }

  public getReferences(): Array<ShapeTreeReference> {
    return this.references;
  }
}
