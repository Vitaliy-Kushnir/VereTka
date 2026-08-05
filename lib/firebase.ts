import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);

// Helper function to create SHA-256 hash for passcodes
export async function hashPasscode(passcode: string): Promise<string> {
  if (!passcode) return '';
  try {
    const msgBuffer = new TextEncoder().encode(passcode.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback simple hash for environments without subtle crypto
    let hash = 0;
    for (let i = 0; i < passcode.length; i++) {
      const char = passcode.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'fb_' + Math.abs(hash).toString(16);
  }
}

export type ProjectVisibility = 'public' | 'private' | 'group';

export interface CloudProject {
  id: string;
  title: string;
  authorName: string;
  ownerNickname: string;
  passcodeHash: string;
  visibility: ProjectVisibility;
  groupId?: string;
  groupName?: string;
  projectData: string; // JSON payload
  shapesCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CloudGroup {
  id: string;
  groupCode: string;
  name: string;
  description: string;
  passcodeHash: string;
  creatorNickname: string;
  createdAt: number;
}

// ==================== PROJECTS API ====================

// Publish or Save a project to Firestore
export async function publishProjectToCloud(params: {
  title: string;
  authorName: string;
  ownerNickname: string;
  passcode: string;
  visibility: ProjectVisibility;
  groupId?: string;
  groupName?: string;
  projectData: string;
  shapesCount: number;
}): Promise<string> {
  const passcodeHash = await hashPasscode(params.passcode);
  const now = Date.now();

  const docRef = await addDoc(collection(db, 'projects'), {
    title: params.title.trim() || 'Без назви',
    authorName: params.authorName.trim() || 'Анонім',
    ownerNickname: params.ownerNickname.trim().toLowerCase(),
    passcodeHash,
    visibility: params.visibility,
    groupId: params.groupId || '',
    groupName: params.groupName || '',
    projectData: params.projectData,
    shapesCount: params.shapesCount || 0,
    createdAt: now,
    updatedAt: now,
    createdTimestamp: serverTimestamp()
  });

  return docRef.id;
}

// Get a single project by ID (for sharing links)
export async function getCloudProjectById(projectId: string): Promise<CloudProject | null> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title || 'Без назви',
      authorName: data.authorName || 'Анонім',
      ownerNickname: data.ownerNickname || '',
      passcodeHash: data.passcodeHash || '',
      visibility: data.visibility || 'public',
      groupId: data.groupId || '',
      groupName: data.groupName || '',
      projectData: data.projectData || '',
      shapesCount: data.shapesCount || 0,
      createdAt: data.createdAt || 0,
      updatedAt: data.updatedAt || 0,
    };
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }
}

// Get public projects for Gallery
export async function getPublicProjects(maxResults = 50): Promise<CloudProject[]> {
  try {
    const q = query(
      collection(db, 'projects'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    const results: CloudProject[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        title: data.title || 'Без назви',
        authorName: data.authorName || 'Анонім',
        ownerNickname: data.ownerNickname || '',
        passcodeHash: data.passcodeHash || '',
        visibility: data.visibility || 'public',
        groupId: data.groupId || '',
        groupName: data.groupName || '',
        projectData: data.projectData || '',
        shapesCount: data.shapesCount || 0,
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
      });
    });
    return results;
  } catch (error) {
    console.error('Error fetching public projects:', error);
    // Fallback query without orderBy in case index is pending
    const qFallback = query(
      collection(db, 'projects'),
      where('visibility', '==', 'public'),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(qFallback);
    const results: CloudProject[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        title: data.title || 'Без назви',
        authorName: data.authorName || 'Анонім',
        ownerNickname: data.ownerNickname || '',
        passcodeHash: data.passcodeHash || '',
        visibility: data.visibility || 'public',
        groupId: data.groupId || '',
        groupName: data.groupName || '',
        projectData: data.projectData || '',
        shapesCount: data.shapesCount || 0,
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
      });
    });
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function getPublicProjectsPaginated(maxResults = 9, lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null): Promise<{ projects: CloudProject[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    let q;
    if (lastVisibleDoc) {
      q = query(
        collection(db, 'projects'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDoc),
        limit(maxResults)
      );
    } else {
      q = query(
        collection(db, 'projects'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const results: CloudProject[] = [];
    let lastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
    
    if (!querySnapshot.empty) {
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        title: data.title || 'Без назви',
        authorName: data.authorName || 'Анонім',
        ownerNickname: data.ownerNickname || '',
        passcodeHash: data.passcodeHash || '',
        visibility: data.visibility || 'public',
        groupId: data.groupId || '',
        groupName: data.groupName || '',
        projectData: data.projectData || '',
        shapesCount: data.shapesCount || 0,
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
      });
    });
    return { projects: results, lastVisible };
  } catch (error) {
    console.error('Error fetching paginated public projects:', error);
    return { projects: [], lastVisible: null };
  }
}

// Get personal projects for a specific user cabinet (verified by passcode)
export async function getPersonalProjects(nickname: string, passcode: string): Promise<{ success: boolean; projects?: CloudProject[]; message?: string }> {
  const normNickname = nickname.trim().toLowerCase();
  const inputHash = await hashPasscode(passcode);

  try {
    const q = query(
      collection(db, 'projects'),
      where('ownerNickname', '==', normNickname)
    );
    const querySnapshot = await getDocs(q);
    const results: CloudProject[] = [];
    let isAuthorized = false;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.passcodeHash === inputHash) {
        isAuthorized = true;
      }
      results.push({
        id: docSnap.id,
        title: data.title || 'Без назви',
        authorName: data.authorName || 'Анонім',
        ownerNickname: data.ownerNickname || '',
        passcodeHash: data.passcodeHash || '',
        visibility: data.visibility || 'private',
        groupId: data.groupId || '',
        groupName: data.groupName || '',
        projectData: data.projectData || '',
        shapesCount: data.shapesCount || 0,
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
      });
    });

    if (results.length > 0 && !isAuthorized) {
      return { success: false, message: 'Невірний пароль від персонального кабінету' };
    }

    results.sort((a, b) => b.createdAt - a.createdAt);
    return { success: true, projects: results };
  } catch (error: any) {
    console.error('Error fetching personal projects:', error);
    return { success: false, message: error.message || 'Помилка завантаження кабінету' };
  }
}

// Get group projects for a specific group code
export async function getGroupProjects(groupCode: string): Promise<CloudProject[]> {
  const normCode = groupCode.trim().toUpperCase();
  try {
    const q = query(
      collection(db, 'projects'),
      where('groupId', '==', normCode)
    );
    const querySnapshot = await getDocs(q);
    const results: CloudProject[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        title: data.title || 'Без назви',
        authorName: data.authorName || 'Анонім',
        ownerNickname: data.ownerNickname || '',
        passcodeHash: data.passcodeHash || '',
        visibility: data.visibility || 'group',
        groupId: data.groupId || '',
        groupName: data.groupName || '',
        projectData: data.projectData || '',
        shapesCount: data.shapesCount || 0,
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
      });
    });
    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching group projects:', error);
    return [];
  }
}

// Change project visibility or assign group
export async function updateProjectVisibility(
  projectId: string,
  passcode: string,
  newVisibility: ProjectVisibility,
  groupId = '',
  groupName = ''
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data();
    const inputHash = await hashPasscode(passcode);
    if (data.passcodeHash && data.passcodeHash !== inputHash) {
      return { success: false, message: 'Невірний пароль проєкту' };
    }

    await updateDoc(docRef, {
      visibility: newVisibility,
      groupId: groupId || data.groupId || '',
      groupName: groupName || data.groupName || '',
      updatedAt: Date.now()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка оновлення проєкту' };
  }
}

// Delete project
export async function deleteProjectFromCloud(
  projectId: string,
  passcode: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data();
    const inputHash = await hashPasscode(passcode);
    if (data.passcodeHash && data.passcodeHash !== inputHash) {
      return { success: false, message: 'Невірний пароль проєкту' };
    }

    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка видалення проєкту' };
  }
}

// Update existing cloud project contents
export async function updateProjectContentInCloud(
  projectId: string,
  passcode: string,
  projectData: string,
  title: string,
  shapesCount: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data();
    const inputHash = await hashPasscode(passcode);
    if (data.passcodeHash && data.passcodeHash !== inputHash) {
      return { success: false, message: 'Невірний пароль проєкту' };
    }

    await updateDoc(docRef, {
      title: title.trim() || data.title,
      projectData,
      shapesCount,
      updatedAt: Date.now()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка збереження змін' };
  }
}

// ==================== GROUPS / HUBS API ====================

// Create new group/hub
export async function createCloudGroup(params: {
  name: string;
  description: string;
  groupCode: string;
  passcode: string;
  creatorNickname: string;
}): Promise<{ success: boolean; message?: string; group?: CloudGroup }> {
  const normCode = params.groupCode.trim().toUpperCase();
  if (!normCode) {
    return { success: false, message: 'Вкажіть унікальний код групи' };
  }

  try {
    // Check if groupCode already exists
    const q = query(collection(db, 'groups'), where('groupCode', '==', normCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { success: false, message: 'Група з таким кодом вже існує. Оберіть інший код' };
    }

    const passcodeHash = await hashPasscode(params.passcode);
    const now = Date.now();

    const docRef = await addDoc(collection(db, 'groups'), {
      groupCode: normCode,
      name: params.name.trim() || normCode,
      description: params.description.trim(),
      passcodeHash,
      creatorNickname: params.creatorNickname.trim().toLowerCase(),
      createdAt: now
    });

    const newGroup: CloudGroup = {
      id: docRef.id,
      groupCode: normCode,
      name: params.name.trim() || normCode,
      description: params.description.trim(),
      passcodeHash,
      creatorNickname: params.creatorNickname.trim().toLowerCase(),
      createdAt: now
    };

    return { success: true, group: newGroup };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка створення групи' };
  }
}

// Verify and login to group/hub
export async function verifyAndGetGroup(
  groupCode: string,
  passcode: string
): Promise<{ success: boolean; group?: CloudGroup; message?: string }> {
  const normCode = groupCode.trim().toUpperCase();
  const inputHash = await hashPasscode(passcode);

  try {
    const q = query(collection(db, 'groups'), where('groupCode', '==', normCode));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, message: 'Групу з таким кодом не знайдено' };
    }

    let foundGroup: CloudGroup | null = null;
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.passcodeHash === inputHash) {
        foundGroup = {
          id: docSnap.id,
          groupCode: d.groupCode,
          name: d.name,
          description: d.description || '',
          passcodeHash: d.passcodeHash,
          creatorNickname: d.creatorNickname || '',
          createdAt: d.createdAt || 0
        };
      }
    });

    if (!foundGroup) {
      return { success: false, message: 'Невірний пароль доступу до групи' };
    }

    return { success: true, group: foundGroup };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка входу в групу' };
  }
}
