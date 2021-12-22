// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core.exceptions
export class ShapeTreeException extends Error {

   private readonly statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }

  public getStatusCode(): number {
    return this.statusCode;
  }

  public getMessage(): string {
    return this.message;
  }
}
