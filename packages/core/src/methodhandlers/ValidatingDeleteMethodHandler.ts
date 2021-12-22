// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.methodhandlers
import { DocumentResponse } from '../DocumentResponse';
import { ResourceAccessor } from '../ResourceAccessor';
import { ManageableInstance } from '../ManageableInstance';
import { ShapeTreeRequest } from '../ShapeTreeRequest';
import { ShapeTreeException } from '../exceptions/ShapeTreeException';
import { RequestHelper } from '../helpers/RequestHelper';
import { ShapeTreeContext } from '../ShapeTreeContext';
import { AbstractValidatingMethodHandler } from './AbstractValidatingMethodHandler';
import { ValidatingMethodHandler } from './ValidatingMethodHandler';

export class ValidatingDeleteMethodHandler extends AbstractValidatingMethodHandler implements ValidatingMethodHandler {

  public constructor(resourceAccessor: ResourceAccessor) {
    super(resourceAccessor);
  }

  public async validateRequest(shapeTreeRequest: ShapeTreeRequest): Promise<DocumentResponse | null> /* throws ShapeTreeException */ {
    let shapeTreeContext: ShapeTreeContext = RequestHelper.buildContextFromRequest(shapeTreeRequest);
    let targetInstance: ManageableInstance = this.resourceAccessor.getInstance(shapeTreeContext, shapeTreeRequest.getUrl());
    if (targetInstance.wasRequestForManager() && targetInstance.getManagerResource().isExists()) {
      // If the DELETE request is for an existing shapetree manager resource,
      // it must be evaluated to determine if unplanting is necessary
      return await this.requestHandler.manageShapeTree(targetInstance, shapeTreeRequest);
    }
    // Reaching this point means validation was not necessary
    // Pass the request along with no validation
    return null;
  }
}
