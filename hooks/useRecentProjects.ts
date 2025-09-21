import { useState, useEffect, useCallback } from 'react';

export interface RecentProject {
    name: string;
    handle: FileSystemFileHandle;
    lastOpened: Date;
}

const DB_NAME = 'VeretkaDB';
const DB_VERSION = 1;
const STORE_NAME = 'recentProjects';
const MAX_RECENT_PROJECTS = 10;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'name' });
                }
            };
        });
    }
    return dbPromise;
};

export const useRecentProjects = () => {
    const [projects, setProjects] = useState<RecentProject[]>([]);

    const loadProjects = useCallback(async () => {
        try {
            const db = await getDb();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => {
                const recent = request.result as RecentProject[];
                recent.sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime());
                setProjects(recent);
            };
            request.onerror = () => {
                console.error("Could not load recent projects from DB:", request.error);
            }
        } catch (error) {
            console.error("Failed to open IndexedDB:", error);
        }
    }, []);

    useEffect(() => {
        if (typeof indexedDB !== 'undefined') {
            loadProjects();
        }
    }, [loadProjects]);

    const addRecentProject = useCallback(async (handle: FileSystemFileHandle) => {
        if (!handle || typeof indexedDB === 'undefined') return;
        try {
            const db = await getDb();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const newProject: RecentProject = {
                name: handle.name,
                handle,
                lastOpened: new Date(),
            };
            store.put(newProject);
            
            const allItemsReq = store.getAll();
            allItemsReq.onsuccess = () => {
                if (allItemsReq.result.length > MAX_RECENT_PROJECTS) {
                    const allItems = allItemsReq.result as RecentProject[];
                    allItems.sort((a, b) => a.lastOpened.getTime() - b.lastOpened.getTime());
                    const keyToDelete = allItems[0].name;
                    store.delete(keyToDelete);
                }
            }
            
            transaction.oncomplete = () => {
                loadProjects(); // Reload to reflect changes
            };
        } catch (error) {
            console.error("Failed to add recent project:", error);
        }
    }, [loadProjects]);
    
    const openRecentProject = useCallback(async (project: RecentProject) => {
        try {
            if (await (project.handle as any).queryPermission({ mode: 'read' }) !== 'granted') {
                if (await (project.handle as any).requestPermission({ mode: 'read' }) !== 'granted') {
                    throw new Error("Permission to read file was denied.");
                }
            }
            const file = await project.handle.getFile();
            const content = await file.text();
            
            await addRecentProject(project.handle);
            
            return content;
        } catch (error) {
            console.error(`Failed to open recent project ${project.name}:`, error);
            throw error;
        }
    }, [addRecentProject]);

    return { projects, addRecentProject, openRecentProject };
};
