import { CloudProject } from './firebase';

const GALLERY_CACHE_NAME = 'veretka-gallery-cache-v1';
const PUBLIC_PROJECTS_KEY = 'https://veretka.local/api/gallery/public-projects';
const SINGLE_PROJECT_PREFIX = 'https://veretka.local/api/gallery/project/';
const FALLBACK_PUBLIC_STORAGE_KEY = 'veretka_sw_cached_public_gallery';

/**
 * Check if browser CacheStorage API is available and usable.
 */
export function isCacheStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'caches' in window && typeof window.caches.open === 'function';
  } catch {
    return false;
  }
}

/**
 * Save public projects list and total count to Service Worker CacheStorage.
 * Falls back to localStorage if CacheStorage is blocked or unavailable.
 */
export async function savePublicProjectsToCache(
  projects: CloudProject[],
  totalCount?: number
): Promise<void> {
  if (!projects || projects.length === 0) return;

  const cachedAt = Date.now();
  const effectiveTotal = typeof totalCount === 'number' && totalCount > 0 ? totalCount : projects.length;

  const payload = {
    projects,
    totalCount: effectiveTotal,
    cachedAt,
  };

  // 1. Try Service Worker CacheStorage API
  if (isCacheStorageAvailable()) {
    try {
      const cache = await window.caches.open(GALLERY_CACHE_NAME);
      const response = new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-cached-at': String(cachedAt),
          'x-total-count': String(effectiveTotal),
        },
      });
      await cache.put(new Request(PUBLIC_PROJECTS_KEY), response);
    } catch (err) {
      console.warn('Failed to store public projects into CacheStorage:', err);
    }
  }

  // 2. Also keep a fallback in localStorage (limited to first 40 projects to fit within quota)
  try {
    const compactProjects = projects.slice(0, 40);
    localStorage.setItem(
      FALLBACK_PUBLIC_STORAGE_KEY,
      JSON.stringify({
        projects: compactProjects,
        totalCount: effectiveTotal,
        cachedAt,
      })
    );
  } catch (err) {
    console.warn('Failed to store fallback public projects in localStorage:', err);
  }
}

/**
 * Retrieve cached public projects from Service Worker CacheStorage or fallback.
 */
export async function getPublicProjectsFromCache(): Promise<{
  projects: CloudProject[];
  totalCount: number;
  cachedAt: number;
} | null> {
  // 1. Try Service Worker CacheStorage API
  if (isCacheStorageAvailable()) {
    try {
      const cache = await window.caches.open(GALLERY_CACHE_NAME);
      const match = await cache.match(new Request(PUBLIC_PROJECTS_KEY));
      if (match) {
        const data = await match.json();
        if (data && Array.isArray(data.projects) && data.projects.length > 0) {
          return {
            projects: data.projects,
            totalCount: data.totalCount || data.projects.length,
            cachedAt: data.cachedAt || Date.now(),
          };
        }
      }
    } catch (err) {
      console.warn('Error reading from CacheStorage:', err);
    }
  }

  // 2. Try localStorage fallback
  try {
    const raw = localStorage.getItem(FALLBACK_PUBLIC_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.projects) && data.projects.length > 0) {
        return {
          projects: data.projects,
          totalCount: data.totalCount || data.projects.length,
          cachedAt: data.cachedAt || Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn('Error reading from fallback localStorage:', err);
  }

  return null;
}

/**
 * Cache an individual project by ID into Service Worker CacheStorage.
 */
export async function saveProjectToCache(project: CloudProject): Promise<void> {
  if (!project || !project.id) return;

  if (isCacheStorageAvailable()) {
    try {
      const cache = await window.caches.open(GALLERY_CACHE_NAME);
      const response = new Response(JSON.stringify(project), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-cached-at': String(Date.now()),
        },
      });
      await cache.put(new Request(`${SINGLE_PROJECT_PREFIX}${project.id}`), response);
    } catch (err) {
      console.warn(`Failed to cache project ${project.id}:`, err);
    }
  }
}

/**
 * Retrieve an individual cached project by ID from Service Worker CacheStorage.
 */
export async function getProjectFromCache(projectId: string): Promise<CloudProject | null> {
  if (!projectId) return null;

  if (isCacheStorageAvailable()) {
    try {
      const cache = await window.caches.open(GALLERY_CACHE_NAME);
      const match = await cache.match(new Request(`${SINGLE_PROJECT_PREFIX}${projectId}`));
      if (match) {
        const project = await match.json();
        if (project && project.id) {
          return project as CloudProject;
        }
      }
    } catch (err) {
      console.warn(`Failed to retrieve cached project ${projectId}:`, err);
    }
  }

  // Check if project is available in cached public projects
  try {
    const cachedPublic = await getPublicProjectsFromCache();
    if (cachedPublic && cachedPublic.projects) {
      const found = cachedPublic.projects.find((p) => p.id === projectId);
      if (found) return found;
    }
  } catch {}

  return null;
}

/**
 * Execute a promise with a timeout to prevent hanging on flaky or intermittent connections.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('NETWORK_TIMEOUT'));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
