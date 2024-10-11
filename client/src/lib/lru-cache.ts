// thanks to https://stackoverflow.com/a/46432113
class LRUCache<T> {
    private max: number;
    private cache: Map<string, T>;

    constructor({ max = 5 }: { max?: number }) {
        this.max = max;
        this.cache = new Map();
    }

    has(key: string) {
        return this.cache.has(key);
    }

    get(key: string) {
        let item = this.cache.get(key);
        if (item !== undefined) {
            // refresh key
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: string, val: T) {
        // refresh key
        if (this.cache.has(key)) this.cache.delete(key);
        // evict oldest
        else if (this.cache.size === this.max) this.cache.delete(this.first());
        this.cache.set(key, val);
    }

    first() {
        return this.cache.keys().next().value;
    }
 
    values() {
        return this.cache.values();
    }

    get size() {
        return this.cache.size;
    }
}

export default LRUCache;