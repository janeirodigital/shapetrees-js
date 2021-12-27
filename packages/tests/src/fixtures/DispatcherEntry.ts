// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests.fixtures
import {Fixture} from "./Fixture";

export class DispatcherEntry {

   fixtureNames: Array<string>;
   expectedMethod: string;
   expectedPath: string;
   private expectedHeaders: Map<string, Array<string>> | null;
   public fixtures: Fixture[] = [];
   public hit: number = 0;

  public toString(): string {
    return "DispatcherEntry{" + this.fixtureNames + ":" + this.expectedMethod + '\'' + " " + this.expectedPath + '\'' + " " + this.expectedHeaders + "}";
  }

  public constructor(fixtureNames: Array<string>, expectedMethod: string, expectedPath: string, expectedHeaders: Map<string, Array<string>> | null) {
    this.fixtureNames = fixtureNames;
    this.expectedMethod = expectedMethod;
    this.expectedPath = expectedPath;
    this.expectedHeaders = expectedHeaders;
  }

  public getFixtureNames(): Array<string> {
    return this.fixtureNames;
  }

  public getExpectedMethod(): string {
    return this.expectedMethod;
  }

  public getExpectedPath(): string {
    return this.expectedPath;
  }

  public getExpectedHeaders(): Map<string, Array<string>> | null {
    return this.expectedHeaders;
  }
}
