import LZString from 'lz-string';

export const GITHUB_PAGES_BASE_URL = 'https://Vitaliy-Kushnir.github.io/VereTka/';

export function getPreviewBaseUrl(): string {
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        const cleanPath = pathname.endsWith('/') ? pathname : pathname + '/';
        return `${origin}${cleanPath}`;
    }
    return GITHUB_PAGES_BASE_URL;
}

export function getShareBaseUrl(): string {
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (origin.includes('github.io')) {
            const pathname = window.location.pathname;
            const cleanPath = pathname.endsWith('/') ? pathname : pathname + '/';
            return `${origin}${cleanPath}`;
        }
    }
    return GITHUB_PAGES_BASE_URL;
}

export function compressProjectToUrl(projectData: object, customBaseUrl?: string): string {
    let dataToCompress = projectData;
    if (projectData && typeof projectData === 'object' && 'thumbnail' in projectData) {
        const { thumbnail, ...rest } = projectData as Record<string, any>;
        dataToCompress = rest;
    }
    const jsonString = JSON.stringify(dataToCompress);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    const baseUrl = customBaseUrl || getShareBaseUrl();
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    return `${cleanBaseUrl}#project=${compressed}`;
}

export function decompressProjectFromUrl(urlOrHash: string): { data: any; rawJson: string } | null {
    try {
        if (!urlOrHash) return null;

        let rawStr = urlOrHash;
        if (rawStr.includes('%23project=')) {
            try {
                rawStr = decodeURIComponent(rawStr);
            } catch {}
        }

        let compressed = '';
        const match = rawStr.match(/[#?&]project=([^&]+)/) || rawStr.match(/project=([^&]+)/) || rawStr.match(/[#?&]p=([^&]+)/) || rawStr.match(/p=([^&]+)/);
        if (match && match[1]) {
            compressed = match[1];
        } else {
            compressed = rawStr.replace(/^#/, '').replace(/^\?/, '');
        }

        if (!compressed) return null;

        // Try direct LZString encoded URI decompression
        let decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        
        // If failed and compressed string contains URI escapes (%XX), try decoding it first
        if (!decompressed && compressed.includes('%')) {
            try {
                const unescaped = decodeURIComponent(compressed);
                decompressed = LZString.decompressFromEncodedURIComponent(unescaped);
            } catch {}
        }
        
        // Try unescaping decodeURIComponent if direct failed
        if (!decompressed) {
            try {
                decompressed = LZString.decompressFromEncodedURIComponent(decodeURIComponent(compressed));
            } catch {}
        }

        // Fallbacks for standard compression formats
        if (!decompressed) {
            decompressed = LZString.decompress(compressed);
        }
        if (!decompressed) {
            decompressed = LZString.decompressFromBase64(compressed);
        }
        if (!decompressed) {
            try {
                decompressed = decodeURIComponent(atob(compressed));
            } catch {
                try {
                    decompressed = atob(compressed);
                } catch {
                    decompressed = null;
                }
            }
        }

        if (decompressed) {
            const data = JSON.parse(decompressed);
            if (data && typeof data === 'object' && (data.shapes || data.canvasSettings)) {
                return { data, rawJson: decompressed };
            }
        }
    } catch (e) {
        console.error("Failed to decompress project from URL:", e);
    }
    return null;
}
