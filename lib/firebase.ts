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
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

// Helper function to format raw Firebase errors into clear Ukrainian messages
export function formatFirebaseError(error: any, fallbackMessage: string): string {
  if (!error) return fallbackMessage;
  const msg = typeof error === 'string' ? error : error.message || '';
  const code = error.code || '';

  if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
    return 'Помилка доступу до даних. Правила безпеки оновлено, будь ласка, спробуйте ще раз.';
  }
  if (code === 'unavailable' || code === 'network-request-failed' || msg.includes('offline') || msg.includes('network')) {
    return 'Помилка мережі або зєднання. Будь ласка, перевірте підключення до Інтернету.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Вікно авторизації було закрите користувачем.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Браузер заблокував спливаюче вікно. Будь ласка, дозвольте спливаючі вікна для цього сайту.';
  }

  return fallbackMessage;
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
  searchKeywords?: string[];
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

// Helper function to generate prefixes for search
export function generateSearchKeywords(title: string, authorName: string, ownerNickname: string, groupName?: string): string[] {
  const text = `${title} ${authorName} ${ownerNickname} ${groupName || ''}`.toLowerCase();
  const words = text.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 0);
  const keywordsSet = new Set<string>();

  words.forEach(word => {
    for (let i = 1; i <= Math.min(word.length, 25); i++) {
      keywordsSet.add(word.slice(0, i));
    }
  });

  return Array.from(keywordsSet);
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
  const searchKeywords = generateSearchKeywords(
    params.title,
    params.authorName,
    params.ownerNickname,
    params.groupName
  );

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
    searchKeywords,
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
    const data = docSnap.data() as any;
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
      const data = docSnap.data() as any;
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
      const data = docSnap.data() as any;
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

export async function getPublicProjectsPaginated(maxResults = 12, lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null): Promise<{ projects: CloudProject[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
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
      const data = docSnap.data() as any;
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

export async function searchPublicProjects(
  searchQueryStr: string,
  maxResults = 12,
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ projects: CloudProject[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  const cleanQuery = searchQueryStr.trim().toLowerCase();
  if (!cleanQuery) {
    return getPublicProjectsPaginated(maxResults, lastVisibleDoc);
  }

  const words = cleanQuery.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 0);
  if (words.length === 0) {
    return getPublicProjectsPaginated(maxResults, lastVisibleDoc);
  }

  const token = words[0];

  try {
    let q;
    if (lastVisibleDoc) {
      q = query(
        collection(db, 'projects'),
        where('visibility', '==', 'public'),
        where('searchKeywords', 'array-contains', token),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDoc),
        limit(maxResults)
      );
    } else {
      q = query(
        collection(db, 'projects'),
        where('visibility', '==', 'public'),
        where('searchKeywords', 'array-contains', token),
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
      const data = docSnap.data() as any;
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
        searchKeywords: data.searchKeywords || [],
      });
    });

    let filteredResults = results;
    if (words.length > 1) {
      filteredResults = results.filter(p => {
        const fullText = `${p.title} ${p.authorName} ${p.ownerNickname} ${p.groupName || ''}`.toLowerCase();
        return words.every(w => fullText.includes(w));
      });
    }

    return { projects: filteredResults, lastVisible };
  } catch (error) {
    console.error('Error searching public projects:', error);
    // Fallback query without orderBy in case index is pending
    try {
      const qFallback = query(
        collection(db, 'projects'),
        where('visibility', '==', 'public'),
        where('searchKeywords', 'array-contains', token),
        limit(maxResults)
      );
      const querySnapshot = await getDocs(qFallback);
      const results: CloudProject[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
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
          searchKeywords: data.searchKeywords || [],
        });
      });
      results.sort((a, b) => b.createdAt - a.createdAt);
      return { projects: results, lastVisible: null };
    } catch (e2) {
      return { projects: [], lastVisible: null };
    }
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
      const data = docSnap.data() as any;
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
      const data = docSnap.data() as any;
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

    const data = docSnap.data() as any;
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

    const data = docSnap.data() as any;
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

    const data = docSnap.data() as any;
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

// ==================== USER ACCOUNTS & AUTH API ====================

export interface UserAccount {
  id: string;
  nickname: string;
  passcodeHash: string;
  email?: string;
  googleUid?: string;
  createdAt: number;
  updatedAt: number;
}

// Register new user personal chest account
export async function registerUserAccount(params: {
  nickname: string;
  passcode: string;
  email?: string;
}): Promise<{ success: boolean; message?: string; nickname?: string }> {
  const normNickname = params.nickname.trim().toLowerCase();
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';

  if (!normNickname || normNickname.length < 2) {
    return { success: false, message: 'Нікнейм має містити щонайменше 2 символи' };
  }
  if (!params.passcode || params.passcode.length < 3) {
    return { success: false, message: 'Пароль має містити щонайменше 3 символи' };
  }

  try {
    // Check if nickname already exists in userAccounts
    const qNick = query(collection(db, 'userAccounts'), where('nickname', '==', normNickname));
    const snapNick = await getDocs(qNick);
    if (!snapNick.empty) {
      return { success: false, message: 'Скриня з таким Нікнеймом вже існує. Будь ласка, оберіть інший або увійдіть.' };
    }

    const passcodeHash = await hashPasscode(params.passcode);
    const now = Date.now();

    await addDoc(collection(db, 'userAccounts'), {
      nickname: normNickname,
      passcodeHash,
      email: cleanEmail,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, nickname: normNickname, message: 'Особисту скриню успішно створено!' };
  } catch (error: any) {
    console.error('Error registering user account:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка реєстрації скрині') };
  }
}

// Login to user account (by nickname or email)
export async function loginUserAccount(
  nicknameOrEmail: string,
  passcode: string
): Promise<{ success: boolean; nickname?: string; projects?: CloudProject[]; message?: string }> {
  const normInput = nicknameOrEmail.trim().toLowerCase();
  const inputHash = await hashPasscode(passcode);

  try {
    let targetNickname = normInput;

    // Search by nickname first
    let qAccount = query(collection(db, 'userAccounts'), where('nickname', '==', normInput));
    let snapAccount = await getDocs(qAccount);

    // If empty and input looks like an email, search by email
    if (snapAccount.empty && normInput.includes('@')) {
      qAccount = query(collection(db, 'userAccounts'), where('email', '==', normInput));
      snapAccount = await getDocs(qAccount);
    }

    if (!snapAccount.empty) {
      let authorized = false;
      snapAccount.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.passcodeHash === inputHash) {
          authorized = true;
          targetNickname = data.nickname;
        }
      });

      if (!authorized) {
        return { success: false, message: 'Невірний пароль від особистої скрині' };
      }
    }

    // Fetch personal projects for targetNickname
    const res = await getPersonalProjects(targetNickname, passcode);
    if (res.success) {
      return { success: true, nickname: targetNickname, projects: res.projects || [] };
    } else {
      return { success: false, message: res.message || 'Не вдалося відкрити скриню' };
    }
  } catch (error: any) {
    console.error('Error logging in user account:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка авторизації') };
  }
}

// Sign-In / Register with Google
export async function signInWithGoogleAccount(): Promise<{
  success: boolean;
  nickname?: string;
  email?: string;
  projects?: CloudProject[];
  message?: string;
}> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email ? user.email.toLowerCase() : '';
    const uid = user.uid;

    if (!email) {
      return { success: false, message: 'Не вдалося отримати електронну пошту з акаунту Google' };
    }

    // Check if userAccount exists for this email
    let qAcc = query(collection(db, 'userAccounts'), where('email', '==', email));
    let snapAcc = await getDocs(qAcc);

    let nickname = '';
    if (!snapAcc.empty) {
      snapAcc.forEach((docSnap) => {
        nickname = docSnap.data().nickname;
      });
    } else {
      // Create new account automatically for Google user
      const rawNick = (user.displayName || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      nickname = rawNick || `user_${Date.now().toString().slice(-4)}`;

      // Check if nickname exists
      const qNickCheck = query(collection(db, 'userAccounts'), where('nickname', '==', nickname));
      const snapNickCheck = await getDocs(qNickCheck);
      if (!snapNickCheck.empty) {
        nickname = `${nickname}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const now = Date.now();
      await addDoc(collection(db, 'userAccounts'), {
        nickname,
        passcodeHash: 'GOOGLE_AUTH',
        email,
        googleUid: uid,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Fetch projects for this nickname
    const qProjects = query(collection(db, 'projects'), where('ownerNickname', '==', nickname));
    const snapProjects = await getDocs(qProjects);
    const results: CloudProject[] = [];
    snapProjects.forEach((docSnap) => {
      const data = docSnap.data() as any;
      results.push({
        id: docSnap.id,
        title: data.title || 'Без назви',
        authorName: data.authorName || 'Анонім',
        ownerNickname: data.ownerNickname || nickname,
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

    results.sort((a, b) => b.createdAt - a.createdAt);
    return { success: true, nickname, email, projects: results };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    let msg = 'Не вдалося увійти через Google';
    if (error.code === 'auth/popup-closed-by-user') {
      msg = 'Вікно авторизації Google було закрите';
    } else if (error.code === 'auth/popup-blocked') {
      msg = 'Браузер заблокував спливаюче вікно. Будь ласка, дозвольте спливаючі вікна.';
    } else if (error.message) {
      msg = error.message;
    }
    return { success: false, message: msg };
  }
}

// Account recovery by email
export async function recoverAccountByEmail(emailInput: string): Promise<{
  success: boolean;
  message: string;
  nicknames?: string[];
}> {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Будь ласка, вкажіть дійсну електронну пошту (email)' };
  }

  try {
    const q = query(collection(db, 'userAccounts'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);

    if (snap.empty) {
      return {
        success: false,
        message: 'Акаунт із такою електронною поштою не знайдено в базі даних. Перевірте написання пошти.'
      };
    }

    const nicks: string[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data.nickname) {
        nicks.push(data.nickname);
      }
    });

    return {
      success: true,
      nicknames: nicks,
      message: `Знайдено акаунт(и), прив'язані до цієї пошти: @${nicks.join(', @')}. Використовуйте цей Нікнейм для входу у вашу скриню.`
    };
  } catch (error: any) {
    console.error('Error recovering account:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка відновлення акаунту') };
  }
}

// Get user account profile info (e.g. email)
export async function getUserAccountProfile(nickname: string): Promise<{
  success: boolean;
  email?: string;
  googleUid?: string;
  hasAccountDoc?: boolean;
}> {
  const normNick = nickname.trim().toLowerCase();
  if (!normNick) return { success: false };

  try {
    const q = query(collection(db, 'userAccounts'), where('nickname', '==', normNick));
    const snap = await getDocs(q);
    if (!snap.empty) {
      let email = '';
      let googleUid = '';
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        email = data.email || '';
        googleUid = data.googleUid || '';
      });
      return { success: true, email, googleUid, hasAccountDoc: true };
    }
    return { success: true, email: '', hasAccountDoc: false };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false };
  }
}

// Update or create user account profile (add/edit email or passcode)
export async function updateUserAccountProfile(params: {
  nickname: string;
  currentPasscode?: string;
  email?: string;
  newPasscode?: string;
}): Promise<{ success: boolean; message: string; email?: string }> {
  const normNick = params.nickname.trim().toLowerCase();
  const cleanEmail = params.email !== undefined ? params.email.trim().toLowerCase() : undefined;

  if (!normNick) {
    return { success: false, message: 'Недійсний Нікнейм' };
  }

  try {
    // If email is provided, check if it is used by another nickname
    if (cleanEmail) {
      const qEmail = query(collection(db, 'userAccounts'), where('email', '==', cleanEmail));
      const snapEmail = await getDocs(qEmail);
      let isUsedByOther = false;
      snapEmail.forEach((docSnap) => {
        if (docSnap.data().nickname !== normNick) {
          isUsedByOther = true;
        }
      });
      if (isUsedByOther) {
        return { success: false, message: 'Ця електронна пошта вже прив’язана до іншого акаунту' };
      }
    }

    const q = query(collection(db, 'userAccounts'), where('nickname', '==', normNick));
    const snap = await getDocs(q);

    let newPasscodeHash: string | undefined;
    if (params.newPasscode && params.newPasscode.trim()) {
      if (params.newPasscode.trim().length < 3) {
        return { success: false, message: 'Новий пароль має містити щонайменше 3 символи' };
      }
      newPasscodeHash = await hashPasscode(params.newPasscode.trim());
    }

    const now = Date.now();

    if (!snap.empty) {
      // Update existing document in userAccounts
      let docId = '';
      let oldHash = '';
      snap.forEach((docSnap) => {
        docId = docSnap.id;
        oldHash = docSnap.data().passcodeHash || '';
      });

      // Verify current passcode if required and not Google Auth
      if (oldHash && oldHash !== 'GOOGLE_AUTH' && params.currentPasscode) {
        const curHash = await hashPasscode(params.currentPasscode);
        if (curHash !== oldHash) {
          return { success: false, message: 'Поточний пароль вказано невірно' };
        }
      }

      const updateData: any = {
        updatedAt: now,
      };
      if (cleanEmail !== undefined) {
        updateData.email = cleanEmail;
      }
      if (newPasscodeHash) {
        updateData.passcodeHash = newPasscodeHash;
      }

      await updateDoc(doc(db, 'userAccounts', docId), updateData);
    } else {
      // Legacy account without userAccounts document: Create it!
      let passHash = 'GOOGLE_AUTH';
      if (params.currentPasscode) {
        passHash = await hashPasscode(params.currentPasscode);
      }
      if (newPasscodeHash) {
        passHash = newPasscodeHash;
      }

      await addDoc(collection(db, 'userAccounts'), {
        nickname: normNick,
        passcodeHash: passHash,
        email: cleanEmail || '',
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: 'Дані особистої скрині успішно збережено!',
      email: cleanEmail
    };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка оновлення даних') };
  }
}

// Delete user account (personal chest)
export async function deleteUserAccount(
  nickname: string,
  passcode?: string
): Promise<{ success: boolean; message: string }> {
  const normNick = nickname.trim().toLowerCase();
  if (!normNick) {
    return { success: false, message: 'Недійсний нікнейм' };
  }

  try {
    const q = query(collection(db, 'userAccounts'), where('nickname', '==', normNick));
    const snap = await getDocs(q);

    if (!snap.empty) {
      let docId = '';
      let passHash = '';
      snap.forEach((docSnap) => {
        docId = docSnap.id;
        passHash = docSnap.data().passcodeHash || '';
      });

      if (passHash && passHash !== 'GOOGLE_AUTH' && passcode) {
        const curHash = await hashPasscode(passcode);
        if (curHash !== passHash) {
          return { success: false, message: 'Пароль вказано невірно' };
        }
      }

      await deleteDoc(doc(db, 'userAccounts', docId));
    }

    // Delete projects belonging to this user
    try {
      const qProj = query(collection(db, 'projects'), where('ownerNickname', '==', normNick));
      const snapProj = await getDocs(qProj);
      const deletePromises: Promise<void>[] = [];
      snapProj.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, 'projects', docSnap.id)));
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('Error deleting user projects during account deletion:', err);
    }

    return { success: true, message: 'Особисту скриню та її вміст успішно видалено' };
  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка видалення скрині') };
  }
}

// Delete cloud group / hub
export async function deleteCloudGroup(
  groupId: string,
  passcode: string
): Promise<{ success: boolean; message: string }> {
  if (!groupId) {
    return { success: false, message: 'Не вказано ID групи' };
  }

  try {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);

    if (!snap.exists()) {
      return { success: false, message: 'Групу не знайдено або її вже видалено' };
    }

    const data = snap.data();
    if (data.passcodeHash) {
      const inputHash = await hashPasscode(passcode);
      if (inputHash !== data.passcodeHash) {
        return { success: false, message: 'Пароль гурту вказано невірно' };
      }
    }

    await deleteDoc(groupRef);

    // Unlink projects from this group
    try {
      const qProj = query(collection(db, 'projects'), where('groupId', '==', data.groupCode));
      const snapProj = await getDocs(qProj);
      const updatePromises: Promise<void>[] = [];
      snapProj.forEach((docSnap) => {
        updatePromises.push(updateDoc(doc(db, 'projects', docSnap.id), {
          visibility: 'private',
          groupId: ''
        }));
      });
      await Promise.all(updatePromises);
    } catch (err) {
      console.warn('Error unlinking projects during group deletion:', err);
    }

    return { success: true, message: 'Групу успішно видалено' };
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка видалення групи') };
  }
}



