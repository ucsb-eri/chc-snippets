/**
 * Manager for IndexedDB with Compression and Versioning
 */
class FileCacheManager {
    constructor(dbName = "FileCacheDB", storeName = "files", version = "1.0") {
        this.dbName = dbName;
        this.storeName = storeName;
        this.cacheVersion = version; // The version passed to the manager
        this.db = null;
    }

    async init() {
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "url" });
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                await this.checkVersionAndWipe(); // Handle versioning immediately after opening
                resolve();
            };

            request.onerror = (event) => reject("IndexedDB error: " + event.target.errorCode);
        });
    }

    /**
     * Checks if the stored cache version matches the current requested version.
     * If they differ, it wipes all data in the store.
     */
    async checkVersionAndWipe() {
        const metaKey = "__cache_metadata__";
        const cachedMeta = await this.getRaw(metaKey);

        if (!cachedMeta || cachedMeta.version !== this.cacheVersion) {
            console.warn(`⚠️ Cache version mismatch (Stored: ${cachedMeta?.version}, Requested: ${this.cacheVersion}). Wiping cache...`);
            await this.clearAll();
            // Save the new version immediately
            await this.setRaw({ url: metaKey, version: this.cacheVersion });
        }
    }

    async clearAll() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
        });
    }

    // Helper to get raw data without decompression (used for metadata)
    async getRaw(url) {
        await this.init();
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(url);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    async get(url) {
        const data = await this.getRaw(url);
        if (!data || !data.compressedContent) return null;

        try {
            // DECOMPRESSION: pako.inflate takes the Uint8Array and returns a decompressed Uint8Array
            const decompressed = pako.inflate(data.compressedContent);
            // Convert Uint8Array back to string
            data.content = new TextDecoder().decode(decompressed);
            return data;
        } catch (e) {
            console.error("Decompression failed for", url, e);
            return null;
        }
    }

    async set(fileData) {
        await this.init();
        
        // COMPRESSION: Convert string to Uint8Array then compress
        const textEncoder = new TextEncoder();
        const uint8Text = textEncoder.encode(fileData.content);
        const compressed = pako.deflate(uint8Text);

        const storageObject = {
            url: fileData.url,
            name: fileData.name,
            size: fileData.size,
            date: fileData.date,
            compressedContent: compressed // Store as Uint8Array (Binary)
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(storageObject);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject("Error saving to cache: " + event.target.errorCode);
        });
    }

    /**
     * Deletes any files in the database that are not present in the current fileList
     */
    async cleanupOrphans(currentFileList) {
        await this.init();
        const currentUrls = new Set(currentFileList.map(f => f.url));
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();

            request.onsuccess = () => {
                const allKeys = request.result;
                allKeys.forEach(key => {
                    // Don't delete the metadata key, and only delete if not in current list
                    if (key !== "__cache_metadata__" && !currentUrls.has(key)) {
                        console.log(`🗑️ Removing obsolete file from cache: ${key}`);
                        store.delete(key);
                    }
                });
                resolve();
            };
        });
    }

    async setRaw(data) {
        await this.init();
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            store.put(data);
            transaction.oncomplete = () => resolve();
        });
    }
}

/**
 * Main function to request files and manage caching logic
 */
async function getFilesWithCache(fileList, cacheVersion = "1.0") {
    const cache = new FileCacheManager("FileCacheDB", "files", cacheVersion);
    const results = [];

    for (const file of fileList) {
        const cachedEntry = await cache.get(file.url);

        const isCachedAndValid = cachedEntry && 
                                 cachedEntry.size === file.size && 
                                 cachedEntry.date === file.date;

        if (isCachedAndValid) {
            console.log(`📦 Loading ${file.name} from cache...`);
            results.push({ ...file, content: cachedEntry.content, source: 'cache' });
        } else {
            try {
                console.log(`🌐 Fetching ${file.name} from server...`);
                const response = await fetch(file.url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const content = await response.text();

                await cache.set({ ...file, content });
                results.push({ ...file, content: content, source: 'network' });
            } catch (error) {
                console.error(`❌ Failed to fetch ${file.name}:`, error);
                results.push({ ...file, content: null, error: error.message });
            }
        }
    }

    // After processing all files, remove items from cache that are no longer in the list
    await cache.cleanupOrphans(fileList);

    return results;
}
