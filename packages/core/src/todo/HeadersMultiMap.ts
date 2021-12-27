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

export class HeadersMultiMap extends CaseInsensitiveMap<string, Array<string>> {
    public static CommaSeparatedHeaders = ['link'];
    public replace (key: string, value: string) {
        if (HeadersMultiMap.CommaSeparatedHeaders.indexOf(key) !== -1) {
            this.set(key, value.split(/, */));
        } else {
            this.set(key, [value]);
        }
    }
}