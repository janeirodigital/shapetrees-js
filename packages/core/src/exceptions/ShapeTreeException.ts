// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.exceptions
export class ShapeTreeException /* extends Error */ { // TODO: make STE extend Error once https://github.com/facebook/jest/issues/11693#issuecomment-1001043495 is resolved

  public constructor(
      private statusCode: number,
      public message: string) {
    /* super(message) */;
  }

  public getStatusCode(): number {
    return this.statusCode;
  }

  public getMessage(): string {
    return this.message;
  }
}
