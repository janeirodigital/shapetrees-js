// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
export class ShapeTreeContext {

   private authorizationHeaderValue: string | null;

  public constructor(authorizationHeaderValue: string | null) {
    this.authorizationHeaderValue = authorizationHeaderValue;
  }

  public getAuthorizationHeaderValue(): string | null {
    return this.authorizationHeaderValue;
  }
}
