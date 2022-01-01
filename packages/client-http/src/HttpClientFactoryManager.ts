// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.client.http
import { ShapeTreeException } from '@shapetrees/core/src/exceptions/ShapeTreeException';
import { HttpClientFactory } from './HttpClientFactory';

export abstract class HttpClientFactoryManager {

  // @Setter(onMethod_ = { @Synchronized })
   private static factory: HttpClientFactory;

  private constructor() {
    throw new Error("Utility class");
  }

  // @Synchronized
  public static getFactory(): HttpClientFactory /* throws ShapeTreeException */ {
    if (HttpClientFactoryManager.factory === null) {
      throw new ShapeTreeException(500, "Must provide a valid HTTP client factory");
    }
    return HttpClientFactoryManager.factory;
  }

  public static setFactory(factory: HttpClientFactory): void /* throws ShapeTreeException */ {
    if (factory === null) {
      throw new ShapeTreeException(500, "Must provide a valid HTTP client factory");
    }
    HttpClientFactoryManager.factory = factory;
  }
}
