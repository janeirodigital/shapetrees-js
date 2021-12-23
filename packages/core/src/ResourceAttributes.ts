// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.core
import { ShapeTreeException } from './exceptions/ShapeTreeException';
// import {Headers} from 'node-fetch';
import * as log from 'loglevel';

/**
 * The HttpClientHeaders object is a multi-map with some constructors and put-ers tailored to the
 * shapetrees-java libraries. The only behavior that's at all HTTP-specific is the
 * parseLinkHeaders factory which includes logic for HTTP Link headers.
 */
export class ResourceAttributes {

   myMapOfLists: Map<string, Array<string>>;

  /**
   * construct a case-insensitive ResourceAttributes container
   */
  public constructor();

  /**
   * construct a case-insensitive ResourceAttributes container and set attr to value if both are not null.
   * @param attr attribute (header) name to set
   * @param value String value to assign to attr
   */
  public constructor(attr: string, value: string) /* throws ShapeTreeException */;

  /**
   * Construct ResourceAttributes with passed map, which may be case-sensitive.
   * @param newMap replacement for myMapOfLists
   */
  public constructor(newMap: Map<string, Array<string>>);

  public constructor(attrOrHeaders?: string | Map<string, Array<string>>, value?: string | unknown) {
    if (attrOrHeaders instanceof Map) {
      this.myMapOfLists = attrOrHeaders;
    } else {
      this.myMapOfLists = new Map<string, Array<string>>(); // new CaseInsensitiveMap<string, Array<string>>();
      if (typeof attrOrHeaders === 'string' && typeof value === 'string') {
        this.maybeSet(attrOrHeaders, value);
      }
    }
  }

  // copy constructor
  private copy(): ResourceAttributes {
    let ret: ResourceAttributes = new ResourceAttributes();
    for (let [key, values] of this.myMapOfLists) {
      ret.myMapOfLists.set(key, [...values]);
    }
    return ret;
  }

  /**
   * Re-use HttpClientHeaders to capture link headers as a mapping from link relation to list of values
   * This is really a constructor but a named static function clarifies its intention.
   * @param headerValues Header values for Link headers
   * @return subset of this matching the pattern
   */
  public static parseLinkHeaders(headerValues: Array<string>): ResourceAttributes {
    let linkHeaderMap: ResourceAttributes = new ResourceAttributes();
    for (const headerValue of headerValues) {
      let matcher: RegExpExecArray | null = ResourceAttributes.LINK_HEADER_PATTERN.exec(headerValue);
      // if (matcher.matches() && matcher.groupCount() >= 2) {
      if (matcher !== null) {
        let uri: string = matcher[1];
        let rel: string = matcher[2];
        if (!linkHeaderMap.myMapOfLists.has(rel)) {
          linkHeaderMap.myMapOfLists.set(rel, []);
        }
        linkHeaderMap.myMapOfLists.get(rel)!.push(uri);
      } else {
        log.warn("Unable to parse link header: [%s]", headerValue);
      }
    }
    return linkHeaderMap;
  }

  /**
   * make a new HttpClientHeaders with the additional attr/value set.
   * @param attr attribute (header) name to set
   * @param value String value to assign to attr
   * @return original HttpClientHeaders if no change is made; otherwise a new copy.
   */
  public maybePlus(attr: string, value: string): ResourceAttributes {
    if (attr === null || value === null) {
      return this;
    }
    let ret: ResourceAttributes = this.copy();
    ret.maybeSet(attr, value);
    return ret;
  }

  /**
   * set attr to value if both are not null.
   * @param attr attribute (header) name to set
   * @param value String value to assign to attr
   */
  /*@SneakyThrows*/
  public maybeSet(attr: string, value: string): void {
    if (attr === null || value === null) {
      return;
    }
    if (this.myMapOfLists.has(attr)) {
      let existingValues: Array<string> = this.myMapOfLists.get(attr)!;
      let alreadySet: boolean = existingValues.find(s => s === value) ? true : false;
      if (!alreadySet) {
        existingValues.push(value);
      }
      /* else {
                throw new Exception(attr + ": " + value + " already set.");
            }*/
    } else {
      let list: Array<string> = new Array<string>();
      list.push(value);
      this.myMapOfLists.set(attr, list);
    }
  }

  /**
   * replaces the list of attrs (without regard to nulls)
   * @param attr attribute (header) name to set
   * @param values String values to assign to attr
   */
  public setAll(attr: string, values: Array<string>): void {
    this.myMapOfLists.set(attr, values);
  }

  /**
   * Returns a map of attributes to lists of values
   */
  public toMultimap(): Map<string, Array<string>> {
    return this.myMapOfLists;
  }

  /**
   * Returns an array with alternating attributes and values.
   * @param exclusions set of headers to exclude from returned array.
   *                   (This is useful for HttpRequest.Builder().)
   */
  public toList(...exclusions: string[]): string[] {
    let ret = new Array<string>();
    this.myMapOfLists.forEach((values, attr) => {
      if (!exclusions.find(s => s === attr)) {
        for (const value of values) {
          ret.push(attr);
          ret.push(value);
        }
      }
    });
    return ret;
  }

  /**
   * Returns an {@link Optional} containing the first header string value of
   * the given named (and possibly multi-valued) header. If the header is not
   * present, then the returned {@code Optional} is empty.
   *
   * @param name the header name
   * @return an {@code Optional<String>} containing the first named header
   *         string value, if present
   */
  public firstValue(name: string): string | null {
    const values = this.allValues(name);
    return values.length > 0
        ? values[0]
        : null;
  }

  /**
   * Returns an unmodifiable List of all of the header string values of the
   * given named header. Always returns a List, which may be empty if the
   * header is not present.
   *
   * @param name the header name
   * @return a List of headers string values
   */
  public allValues(name: string): Array<string> {
    let values: Array<string> | undefined = this.toMultimap().get(name);
    // Making unmodifiable list out of empty in order to make a list which
    // throws UOE unconditionally
    return values !== undefined ? values : []; // TODO: some callers, e.g. HttpResourceAccessor.getResourceTypeFromHeaders, expect null
  }

  public toString(): string {
    let sb: String = '';
    for (let [key, values] of this.myMapOfLists) {
//    for (const entry of this.myMapOfLists.entrySet()) {
      for (const value of values) {
        if (sb.length !== 0) {
          sb += ",";
        }
        sb += key + '=' + value;
      }
    }
    return sb.toString();
  }

  private static readonly LINK_HEADER_PATTERN: RegExp = new RegExp('^<(.*?)>\\s*;\\s*rel\\s*="(.*?)"\\s*');
}

// TODO: replace node-fetch.Headers with this?
class CaseInsensitiveMap<T, U> extends Map<T, U> {
  set(key: T, value: U): this {
    if (typeof key === 'string') {
      key = key.toLowerCase() as any as T;
    }
    return super.set(key, value);
  }

  get(key: T): U | undefined {
    if (typeof key === 'string') {
      key = key.toLowerCase() as any as T;
    }

    return super.get(key);
  }

  has(key: T): boolean {
    if (typeof key === 'string') {
      key = key.toLowerCase() as any as T;
    }

    return super.has(key);
  }
}