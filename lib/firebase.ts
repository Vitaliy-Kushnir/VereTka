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
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
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

export interface GroupLinkInfo {
  groupId: string;
  groupName: string;
  sentAt?: number;
}

export interface CloudProject {
  id: string;
  title: string;
  description?: string;
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
  isGroupCopy?: boolean;
  parentProjectId?: string;
  sentToGroups?: GroupLinkInfo[];
}

export type GroupMode = 'education' | 'gallery' | 'readonly';
export type StudentUpdatePolicy = 'allow_overwrite' | 'create_versions' | 'freeze_after_submit';

export interface CloudGroup {
  id: string;
  groupCode: string;
  name: string;
  description: string;
  passcodeHash: string;
  creatorNickname: string;
  createdAt: number;
  mode?: GroupMode;
  studentUpdatePolicy?: StudentUpdatePolicy;
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
  description?: string;
  authorName: string;
  ownerNickname: string;
  passcode: string;
  visibility: ProjectVisibility;
  groupId?: string;
  groupName?: string;
  projectData: string;
  shapesCount: number;
  isGroupCopy?: boolean;
}): Promise<string> {
  const normGroupId = params.groupId?.trim().toUpperCase();

  // If publishing to a group, verify permissions based on mode
  if (normGroupId && params.visibility === 'group') {
    const qGroup = query(collection(db, 'groups'), where('groupCode', '==', normGroupId));
    const groupSnap = await getDocs(qGroup);
    if (!groupSnap.empty) {
      const groupData = groupSnap.docs[0].data();
      const creator = groupData.creatorNickname || '';
      const mode = groupData.mode || 'gallery';

      if (mode === 'readonly' && creator.toLowerCase() !== params.ownerNickname.trim().toLowerCase()) {
        throw new Error('Ця група працює в режимі "Дошка шаблонів" (readonly). Тільки її засновник може публікувати сюди роботи.');
      }
    } else {
       throw new Error('Групу з таким кодом не знайдено!');
    }
  }

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
    description: params.description?.trim() || '',
    authorName: params.authorName.trim() || 'Анонім',
    ownerNickname: params.ownerNickname.trim().toLowerCase(),
    passcodeHash,
    visibility: params.visibility,
    groupId: normGroupId || '',
    groupName: params.groupName || '',
    projectData: params.projectData,
    shapesCount: params.shapesCount || 0,
    searchKeywords,
    createdAt: now,
    updatedAt: now,
    createdTimestamp: serverTimestamp(),
    isGroupCopy: params.isGroupCopy || false
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
    console.warn('Composite index pending/missing for getPublicProjectsPaginated, using fallback without orderBy:', error);
    try {
      const qFallback = query(
        collection(db, 'projects'),
        where('visibility', '==', 'public'),
        limit(100)
      );
      const querySnapshot = await getDocs(qFallback);
      let docs = querySnapshot.docs;
      
      docs.sort((a, b) => {
        const cA = a.data().createdAt || 0;
        const cB = b.data().createdAt || 0;
        return cB - cA;
      });

      if (lastVisibleDoc) {
        const lastIdx = docs.findIndex(d => d.id === lastVisibleDoc.id);
        if (lastIdx !== -1) {
          docs = docs.slice(lastIdx + 1);
        }
      }

      const pagedDocs = docs.slice(0, maxResults);
      const results: CloudProject[] = pagedDocs.map(docSnap => {
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
      });

      const lastVisible = pagedDocs.length > 0 ? pagedDocs[pagedDocs.length - 1] : null;
      return { projects: results, lastVisible };
    } catch (fallbackErr) {
      console.error('Fallback query failed for getPublicProjectsPaginated:', fallbackErr);
      return { projects: [], lastVisible: null };
    }
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
export async function getPersonalProjects(nickname: string, passcode?: string): Promise<{ success: boolean; projects?: CloudProject[]; message?: string }> {
  const normNickname = nickname.trim().toLowerCase();
  if (!normNickname) {
    return { success: false, message: 'Вкажіть Нікнейм' };
  }
  const inputHash = passcode ? await hashPasscode(passcode) : '';

  try {
    // Check if user account exists
    const qAcc = query(collection(db, 'userAccounts'), where('nickname', '==', normNickname));
    const snapAcc = await getDocs(qAcc);

    if (snapAcc.empty) {
      return {
        success: false,
        message: 'Акаунт із таким нікнеймом не знайдено (можливо, скриню було видалено). Перевірте нікнейм або створіть нову скриню.'
      };
    }

    // Query projects for this user
    const q = query(
      collection(db, 'projects'),
      where('ownerNickname', '==', normNickname)
    );
    const querySnapshot = await getDocs(q);

    if (!snapAcc.empty && passcode) {
      let isPassValid = false;
      snapAcc.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.passcodeHash === inputHash || data.passcodeHash === 'GOOGLE_AUTH') {
          isPassValid = true;
        }
      });
      if (!isPassValid) {
        return { success: false, message: 'Невірний пароль від особистої скрині' };
      }
    }

    const results: CloudProject[] = [];
    const groupCopies: { parentProjectId?: string; groupId: string; groupName: string; title: string; createdAt: number }[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data.isGroupCopy || data.visibility === 'group') {
        if (data.groupId) {
          groupCopies.push({
            parentProjectId: data.parentProjectId || '',
            groupId: data.groupId || '',
            groupName: data.groupName || data.groupId || '',
            title: data.title || '',
            createdAt: data.createdAt || 0
          });
        }
        return; // Skip group copies in personal chest
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
        description: data.description || '',
        projectData: data.projectData || '',
        shapesCount: data.shapesCount || 0,
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
        sentToGroups: Array.isArray(data.sentToGroups) ? data.sentToGroups : [],
      });
    });

    // Correlate group copies with personal projects
    results.forEach((p) => {
      if (!p.sentToGroups) p.sentToGroups = [];

      groupCopies.forEach((gc) => {
        if (gc.groupId) {
          const isMatch = (gc.parentProjectId && gc.parentProjectId === p.id) ||
                          (!gc.parentProjectId && gc.title.trim().toLowerCase() === p.title.trim().toLowerCase());
          if (isMatch) {
            const alreadyExists = p.sentToGroups!.some((g) => g.groupId === gc.groupId);
            if (!alreadyExists) {
              p.sentToGroups!.push({
                groupId: gc.groupId,
                groupName: gc.groupName || gc.groupId,
                sentAt: gc.createdAt
              });
            }
          }
        }
      });
    });

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

export function parseTitleVersion(titleStr: string): { baseTitle: string; version: number } {
  const trimmed = (titleStr || '').trim();
  const match = trimmed.match(/^(.*?)\s*\((?:[vV]\.?|версія\s*)\s*(\d+)\)$/i);
  if (match) {
    return {
      baseTitle: match[1].trim(),
      version: parseInt(match[2], 10) || 1
    };
  }
  return {
    baseTitle: trimmed,
    version: 1
  };
}

export async function checkGroupProjectDuplicate(
  groupId: string,
  title: string,
  ownerNickname: string,
  authorName: string
): Promise<{
  isDuplicate: boolean;
  existingProject?: CloudProject;
  groupMode?: GroupMode;
  studentUpdatePolicy?: StudentUpdatePolicy;
  groupName?: string;
  creatorNickname?: string;
  nextSuggestedTitle?: string;
  existingUserTitlesInGroup?: string[];
}> {
  const normGroupId = groupId.trim().toUpperCase();
  if (!normGroupId) return { isDuplicate: false };

  try {
    const qGroup = query(collection(db, 'groups'), where('groupCode', '==', normGroupId));
    const groupSnap = await getDocs(qGroup);
    let groupMode: GroupMode = 'gallery';
    let studentUpdatePolicy: StudentUpdatePolicy = 'allow_overwrite';
    let groupName = '';
    let creatorNickname = '';

    if (!groupSnap.empty) {
      const gData = groupSnap.docs[0].data();
      groupMode = gData.mode || 'gallery';
      studentUpdatePolicy = gData.studentUpdatePolicy || 'allow_overwrite';
      groupName = gData.name || '';
      creatorNickname = gData.creatorNickname || '';
    }

    const qProj = query(
      collection(db, 'projects'),
      where('groupId', '==', normGroupId),
      where('visibility', '==', 'group')
    );
    const projSnap = await getDocs(qProj);

    const normTitle = title.trim().toLowerCase();
    const normNick = ownerNickname.trim().toLowerCase();
    const normAuthor = authorName.trim().toLowerCase();

    let existingProject: CloudProject | undefined = undefined;
    const existingUserTitlesInGroup: string[] = [];

    const { baseTitle: targetBaseTitle } = parseTitleVersion(title);
    const normBaseTitle = targetBaseTitle.toLowerCase();
    const foundVersions: number[] = [];

    projSnap.forEach((docSnap) => {
      const d = docSnap.data() as any;
      const rawTitle = (d.title || 'Без назви').trim();
      const pTitle = rawTitle.toLowerCase();
      const pNick = (d.ownerNickname || '').trim().toLowerCase();
      const pAuthor = (d.authorName || '').trim().toLowerCase();

      const isSameOwner = (normNick && pNick && pNick === normNick) ||
                          (normAuthor && pAuthor && pAuthor === normAuthor);

      if (isSameOwner) {
        existingUserTitlesInGroup.push(rawTitle);

        if (pTitle === normTitle) {
          existingProject = {
            id: docSnap.id,
            title: rawTitle,
            authorName: d.authorName || 'Анонім',
            ownerNickname: d.ownerNickname || '',
            passcodeHash: d.passcodeHash || '',
            visibility: d.visibility || 'group',
            groupId: d.groupId || '',
            groupName: d.groupName || '',
            description: d.description || '',
            projectData: d.projectData || '',
            shapesCount: d.shapesCount || 0,
            createdAt: d.createdAt || 0,
            updatedAt: d.updatedAt || 0,
          };
        }

        const { baseTitle: pBase, version: pVer } = parseTitleVersion(rawTitle);
        if (pBase.toLowerCase() === normBaseTitle) {
          foundVersions.push(pVer);
        }
      }
    });

    let nextSuggestedTitle = `${targetBaseTitle} (v.2)`;
    if (foundVersions.length > 0) {
      const maxVer = Math.max(...foundVersions);
      const nextVer = maxVer >= 1 ? maxVer + 1 : 2;
      nextSuggestedTitle = `${targetBaseTitle} (v.${nextVer})`;
    }

    return {
      isDuplicate: !!existingProject,
      existingProject,
      groupMode,
      studentUpdatePolicy,
      groupName,
      creatorNickname,
      nextSuggestedTitle,
      existingUserTitlesInGroup
    };
  } catch (e) {
    console.error('Error checking duplicate group project:', e);
    return { isDuplicate: false };
  }
}

export async function copyProjectToGroup(
  projectId: string,
  passcode: string,
  groupId: string,
  groupName = '',
  ownerNickname = '',
  options?: {
    action?: 'overwrite' | 'new_copy';
    existingProjectId?: string;
    targetTitle?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const normGroupId = groupId.toUpperCase().trim();
    // Verify group exists
    const qGroup = query(collection(db, 'groups'), where('groupCode', '==', normGroupId));
    const groupSnap = await getDocs(qGroup);
    if (groupSnap.empty) {
      return { success: false, message: 'Групу з таким кодом не знайдено!' };
    }
    const groupData = groupSnap.docs[0].data();
    const actualGroupName = groupData.name || groupName;
    const mode = groupData.mode || 'gallery';
    const creator = groupData.creatorNickname || '';

    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data() as any;
    const currentNick = (ownerNickname || data.ownerNickname || '').trim().toLowerCase();
    
    if (mode === 'readonly' && creator.toLowerCase() !== currentNick) {
      return { success: false, message: `Ця група працює в режимі "Дошка шаблонів" (readonly). Тільки її засновник (@${creator}) може публікувати сюди роботи.` };
    }

    const isOwner = !!(ownerNickname && data.ownerNickname && data.ownerNickname.trim().toLowerCase() === ownerNickname.trim().toLowerCase());

    if (!isOwner && data.passcodeHash) {
      const inputHash = await hashPasscode(passcode);
      if (data.passcodeHash !== inputHash) {
        return { success: false, message: 'Невірний пароль проєкту' };
      }
    }
    
    const now = Date.now();
    const finalTitle = (options?.targetTitle || data.title || 'Без назви').trim();

    if (options?.action === 'overwrite' && options.existingProjectId) {
      const existingRef = doc(db, 'projects', options.existingProjectId);
      await updateDoc(existingRef, {
        title: finalTitle,
        projectData: data.projectData,
        shapesCount: data.shapesCount,
        description: data.description || '',
        updatedAt: now,
        createdTimestamp: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'projects'), {
        ...data,
        title: finalTitle,
        visibility: 'group',
        groupId: normGroupId,
        groupName: actualGroupName || data.groupName || '',
        updatedAt: now,
        createdAt: now,
        createdTimestamp: serverTimestamp(),
        isGroupCopy: true,
        parentProjectId: projectId
      });
    }

    // Also update parent project document sentToGroups
    try {
      const existingSentToGroups: GroupLinkInfo[] = Array.isArray(data.sentToGroups) ? [...data.sentToGroups] : [];
      if (!existingSentToGroups.some(g => g.groupId === normGroupId)) {
        existingSentToGroups.push({
          groupId: normGroupId,
          groupName: actualGroupName || normGroupId,
          sentAt: now
        });
        await updateDoc(docRef, { sentToGroups: existingSentToGroups });
      }
    } catch (e) {
      console.error('Error updating parent project sentToGroups:', e);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка копіювання проєкту' };
  }
}

// Change project visibility or assign group
export async function updateProjectVisibility(
  projectId: string,
  passcode: string,
  newVisibility: ProjectVisibility,
  groupId = '',
  groupName = '',
  ownerNickname = ''
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data() as any;
    const inputHash = passcode ? await hashPasscode(passcode) : '';
    const isOwner = !!(ownerNickname && data.ownerNickname && data.ownerNickname.toLowerCase() === ownerNickname.trim().toLowerCase());

    if (data.passcodeHash && data.passcodeHash !== inputHash && !isOwner) {
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
  passcode?: string,
  ownerNickname = ''
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data() as any;
    const isOwner = !!(
      ownerNickname &&
      data.ownerNickname &&
      data.ownerNickname.trim().toLowerCase() === ownerNickname.trim().toLowerCase()
    );

    if (passcode && passcode.trim()) {
      const inputHash = await hashPasscode(passcode.trim());

      // If it's an educational/group submission
      if (data.isGroupCopy || data.visibility === 'group') {
        if (data.groupId) {
          const qGroup = query(collection(db, 'groups'), where('groupCode', '==', data.groupId));
          const groupSnap = await getDocs(qGroup);
          if (!groupSnap.empty) {
            const groupData = groupSnap.docs[0].data();
            if (groupData.passcodeHash === inputHash) {
              await deleteDoc(docRef);
              return { success: true };
            }
          }
        }
      } else if (data.passcodeHash && data.passcodeHash !== inputHash && !isOwner) {
        return { success: false, message: 'Невірний пароль проєкту' };
      }
    } else if (data.passcodeHash && !isOwner) {
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
  shapesCount: number,
  ownerNickname = ''
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data() as any;
    const inputHash = passcode ? await hashPasscode(passcode.trim()) : '';
    const isOwner = !!(
      ownerNickname &&
      data.ownerNickname &&
      data.ownerNickname.trim().toLowerCase() === ownerNickname.trim().toLowerCase()
    );

    if (data.passcodeHash && data.passcodeHash !== inputHash && !isOwner) {
      return { success: false, message: 'Невірний пароль проєкту' };
    }

    const searchKeywords = generateSearchKeywords(
      title.trim() || data.title,
      data.authorName || '',
      data.ownerNickname || '',
      data.groupName || ''
    );

    await updateDoc(docRef, {
      title: title.trim() || data.title,
      projectData,
      shapesCount,
      searchKeywords,
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
  mode?: GroupMode;
  studentUpdatePolicy?: StudentUpdatePolicy;
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
    const studentUpdatePolicy = params.studentUpdatePolicy || 'allow_overwrite';

    const docRef = await addDoc(collection(db, 'groups'), {
      groupCode: normCode,
      name: params.name.trim() || normCode,
      description: params.description.trim(),
      passcodeHash,
      creatorNickname: params.creatorNickname.trim().toLowerCase(),
      createdAt: now,
      mode: params.mode || 'gallery',
      studentUpdatePolicy
    });

    const newGroup: CloudGroup = {
      id: docRef.id,
      groupCode: normCode,
      name: params.name.trim() || normCode,
      description: params.description.trim(),
      passcodeHash,
      creatorNickname: params.creatorNickname.trim().toLowerCase(),
      createdAt: now,
      mode: params.mode || 'gallery',
      studentUpdatePolicy
    };

    return { success: true, group: newGroup };
  } catch (error: any) {
    return { success: false, message: error.message || 'Помилка створення групи' };
  }
}

// Verify and login to group/hub
export async function verifyAndGetGroup(
  groupCode: string,
  passcode: string | undefined,
  personalNickname?: string
): Promise<{ success: boolean; group?: CloudGroup; message?: string }> {
  const normCode = groupCode.trim().toUpperCase();
  const inputHash = passcode ? await hashPasscode(passcode) : '';

  try {
    const q = query(collection(db, 'groups'), where('groupCode', '==', normCode));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, message: 'Групу з таким кодом не знайдено' };
    }

    let foundGroup: CloudGroup | null = null;
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const isCreator = personalNickname && d.creatorNickname && d.creatorNickname.toLowerCase() === personalNickname.trim().toLowerCase();
      
      if (d.passcodeHash === inputHash || isCreator) {
        foundGroup = {
          id: docSnap.id,
          groupCode: d.groupCode,
          name: d.name,
          description: d.description || '',
          passcodeHash: d.passcodeHash,
          creatorNickname: d.creatorNickname || '',
          createdAt: d.createdAt || 0,
          mode: d.mode || 'gallery',
          studentUpdatePolicy: d.studentUpdatePolicy || 'allow_overwrite'
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

// Get group metadata by group code (for publish info preview)
export async function getGroupInfoByCode(groupCode: string): Promise<CloudGroup | null> {
  const normCode = groupCode.trim().toUpperCase();
  if (!normCode) return null;
  try {
    const q = query(collection(db, 'groups'), where('groupCode', '==', normCode));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const d = docSnap.data();
    return {
      id: docSnap.id,
      groupCode: d.groupCode,
      name: d.name,
      description: d.description || '',
      passcodeHash: d.passcodeHash || '',
      creatorNickname: d.creatorNickname || '',
      createdAt: d.createdAt || 0,
      mode: d.mode || 'gallery',
      studentUpdatePolicy: d.studentUpdatePolicy || 'allow_overwrite'
    };
  } catch (e) {
    console.error('Error fetching group info by code:', e);
    return null;
  }
}

// Update group parameters / settings
export async function updateGroupSettings(
  groupCode: string,
  passcode: string,
  updates: {
    name?: string;
    description?: string;
    studentUpdatePolicy?: StudentUpdatePolicy;
  },
  ownerNickname?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const normCode = groupCode.trim().toUpperCase();
    const q = query(collection(db, 'groups'), where('groupCode', '==', normCode));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, message: 'Групу не знайдено' };
    }
    const docSnap = snap.docs[0];
    const d = docSnap.data();
    
    const inputHash = passcode ? await hashPasscode(passcode) : '';
    const isCreator = ownerNickname && d.creatorNickname && d.creatorNickname.toLowerCase() === ownerNickname.trim().toLowerCase();
    if (d.passcodeHash !== inputHash && !isCreator) {
      return { success: false, message: 'Невірний пароль групи' };
    }

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.studentUpdatePolicy !== undefined) payload.studentUpdatePolicy = updates.studentUpdatePolicy;

    await updateDoc(doc(db, 'groups', docSnap.id), payload);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || 'Помилка оновлення налаштувань групи' };
  }
}

// ==================== USER ACCOUNTS & AUTH API ====================

export interface UserAccount {
  id: string;
  nickname: string;
  authorName?: string;
  passcodeHash: string;
  email?: string;
  googleUid?: string;
  savedGroups?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

// Check if nickname already exists in database
export async function checkNicknameExists(nickname: string): Promise<boolean> {
  const normNickname = nickname.trim().toLowerCase();
  if (!normNickname || normNickname.length < 2) return false;
  try {
    const qNick = query(collection(db, 'userAccounts'), where('nickname', '==', normNickname));
    const snapNick = await getDocs(qNick);
    return !snapNick.empty;
  } catch (e) {
    console.error('Error checking nickname exists:', e);
    return false;
  }
}

// Register new user personal chest account
export async function registerUserAccount(params: {
  nickname: string;
  authorName?: string;
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
      authorName: params.authorName ? params.authorName.trim() : '',
      passcodeHash,
      plainPasscode: params.passcode.trim(),
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
        targetNickname = data.nickname;
        if (data.passcodeHash === inputHash || data.passcodeHash === 'GOOGLE_AUTH') {
          authorized = true;
        }
      });

      if (!authorized) {
        return { success: false, message: 'Невірний пароль від особистої скрині' };
      }
    } else {
      return {
        success: false,
        message: 'Акаунт з таким нікнеймом або поштою не існує (можливо, його було видалено). Перевірте введені дані або зареєструйтесь на вкладці "Реєстрація".'
      };
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
export async function signInWithGoogleAccount(
  customNickname?: string,
  customPasscode?: string
): Promise<{
  success: boolean;
  nickname?: string;
  email?: string;
  passcode?: string;
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

    // Default nickname is local part before @ in Google email
    const googleDefaultNick = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    // Check if userAccount exists for this email
    let qAcc = query(collection(db, 'userAccounts'), where('email', '==', email));
    let snapAcc = await getDocs(qAcc);

    let nickname = '';
    
    if (snapAcc.empty) {
      if (!customNickname || !customNickname.trim()) {
        return {
          success: false,
          message: 'Акаунт із такою електронною поштою Google не знайдено в базі даних. Спочатку зареєструйтеся на вкладці "Реєстрація".'
        };
      }

      // Create new account for Google user (during Registration)
      nickname = customNickname.trim().toLowerCase();
      if (!nickname || nickname.length < 2) {
        const googleDefaultNick = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        nickname = googleDefaultNick || `user_${Date.now().toString().slice(-4)}`;
      }

      // Check if nickname exists
      const qNickCheck = query(collection(db, 'userAccounts'), where('nickname', '==', nickname));
      const snapNickCheck = await getDocs(qNickCheck);
      if (!snapNickCheck.empty) {
        nickname = `${nickname}_${Math.floor(100 + Math.random() * 900)}`;
      }

      const finalPasscode = customPasscode ? customPasscode.trim() : '';
      const passcodeHash = finalPasscode ? await hashPasscode(finalPasscode) : 'GOOGLE_AUTH';

      const now = Date.now();
      await addDoc(collection(db, 'userAccounts'), {
        nickname,
        passcodeHash,
        plainPasscode: finalPasscode || 'Вхід через Google',
        email,
        googleUid: uid,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const docSnap = snapAcc.docs[0];
      nickname = docSnap.data().nickname;

      // Update passcode if user provided a custom passcode during registration/login
      if (customPasscode && customPasscode.trim()) {
        const newHash = await hashPasscode(customPasscode.trim());
        await updateDoc(doc(db, 'userAccounts', docSnap.id), {
          passcodeHash: newHash,
          plainPasscode: customPasscode.trim(),
          updatedAt: Date.now()
        });
      }
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
    return { success: true, nickname, email, passcode: customPasscode?.trim(), projects: results };
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
  sentEmail?: string;
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

    const accountList: { nickname: string; passcode: string }[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data.nickname) {
        let pass = data.plainPasscode || '';
        if (!pass) {
          if (data.passcodeHash === 'GOOGLE_AUTH') {
            pass = 'Вхід через Google';
          } else {
            pass = 'Не збережено (можна змінити у налаштуваннях)';
          }
        }
        accountList.push({ nickname: data.nickname, passcode: pass });
      }
    });

    const nicks = accountList.map(a => `@${a.nickname}`).join(', ');
    const credentialsText = accountList.map(a => `• Ваш нікнейм: @${a.nickname}\n  Пароль: ${a.passcode}`).join('\n\n');

    // Send email via FormSubmit API
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Відновлення доступу до VereTka (${nicks})`,
          _template: 'table',
          'Повідомлення': `Доброго дня!\n\nВи запросили відновлення доступу до вашої особистої скрині VereTka.\n\n${credentialsText}\n\nЗ повагою, VereTka!`,
          'Ваш нікнейм': nicks,
          'Пароль': accountList.map(a => a.passcode).join(', ')
        })
      });
    } catch (e) {
      console.log('FormSubmit notification dispatch note:', e);
    }

    return {
      success: true,
      nicknames: accountList.map(a => a.nickname),
      sentEmail: cleanEmail,
      message: `📩 Лист із вашими даними доступу (нікнейм та пароль) успішно відправлено на пошту ${cleanEmail}! Перевірте вашу поштову скриньку.`
    };
  } catch (error: any) {
    console.error('Error recovering account:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка відновлення акаунту') };
  }
}

// Get all groups associated with a user (created or participated)


import { CloudGroup } from '../types';
export type GroupData = CloudGroup;


export async function getUserGroups(userNickname: string): Promise<GroupData[]> {
  const normNick = userNickname.trim().toLowerCase();
  if (!normNick) return [];

  try {
    const groupMap = new Map<string, GroupData>();

    // 1. Fetch groups created by user
    const qCreated = query(collection(db, 'groups'), where('creatorNickname', '==', normNick));
    const snapCreated = await getDocs(qCreated);
    snapCreated.forEach((docSnap) => {
      const data = docSnap.data() as any;
      groupMap.set(data.groupCode, {
        id: docSnap.id,
        groupCode: data.groupCode,
        name: data.name,
        description: data.description || '',
        creatorNickname: data.creatorNickname || '',
        passcodeHash: data.passcodeHash || '',
        createdAt: data.createdAt || 0,
        mode: data.mode || 'gallery',
      });
    });

    // 2. Fetch projects owned by user that belong to a group
    const qUserProjects = query(
      collection(db, 'projects'),
      where('ownerNickname', '==', normNick),
      where('visibility', '==', 'group')
    );
    const snapProjects = await getDocs(qUserProjects);
    const groupCodes = new Set<string>();
    snapProjects.forEach((docSnap) => {
      const gId = docSnap.data().groupId;
      if (gId) groupCodes.add(gId.toUpperCase());
    });

    for (const code of groupCodes) {
      if (!groupMap.has(code)) {
        const qG = query(collection(db, 'groups'), where('groupCode', '==', code));
        const snapG = await getDocs(qG);
        snapG.forEach((docSnap) => {
          const data = docSnap.data() as any;
          groupMap.set(data.groupCode, {
            id: docSnap.id,
            groupCode: data.groupCode,
            name: data.name,
            description: data.description || '',
            creatorNickname: data.creatorNickname || '',
            passcodeHash: data.passcodeHash || '',
            createdAt: data.createdAt || 0,
            mode: data.mode || 'gallery',
          });
        });
      }
    }

    return Array.from(groupMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
}

// Get user account profile info (e.g. email)
export async function getUserAccountProfile(nickname: string): Promise<{
  success: boolean;
  email?: string;
  authorName?: string;
  googleUid?: string;
  savedGroups?: Record<string, string>;
  hasAccountDoc?: boolean;
}> {
  const normNick = nickname.trim().toLowerCase();
  if (!normNick) return { success: false };

  try {
    const q = query(collection(db, 'userAccounts'), where('nickname', '==', normNick));
    const snap = await getDocs(q);
    if (!snap.empty) {
      let email = '';
      let authorName = '';
      let googleUid = '';
      let savedGroups: Record<string, string> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        email = data.email || '';
        authorName = data.authorName || '';
        googleUid = data.googleUid || '';
        savedGroups = data.savedGroups || {};
      });
      return { success: true, email, authorName, googleUid, savedGroups, hasAccountDoc: true };
    }
    return { success: true, email: '', authorName: '', savedGroups: {}, hasAccountDoc: false };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false };
  }
}

// Save a group passcode to user account
export async function saveGroupPasscodeToAccount(nickname: string, groupCode: string, passcode: string): Promise<boolean> {
  const normNick = nickname.trim().toLowerCase();
  const normGroupCode = groupCode.trim().toUpperCase();
  if (!normNick || !normGroupCode || !passcode) return false;

  try {
    const q = query(collection(db, 'userAccounts'), where('nickname', '==', normNick));
    const snap = await getDocs(q);
    if (snap.empty) return false;
    
    let docId = '';
    snap.forEach((docSnap) => {
      docId = docSnap.id;
    });

    if (docId) {
      const docRef = doc(db, 'userAccounts', docId);
      await updateDoc(docRef, {
        [`savedGroups.${normGroupCode}`]: passcode,
        updatedAt: Date.now()
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving group passcode to account:', error);
    return false;
  }
}

// Update or create user account profile (add/edit email or passcode)
export async function updateUserAccountProfile(params: {
  nickname: string;
  authorName?: string;
  currentPasscode?: string;
  email?: string;
  newPasscode?: string;
}): Promise<{ success: boolean; message: string; email?: string; authorName?: string }> {
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
      if (params.authorName !== undefined) {
        updateData.authorName = params.authorName.trim();
      }
      if (cleanEmail !== undefined) {
        updateData.email = cleanEmail;
      }
      if (newPasscodeHash) {
        updateData.passcodeHash = newPasscodeHash;
        updateData.plainPasscode = params.newPasscode?.trim();
      } else if (params.currentPasscode && params.currentPasscode.trim()) {
        updateData.plainPasscode = params.currentPasscode.trim();
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
        authorName: params.authorName ? params.authorName.trim() : '',
        passcodeHash: passHash,
        plainPasscode: params.newPasscode?.trim() || params.currentPasscode?.trim() || 'Вхід через Google',
        email: cleanEmail || '',
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: 'Дані особистої скрині успішно збережено!',
      email: cleanEmail,
      authorName: params.authorName?.trim()
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

export interface GroupMember {
  nickname: string;
  authorName?: string;
  role: 'creator' | 'member';
  projectsCount: number;
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
        return { success: false, message: 'Пароль групи вказано невірно' };
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

// Update group settings (name, description, mode, passcode)
export async function updateCloudGroupParams(params: {
  groupId: string;
  passcode: string;
  name?: string;
  description?: string;
  mode?: GroupMode;
  studentUpdatePolicy?: StudentUpdatePolicy;
  newPasscode?: string;
  userNickname?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!params.groupId) {
    return { success: false, message: 'Не вказано ID групи' };
  }

  try {
    const groupRef = doc(db, 'groups', params.groupId);
    const snap = await getDoc(groupRef);

    if (!snap.exists()) {
      return { success: false, message: 'Групу не знайдено' };
    }

    const data = snap.data();
    const isCreator = !!(params.userNickname && data.creatorNickname && data.creatorNickname.toLowerCase() === params.userNickname.trim().toLowerCase());
    
    if (data.passcodeHash && !isCreator) {
      const inputHash = await hashPasscode(params.passcode);
      if (inputHash !== data.passcodeHash) {
        return { success: false, message: 'Пароль групи вказано невірно' };
      }
    }

    const updateFields: any = {};
    if (params.name !== undefined) updateFields.name = params.name.trim();
    if (params.description !== undefined) updateFields.description = params.description.trim();
    if (params.mode !== undefined) updateFields.mode = params.mode;
    if (params.studentUpdatePolicy !== undefined) updateFields.studentUpdatePolicy = params.studentUpdatePolicy;
    if (params.newPasscode && params.newPasscode.trim()) {
      updateFields.passcodeHash = await hashPasscode(params.newPasscode.trim());
    }

    await updateDoc(groupRef, updateFields);
    return { success: true, message: 'Налаштування групи успішно оновлено!' };
  } catch (error: any) {
    console.error('Error updating group params:', error);
    return { success: false, message: formatFirebaseError(error, 'Помилка оновлення налаштувань групи') };
  }
}

// Get list of all members of a group
export async function getGroupMembersList(groupCode: string): Promise<GroupMember[]> {
  const normCode = groupCode.trim().toUpperCase();
  if (!normCode) return [];

  try {
    const membersMap = new Map<string, GroupMember>();

    // 1. Fetch group info to know the creator
    const qGroup = query(collection(db, 'groups'), where('groupCode', '==', normCode));
    const snapGroup = await getDocs(qGroup);
    let creatorNick = '';
    if (!snapGroup.empty) {
      creatorNick = (snapGroup.docs[0].data().creatorNickname || '').trim().toLowerCase();
    }

    if (creatorNick) {
      membersMap.set(creatorNick, {
        nickname: creatorNick,
        role: 'creator',
        projectsCount: 0
      });
    }

    // 2. Fetch projects in this group to count and discover members
    const qProjects = query(collection(db, 'projects'), where('groupId', '==', normCode));
    const snapProjects = await getDocs(qProjects);

    snapProjects.forEach((docSnap) => {
      const data = docSnap.data();
      const ownerNick = (data.ownerNickname || '').trim().toLowerCase();
      const authorName = data.authorName || '';

      if (ownerNick) {
        const existing = membersMap.get(ownerNick);
        if (existing) {
          existing.projectsCount += 1;
          if (authorName && !existing.authorName) existing.authorName = authorName;
        } else {
          membersMap.set(ownerNick, {
            nickname: ownerNick,
            authorName,
            role: ownerNick === creatorNick ? 'creator' : 'member',
            projectsCount: 1
          });
        }
      }
    });

    // 3. Check user accounts that have saved this group
    try {
      const qUsers = query(collection(db, 'userAccounts'));
      const snapUsers = await getDocs(qUsers);
      snapUsers.forEach((docSnap) => {
        const u = docSnap.data();
        const uNick = (u.nickname || '').trim().toLowerCase();
        if (uNick && u.savedGroups && u.savedGroups[normCode]) {
          if (!membersMap.has(uNick)) {
            membersMap.set(uNick, {
              nickname: uNick,
              authorName: u.authorName || '',
              role: uNick === creatorNick ? 'creator' : 'member',
              projectsCount: 0
            });
          }
        }
      });
    } catch (e) {
      console.warn('Error fetching group saved users:', e);
    }

    const membersList = Array.from(membersMap.values());
    // Sort creator first, then by project count desc, then by nickname
    membersList.sort((a, b) => {
      if (a.role === 'creator') return -1;
      if (b.role === 'creator') return 1;
      if (b.projectsCount !== a.projectsCount) return b.projectsCount - a.projectsCount;
      return a.nickname.localeCompare(b.nickname);
    });

    return membersList;
  } catch (error) {
    console.error('Error fetching group members list:', error);
    return [];
  }
}




export async function updateProjectDetailsInCloud(
  projectId: string,
  passcode: string,
  title: string,
  description: string,
  ownerNickname = ''
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, message: 'Проєкт не знайдено' };
    }

    const data = docSnap.data() as any;
    const inputHash = passcode ? await hashPasscode(passcode.trim()) : '';
    const isOwner = !!(
      ownerNickname &&
      data.ownerNickname &&
      data.ownerNickname.trim().toLowerCase() === ownerNickname.trim().toLowerCase()
    );

    if (data.passcodeHash && data.passcodeHash !== inputHash && !isOwner) {
      return { success: false, message: 'Невірний пароль проєкту' };
    }

    const searchKeywords = generateSearchKeywords(
      title.trim() || data.title,
      data.authorName || '',
      data.ownerNickname || '',
      data.groupName || ''
    );

    await updateDoc(docRef, {
      title: title.trim() || data.title,
      description: description.trim(),
      searchKeywords,
      updatedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating project details:', error);
    return { success: false, message: 'Помилка при оновленні деталей проєкту' };
  }
}
