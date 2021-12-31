// TODO: replace node-fetch.Headers with this?
export class CaseInsensitiveMap<T, U> extends Map<T, U> {
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

/**
 * A case-insensitive multi-map useful for HTTP headers.
 */
export class HeadersMultiMap extends CaseInsensitiveMap<string, Array<string>> {
  public static CommaSeparatedHeaders = ['link'];

  /**
   * assign a header value, or multiple header values if it's a known comma-separated header like
   *   Link: <asdf>; rel=foo, <qwer>; rel=bar
   * This can also be used over multipl calls like
   *   h.setCommaSeparated("link", "<asdf>; rel=foo"); h.setCommaSeparated("link", "<qwer>; rel=bar");
   * @param key
   * @param value
   */
  public setCommaSeparated (key: string, value: string) {
    if (HeadersMultiMap.CommaSeparatedHeaders.indexOf(key.toLowerCase()) !== -1) {
      const values: string[] = value.split(/,/);
      this.set(key, (this.get(key) || []).concat(values));
    } else {
      this.set(key, (this.get(key) || []).concat([value]));
    }
  }
}
