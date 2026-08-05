import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons';
import { VeretkaLoader } from './VeretkaLoader';
import { generateSvg } from '../lib/exportUtils';
import { 
  getPublicProjectsPaginated, 
  getPersonalProjects, 
  getGroupProjects, 
  publishProjectToCloud, 
  updateProjectVisibility, 
  deleteProjectFromCloud, 
  createCloudGroup, 
  verifyAndGetGroup, 
  CloudProject, 
  CloudGroup, 
  ProjectVisibility 
} from '../lib/firebase';

interface ProjectCardPreviewProps {
  projectData: string;
  title: string;
  onOpenLargePreview?: () => void;
  interactive?: boolean;
}

const VeretkaLogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="342 42 615 610" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M0 377 167.354 0 382 0 214.646 377Z" fill="#818cf8" transform="matrix(-1 -8.74228e-08 -8.74228e-08 1 745 274)"/>
    <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#a7f3d0" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 566.02 303.751)"/>
    <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#a7f3d0" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 518.456 303.751)"/>
    <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#a7f3d0" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 470.892 303.751)"/>
    <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#a7f3d0" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 423.328 303.751)"/>
    <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#a7f3d0" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 375.764 303.751)"/>
    <path d="M719.154 224 935 224 745.846 651 530 651Z" fill="#FFC000"/>
    <path d="M718.88 224 936 224 745.774 651C740.758 520.059 718.505 482.011 660 355.825Z" fill="#38bdf8"/>
    <path d="M736.193 243.192C733.561 249.104 726.635 251.762 720.724 249.13L720.724 249.13C714.812 246.498 712.154 239.572 714.786 233.661L741.966 172.613C744.598 166.702 751.524 164.043 757.435 166.675L757.435 166.675C763.346 169.307 766.005 176.233 763.373 182.145Z" fill="#38bdf8"/>
    <path d="M784.072 243.192C781.44 249.104 774.514 251.762 768.603 249.13L768.603 249.13C762.691 246.498 760.033 239.572 762.665 233.661L789.845 172.613C792.477 166.702 799.403 164.043 805.314 166.675L805.314 166.675C811.226 169.307 813.884 176.233 811.252 182.145Z" fill="#38bdf8"/>
    <path d="M831.951 243.192C829.319 249.104 822.393 251.762 816.482 249.13L816.482 249.13C810.571 246.498 807.912 239.572 810.544 233.661L837.724 172.613C840.356 166.702 847.282 164.043 853.193 166.675L853.193 166.675C859.105 169.307 861.763 176.233 859.131 182.145Z" fill="#38bdf8"/>
    <path d="M879.83 243.192C877.198 249.104 870.273 251.762 864.361 249.13L864.361 249.13C858.45 246.498 855.791 239.572 858.423 233.661L885.603 172.613C888.235 166.702 895.161 164.043 901.073 166.675L901.072 166.675C906.984 169.307 909.642 176.233 907.01 182.145Z" fill="#38bdf8"/>
    <path d="M927.71 243.192C925.078 249.104 918.152 251.762 912.24 249.13L912.24 249.13C906.329 246.498 903.67 239.573 906.302 233.661L933.483 172.613C936.115 166.702 943.04 164.043 948.952 166.675L948.952 166.675C954.863 169.307 957.522 176.233 954.89 182.145Z" fill="#38bdf8"/>
    <path d="M0.955665-6.59781 395.318 50.5239 393.407 63.7195-0.955665 6.59781ZM-4.77833 32.9891C-22.9977 30.3501-35.6281 13.441-32.9891-4.77833-30.3501-22.9977-13.441-35.6281 4.77833-32.9891 22.9977-30.3501 35.6281-13.441 32.9891 4.77833 30.3501 22.9977 13.441 35.6281-4.77833 32.9891ZM399.141 24.1326C417.36 26.7716 429.99 43.6806 427.351 61.9 424.712 80.1194 407.803 92.7497 389.584 90.1107 371.365 87.4717 358.734 70.5627 361.373 52.3434 364.012 34.124 380.921 21.4936 399.141 24.1326Z" fill="#38bdf8" transform="matrix(1 0 0 -1 434.5 133.622)"/>
    <path d="M220.27 30.5573C192.814 23.3587 144.253-8.25427 80.72 2.04285 17.1869 12.34-0.996792 71.4324 0.0414646 89.5092 1.07972 107.586 6.28948 135.309 15.8645 153.298 30.0006 179.858 56.4739 190.887 78.0564 183.531 99.6389 176.175 105.088 139.242 86.2557 123.988 67.423 108.734 38.8872 120.07 32.6043 134.374 26.3214 148.678 31.1916 168.911 48.5587 209.813 62.0437 243.951 85.9893 284.104 71.4443 348.273" stroke="#38bdf8" strokeWidth="5.33333" strokeMiterlimit="8" fill="none" transform="matrix(-0.944285 0.329128 0.329128 0.944285 627.56 27.8097)"/>
  </svg>
);

const ProjectCardPreview: React.FC<ProjectCardPreviewProps> = ({ 
  projectData, 
  title, 
  onOpenLargePreview,
  interactive = true 
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectData) return;
    try {
      const parsed = JSON.parse(projectData);
      if (parsed.thumbnail) {
        setThumbUrl(parsed.thumbnail);
        return;
      }
      const shapes = parsed.shapes || (Array.isArray(parsed) ? parsed : []);
      if (shapes && shapes.length > 0) {
        const w = parsed.canvasSettings?.width || 800;
        const h = parsed.canvasSettings?.height || 600;
        const bg = parsed.canvasSettings?.bgColor || '#ffffff';
        const svgStr = generateSvg(shapes, w, h, bg);
        const encoded = unescape(encodeURIComponent(svgStr));
        setThumbUrl(`data:image/svg+xml;base64,${btoa(encoded)}`);
      }
    } catch (e) {
      console.error('Error generating thumbnail:', e);
    }
  }, [projectData]);

  return (
    <div
      onClick={interactive ? onOpenLargePreview : undefined}
      className={`relative w-full h-44 bg-slate-950 rounded-xl overflow-hidden border border-gray-800 mb-3 flex items-center justify-center p-2 transition-all shrink-0 select-none group ${
        interactive
          ? 'cursor-pointer hover:border-indigo-500/80 hover:shadow-lg hover:shadow-indigo-500/20'
          : ''
      }`}
      title={interactive ? "Натисніть для збільшеного модального перегляду" : title}
    >
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }}
      />

      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={title}
          className="w-full h-full object-contain relative z-10 transition-transform duration-300 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="text-gray-500 text-xs text-center z-10 flex flex-col items-center gap-1">
          <span className="text-2xl">🖼️</span>
          <span>Без зображення</span>
        </div>
      )}

      {interactive && (
        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
          <span className="text-[10px] text-indigo-200 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium shadow-sm">
            🔍 Натисніть для розгортання
          </span>
        </div>
      )}
    </div>
  );
};

const ProjectLargePreviewModal: React.FC<{
  project: CloudProject | null;
  onClose: () => void;
  onLoadProject: (data: string, name: string) => void;
  onShare: (project: CloudProject) => void;
}> = ({ project, onClose, onLoadProject, onShare }) => {
  const [largeThumbUrl, setLargeThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!project || !project.projectData) return;
    try {
      const parsed = JSON.parse(project.projectData);
      if (parsed.thumbnail) {
        setLargeThumbUrl(parsed.thumbnail);
        return;
      }
      const shapes = parsed.shapes || (Array.isArray(parsed) ? parsed : []);
      if (shapes && shapes.length > 0) {
        const w = parsed.canvasSettings?.width || 800;
        const h = parsed.canvasSettings?.height || 600;
        const bg = parsed.canvasSettings?.bgColor || '#ffffff';
        const svgStr = generateSvg(shapes, w, h, bg);
        const encoded = unescape(encodeURIComponent(svgStr));
        setLargeThumbUrl(`data:image/svg+xml;base64,${btoa(encoded)}`);
      }
    } catch (e) {
      console.error('Error generating large preview:', e);
    }
  }, [project]);

  if (!project) return null;

  return (
    <div 
      className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--bg-secondary,#1e1e2e)] text-[var(--text-primary,#ffffff)] p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-3xl w-full space-y-4 relative shadow-2xl overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors z-10"
          title="Закрити"
        >
          <XIcon size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30 shrink-0">
            🎨
          </div>
          <div>
            <h3 className="font-bold text-lg text-[var(--text-primary)]">{project.title}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Автор: <span className="text-[var(--text-secondary)]">{project.authorName}</span> (@{project.ownerNickname}) • Об'єктів: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{project.shapesCount}</span>
            </p>
          </div>
        </div>

        <div className="w-full h-[360px] sm:h-[420px] bg-slate-950 rounded-xl border border-gray-800 p-3 flex items-center justify-center relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />
          {largeThumbUrl ? (
            <img
              src={largeThumbUrl}
              alt={project.title}
              className="w-full h-full object-contain relative z-10 drop-shadow-xl"
            />
          ) : (
            <div className="text-gray-500 text-sm z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">🖼️</span>
              <span>Не вдалося згенерувати перегляд</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
          <div className="text-xs text-[var(--text-tertiary)]">
            Створено: {new Date(project.createdAt).toLocaleDateString('uk-UA')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLoadProject(project.projectData, project.title);
                onClose();
              }}
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              🚀 Відкрити в редакторі
            </button>
            <button
              onClick={() => onShare(project)}
              className="py-2 px-3 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1"
            >
              🔗 Поділитися
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CloudGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (projectDataStr: string, projectName?: string) => void;
  currentProjectShapesCount: number;
  getCurrentProjectDataStr: () => string;
  currentProjectName: string;
  initialTab?: 'public' | 'personal' | 'group' | 'publish';
}

export const CloudGalleryModal: React.FC<CloudGalleryModalProps> = ({
  isOpen,
  onClose,
  onLoadProject,
  currentProjectShapesCount,
  getCurrentProjectDataStr,
  currentProjectName,
  initialTab = 'public'
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'personal' | 'group' | 'publish'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // --- Public Gallery State ---
  const [publicProjects, setPublicProjects] = useState<CloudProject[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [publicLastVisible, setPublicLastVisible] = useState<any>(null);
  const [hasMorePublic, setHasMorePublic] = useState(true);
  const [isLoadingMorePublic, setIsLoadingMorePublic] = useState(false);

  // --- Personal Space State ---
  const [personalNickname, setPersonalNickname] = useState(() => localStorage.getItem('veretka_nickname') || '');
  const [personalPasscode, setPersonalPasscode] = useState(() => localStorage.getItem('veretka_passcode') || '');
  const [isPersonalLoggedIn, setIsPersonalLoggedIn] = useState(false);
  const [personalProjects, setPersonalProjects] = useState<CloudProject[]>([]);
  const [isLoadingPersonal, setIsLoadingPersonal] = useState(false);
  const [personalError, setPersonalError] = useState('');

  // --- Group Space State ---
  const [groupCodeInput, setGroupCodeInput] = useState(() => localStorage.getItem('veretka_group_code') || '');
  const [groupPasscodeInput, setGroupPasscodeInput] = useState(() => localStorage.getItem('veretka_group_passcode') || '');
  const [activeGroup, setActiveGroup] = useState<CloudGroup | null>(null);
  const [groupProjects, setGroupProjects] = useState<CloudProject[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPasscode, setNewGroupPasscode] = useState('');
  const [newGroupCreator, setNewGroupCreator] = useState(() => localStorage.getItem('veretka_nickname') || '');

  // --- Publish Form State ---
  const [pubTitle, setPubTitle] = useState(currentProjectName || 'Мій проєкт');
  const [pubAuthorName, setPubAuthorName] = useState(() => localStorage.getItem('veretka_author_name') || '');
  const [pubNickname, setPubNickname] = useState(() => localStorage.getItem('veretka_nickname') || '');
  const [pubPasscode, setPubPasscode] = useState(() => localStorage.getItem('veretka_passcode') || '');
  const [pubVisibility, setPubVisibility] = useState<ProjectVisibility>('public');
  const [pubGroupCode, setPubGroupCode] = useState(() => localStorage.getItem('veretka_group_code') || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatusMessage, setPublishStatusMessage] = useState('');

  // Share project modal state
  const [shareModalProject, setShareModalProject] = useState<CloudProject | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Large preview modal state
  const [largePreviewProject, setLargePreviewProject] = useState<CloudProject | null>(null);

  // Action passcodes for deleting/updating items
  const [actionPasscodeModal, setActionPasscodeModal] = useState<{
    show: boolean;
    projectId: string;
    action: 'delete' | 'make_public' | 'make_group' | 'make_private';
    targetGroupCode?: string;
  }>({ show: false, projectId: '', action: 'delete' });
  const [promptPasscode, setPromptPasscode] = useState('');

  // Sync current project name when modal opens
  useEffect(() => {
    if (currentProjectName) {
      setPubTitle(currentProjectName);
    }
  }, [currentProjectName]);

  // Load public projects when tab is selected or modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'public') {
      loadPublicProjects();
    }
  }, [isOpen, activeTab]);

  const loadPublicProjects = async () => {
    setIsLoadingPublic(true);
    setHasMorePublic(true);
    try {
      const res = await getPublicProjectsPaginated(9, null);
      setPublicProjects(res.projects);
      setPublicLastVisible(res.lastVisible);
      if (res.projects.length < 9) {
        setHasMorePublic(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPublic(false);
    }
  };

  const loadMorePublicProjects = async () => {
    if (isLoadingMorePublic || !hasMorePublic || !publicLastVisible) return;
    setIsLoadingMorePublic(true);
    try {
      const res = await getPublicProjectsPaginated(9, publicLastVisible);
      setPublicProjects((prev) => [...prev, ...res.projects]);
      setPublicLastVisible(res.lastVisible);
      if (res.projects.length < 9) {
        setHasMorePublic(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMorePublic(false);
    }
  };

  // Personal Cabinet Login & Sync
  const handlePersonalLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!personalNickname.trim() || !personalPasscode.trim()) {
      setPersonalError('Будь ласка, вкажіть нікнейм та пароль');
      return;
    }

    setPersonalError('');
    setIsLoadingPersonal(true);
    const res = await getPersonalProjects(personalNickname, personalPasscode);
    setIsLoadingPersonal(false);

    if (res.success && res.projects) {
      setIsPersonalLoggedIn(true);
      setPersonalProjects(res.projects);
      localStorage.setItem('veretka_nickname', personalNickname.trim());
      localStorage.setItem('veretka_passcode', personalPasscode.trim());
    } else {
      setPersonalError(res.message || 'Не вдалося увійти у кабінет');
    }
  };

  // Group Login
  const handleGroupLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!groupCodeInput.trim() || !groupPasscodeInput.trim()) {
      setGroupError('Вкажіть код групи та пароль');
      return;
    }

    setGroupError('');
    setIsLoadingGroup(true);
    const res = await verifyAndGetGroup(groupCodeInput, groupPasscodeInput);

    if (res.success && res.group) {
      setActiveGroup(res.group);
      localStorage.setItem('veretka_group_code', res.group.groupCode);
      localStorage.setItem('veretka_group_passcode', groupPasscodeInput.trim());

      // Fetch projects for this group
      const projs = await getGroupProjects(res.group.groupCode);
      setGroupProjects(projs);
    } else {
      setGroupError(res.message || 'Не вдалося увійти в осередку/групу');
    }
    setIsLoadingGroup(false);
  };

  // Create Group
  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupCode.trim() || !newGroupPasscode.trim()) {
      setGroupError('Заповніть назву, код та пароль для нової групи');
      return;
    }

    setGroupError('');
    setIsLoadingGroup(true);
    const res = await createCloudGroup({
      name: newGroupName,
      description: newGroupDesc,
      groupCode: newGroupCode,
      passcode: newGroupPasscode,
      creatorNickname: newGroupCreator || 'Анонім'
    });

    setIsLoadingGroup(false);
    if (res.success && res.group) {
      setIsCreatingGroup(false);
      setActiveGroup(res.group);
      setGroupCodeInput(res.group.groupCode);
      setGroupPasscodeInput(newGroupPasscode);
      localStorage.setItem('veretka_group_code', res.group.groupCode);
      localStorage.setItem('veretka_group_passcode', newGroupPasscode);

      const projs = await getGroupProjects(res.group.groupCode);
      setGroupProjects(projs);
    } else {
      setGroupError(res.message || 'Помилка створення групи');
    }
  };

  // Publish Form Handler
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim()) {
      setPublishStatusMessage('Вкажіть назву проєкту');
      return;
    }
    if (!pubNickname.trim() || !pubPasscode.trim()) {
      setPublishStatusMessage('Вкажіть ваш нікнейм та пароль для можливості керування проєкту');
      return;
    }

    const projectData = getCurrentProjectDataStr();
    if (!projectData || projectData === '[]') {
      setPublishStatusMessage('Полотно порожнє! Створіть фігури перед публікацією.');
      return;
    }

    setIsPublishing(true);
    setPublishStatusMessage('Збереження у хмару...');

    try {
      let finalGroupId = '';
      if (pubVisibility === 'group') {
        finalGroupId = pubGroupCode.trim().toUpperCase();
        if (!finalGroupId) {
          setPublishStatusMessage('Вкажіть код групи для публікації');
          setIsPublishing(false);
          return;
        }
      }

      const newDocId = await publishProjectToCloud({
        title: pubTitle,
        authorName: pubAuthorName || 'Анонім',
        ownerNickname: pubNickname,
        passcode: pubPasscode,
        visibility: pubVisibility,
        groupId: finalGroupId,
        projectData,
        shapesCount: currentProjectShapesCount
      });

      // Save credentials locally for convenience
      localStorage.setItem('veretka_author_name', pubAuthorName);
      localStorage.setItem('veretka_nickname', pubNickname);
      localStorage.setItem('veretka_passcode', pubPasscode);
      if (finalGroupId) {
        localStorage.setItem('veretka_group_code', finalGroupId);
      }

      setPublishStatusMessage('Проєкт успішно збережено в хмарі!');
      setIsPublishing(false);

      // Open share modal automatically with generated cloud link
      setShareModalProject({
        id: newDocId,
        title: pubTitle,
        authorName: pubAuthorName || 'Анонім',
        ownerNickname: pubNickname,
        passcodeHash: '',
        visibility: pubVisibility,
        groupId: finalGroupId,
        projectData,
        shapesCount: currentProjectShapesCount,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Refresh corresponding tabs
      if (pubVisibility === 'public') {
        loadPublicProjects();
        setTimeout(() => setActiveTab('public'), 800);
      } else if (pubVisibility === 'private') {
        if (isPersonalLoggedIn) {
          handlePersonalLogin();
        }
        setTimeout(() => setActiveTab('personal'), 800);
      } else if (pubVisibility === 'group') {
        if (activeGroup && activeGroup.groupCode === finalGroupId) {
          getGroupProjects(finalGroupId).then(setGroupProjects);
        }
        setTimeout(() => setActiveTab('group'), 800);
      }
    } catch (err: any) {
      setIsPublishing(false);
      setPublishStatusMessage(err.message || 'Помилка зберігання');
    }
  };

  // Handle Project Passcode Actions (Delete, Change Visibility)
  const handleConfirmAction = async () => {
    const { projectId, action, targetGroupCode } = actionPasscodeModal;
    if (!projectId || !promptPasscode.trim()) return;

    if (action === 'delete') {
      const res = await deleteProjectFromCloud(projectId, promptPasscode);
      if (res.success) {
        setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
        setPromptPasscode('');
        // Refresh
        loadPublicProjects();
        if (isPersonalLoggedIn) handlePersonalLogin();
        if (activeGroup) getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
      } else {
        alert(res.message || 'Невірний пароль');
      }
    } else if (action === 'make_public') {
      const res = await updateProjectVisibility(projectId, promptPasscode, 'public');
      if (res.success) {
        setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
        setPromptPasscode('');
        loadPublicProjects();
        if (isPersonalLoggedIn) handlePersonalLogin();
      } else {
        alert(res.message || 'Невірний пароль');
      }
    } else if (action === 'make_group') {
      const code = targetGroupCode || prompt('Введіть код групи / осередка:');
      if (!code) return;
      const res = await updateProjectVisibility(projectId, promptPasscode, 'group', code.toUpperCase());
      if (res.success) {
        setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
        setPromptPasscode('');
        if (isPersonalLoggedIn) handlePersonalLogin();
        if (activeGroup) getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
      } else {
        alert(res.message || 'Невірний пароль');
      }
    } else if (action === 'make_private') {
      const res = await updateProjectVisibility(projectId, promptPasscode, 'private');
      if (res.success) {
        setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
        setPromptPasscode('');
        loadPublicProjects();
        if (isPersonalLoggedIn) handlePersonalLogin();
      } else {
        alert(res.message || 'Невірний пароль');
      }
    }
  };

  // Global ESC key listener to close active overlays or modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shareModalProject) {
          setShareModalProject(null);
          setCopiedLink(false);
        } else if (largePreviewProject) {
          setLargePreviewProject(null);
        } else if (actionPasscodeModal.show) {
          setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
          setPromptPasscode('');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shareModalProject, largePreviewProject, actionPasscodeModal.show, onClose]);

  if (!isOpen) return null;

  const filteredPublicProjects = publicProjects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ownerNickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--bg-secondary,#1e1e2e)] text-[var(--text-primary,#cdd6f4)] border border-[var(--border-color,#313244)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color,#313244)] bg-[var(--bg-primary,#11111b)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-indigo-500/30 text-white flex items-center justify-center p-1.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <VeretkaLogoIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">Сховище проєктів ВереTkа</h2>
              <p className="text-xs text-gray-400">Хмарний простір проєктів, осередків та галереї</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Закрити"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-color,#313244)] bg-[var(--bg-primary,#11111b)]/50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'public'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🌐 Загальна галерея
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'personal'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            👤 Моя особиста скриня
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'group'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🏫 Скриня гурту/осередка
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ml-auto ${
              activeTab === 'publish'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-emerald-500/80 hover:text-emerald-300'
            }`}
          >
            ☁️ Опублікувати поточний проєкт
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ==================== TAB 1: PUBLIC GALLERY ==================== */}
          {activeTab === 'public' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="🔍 Пошук за назвою, автором чи нікнеймом..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 rounded-xl bg-[var(--bg-primary,#11111b)] border border-[var(--border-color,#313244)] text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={loadPublicProjects}
                  className="px-3 py-2 rounded-xl text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
                >
                  Оновити
                </button>
              </div>

              {isLoadingPublic ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <VeretkaLoader className="w-24 h-24 mb-4" />
                  <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">Завантаження галереї...</div>
                </div>
              ) : filteredPublicProjects.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-black/20 rounded-2xl border border-dashed border-gray-700">
                  <p className="text-base font-medium">Публічних проєктів поки немає</p>
                  <p className="text-xs text-gray-500 mt-1">Опублікуйте свій проєкт першим за допомогою кнопки "Опублікувати поточний проєкт"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPublicProjects.map((proj) => (
                    <div 
                      key={proj.id} 
                      className="bg-[var(--bg-primary,#11111b)] p-4 rounded-xl border border-[var(--border-color,#313244)] hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <ProjectCardPreview
                          projectData={proj.projectData}
                          title={proj.title}
                          onOpenLargePreview={() => setLargePreviewProject(proj)}
                        />
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-base text-white truncate max-w-[200px]" title={proj.title}>
                            {proj.title}
                          </h3>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Публічний
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">
                          Автор: <span className="text-gray-200">{proj.authorName}</span> (@{proj.ownerNickname})
                        </p>
                        <p className="text-[11px] text-gray-500 mb-3">
                          Об'єктів: {proj.shapesCount} | {new Date(proj.createdAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                        <button
                          onClick={() => {
                            onLoadProject(proj.projectData, proj.title);
                            onClose();
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                          Відкрити в редакторі
                        </button>
                        <button
                          onClick={() => setShareModalProject(proj)}
                          className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                          title="Поділитися посиланням"
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => {
                            setActionPasscodeModal({
                              show: true,
                              projectId: proj.id,
                              action: 'delete'
                            });
                          }}
                          className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                          title="Видалити (потрібен пароль авторів)"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {hasMorePublic && !isLoadingPublic && publicProjects.length > 0 && (
                <div className="mt-6 flex justify-center pb-4">
                  <button
                    onClick={loadMorePublicProjects}
                    disabled={isLoadingMorePublic}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors flex items-center gap-2"
                  >
                    {isLoadingMorePublic ? (
                       <>
                         <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                         Завантаження...
                       </>
                    ) : (
                      'Завантажити ще'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: PERSONAL SPACE ==================== */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {!isPersonalLoggedIn ? (
                <div className="max-w-md mx-auto bg-[var(--bg-primary,#11111b)] p-6 rounded-2xl border border-[var(--border-color,#313244)] space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Вхід у Мою особисту скриню</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Вкажіть свій унікальний Нікнейм та Пароль, щоб переглядати та керувати власними проєктами
                    </p>
                  </div>

                  <form onSubmit={handlePersonalLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Ваш Нікнейм:</label>
                      <input
                        type="text"
                        placeholder="наприклад: petro_2026"
                        value={personalNickname}
                        onChange={(e) => setPersonalNickname(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Пароль до скрині:</label>
                      <input
                        type="password"
                        placeholder="Скретч/PIN пароль"
                        value={personalPasscode}
                        onChange={(e) => setPersonalPasscode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    {personalError && (
                      <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                        {personalError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoadingPersonal}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
                    >
                      {isLoadingPersonal ? 'Авторизація...' : 'Увійти в особисту скриню'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/30">
                    <div>
                      <p className="text-xs text-indigo-300 font-medium">Моя особиста скриня користувача:</p>
                      <h3 className="text-lg font-bold text-white">@{personalNickname}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setIsPersonalLoggedIn(false);
                        setPersonalProjects([]);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      Вийти з особистої скрині
                    </button>
                  </div>

                  {isLoadingPersonal ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <VeretkaLoader className="w-24 h-24 mb-4" />
                      <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">Оновлення скрині...</div>
                    </div>
                  ) : personalProjects.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-black/20 rounded-2xl border border-dashed border-gray-700">
                      <p className="text-base font-medium">У вашій особистій скрині ще немає збережених проєктів</p>
                      <p className="text-xs text-gray-500 mt-1">Збережіть поточний проєкт у Мою особисту скриню за допомогою вкладки "Опублікувати"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {personalProjects.map((proj) => (
                        <div 
                          key={proj.id} 
                          className="bg-[var(--bg-primary,#11111b)] p-4 rounded-xl border border-[var(--border-color,#313244)] hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <ProjectCardPreview
                              projectData={proj.projectData}
                              title={proj.title}
                              onOpenLargePreview={() => setLargePreviewProject(proj)}
                            />
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-base text-white truncate max-w-[180px]" title={proj.title}>{proj.title}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                proj.visibility === 'public'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : proj.visibility === 'group'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                              }`}>
                                {proj.visibility === 'public' ? 'Публічний' : proj.visibility === 'group' ? `Група: ${proj.groupId}` : 'Приватний'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-1">Підпис: {proj.authorName}</p>
                            <p className="text-[11px] text-gray-500 mb-3">Об'єктів: {proj.shapesCount}</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-gray-800">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  onLoadProject(proj.projectData, proj.title);
                                  onClose();
                                }}
                                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                              >
                                Відкрити в редакторі
                              </button>
                              <button
                                onClick={() => setShareModalProject(proj)}
                                className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1 shrink-0"
                                title="Поділитися посиланням"
                              >
                                🔗 Поділитися
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {proj.visibility !== 'public' && (
                                <button
                                  onClick={() => {
                                    setActionPasscodeModal({
                                      show: true,
                                      projectId: proj.id,
                                      action: 'make_public'
                                    });
                                  }}
                                  className="flex-1 py-1 px-2 rounded text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors"
                                >
                                  🌐 У галерею
                                </button>
                              )}

                              {proj.visibility !== 'group' && (
                                <button
                                  onClick={() => {
                                    const code = prompt('Введіть Код групи / осередка:');
                                    if (code) {
                                      setActionPasscodeModal({
                                        show: true,
                                        projectId: proj.id,
                                        action: 'make_group',
                                        targetGroupCode: code
                                      });
                                    }
                                  }}
                                  className="flex-1 py-1 px-2 rounded text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors"
                                >
                                  🏫 В групу
                                </button>
                              )}

                              {proj.visibility !== 'private' && (
                                <button
                                  onClick={() => {
                                    setActionPasscodeModal({
                                      show: true,
                                      projectId: proj.id,
                                      action: 'make_private'
                                    });
                                  }}
                                  className="flex-1 py-1 px-2 rounded text-[11px] bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20 transition-colors"
                                >
                                  🔒 Приватизувати
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActionPasscodeModal({
                                    show: true,
                                    projectId: proj.id,
                                    action: 'delete'
                                  });
                                }}
                                className="py-1 px-2 rounded text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                                title="Видалити"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: GROUP HUB ==================== */}
          {activeTab === 'group' && (
            <div className="space-y-6">
              {!activeGroup ? (
                <div className="max-w-md mx-auto bg-[var(--bg-primary,#11111b)] p-6 rounded-2xl border border-[var(--border-color,#313244)] space-y-4">
                  <div className="flex rounded-xl bg-black/40 p-1 border border-gray-800">
                    <button
                      onClick={() => setIsCreatingGroup(false)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        !isCreatingGroup ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Увійти в Скриню гурту/осередка
                    </button>
                    <button
                      onClick={() => setIsCreatingGroup(true)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isCreatingGroup ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Створити новий гурт/осередок
                    </button>
                  </div>

                  {!isCreatingGroup ? (
                    <form onSubmit={handleGroupLogin} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Код гурту / осередка:</label>
                        <input
                          type="text"
                          placeholder="наприклад: HUB-CLASS8A"
                          value={groupCodeInput}
                          onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 uppercase"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Пароль доступу до гурту:</label>
                        <input
                          type="password"
                          placeholder="Пароль гурту"
                          value={groupPasscodeInput}
                          onChange={(e) => setGroupPasscodeInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      {groupError && (
                        <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          {groupError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoadingGroup}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
                      >
                        {isLoadingGroup ? 'Перевірка...' : 'Увійти в скриню гурту'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleCreateGroupSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Назва гурту / осередка:</label>
                        <input
                          type="text"
                          placeholder="наприклад: Гурток робототехніки #3"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Унікальний Код гурту (англійською):</label>
                        <input
                          type="text"
                          placeholder="наприклад: HUB-ROBOT3"
                          value={newGroupCode}
                          onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 uppercase"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Опис (опціонально):</label>
                        <input
                          type="text"
                          placeholder="Короткий опис осередка"
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Пароль гурту:</label>
                        <input
                          type="password"
                          placeholder="Пароль для учасників"
                          value={newGroupPasscode}
                          onChange={(e) => setNewGroupPasscode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Ваш нікнейм (засновник):</label>
                        <input
                          type="text"
                          placeholder="Ваш нікнейм"
                          value={newGroupCreator}
                          onChange={(e) => setNewGroupCreator(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {groupError && (
                        <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          {groupError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoadingGroup}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
                      >
                        {isLoadingGroup ? 'Створення...' : 'Створити осередок'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-amber-950/40 p-4 rounded-xl border border-amber-500/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                          {activeGroup.groupCode}
                        </span>
                        <h3 className="text-lg font-bold text-white">{activeGroup.name}</h3>
                      </div>
                      {activeGroup.description && (
                        <p className="text-xs text-gray-300 mt-1">{activeGroup.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveGroup(null)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                      Вийти з гурту
                    </button>
                  </div>

                  {isLoadingGroup ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <VeretkaLoader className="w-24 h-24 mb-4" />
                      <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">Завантаження осередку...</div>
                    </div>
                  ) : groupProjects.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-black/20 rounded-2xl border border-dashed border-gray-700">
                      <p className="text-base font-medium">У цьому гурті ще немає опублікованих проєктів</p>
                      <p className="text-xs text-gray-500 mt-1">Опублікуйте свій проєкт у цей гурт через вкладку "Опублікувати"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupProjects.map((proj) => (
                        <div 
                          key={proj.id} 
                          className="bg-[var(--bg-primary,#11111b)] p-4 rounded-xl border border-[var(--border-color,#313244)] hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <ProjectCardPreview
                              projectData={proj.projectData}
                              title={proj.title}
                              onOpenLargePreview={() => setLargePreviewProject(proj)}
                            />
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-base text-white truncate max-w-[180px]" title={proj.title}>{proj.title}</h3>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                                Гурт
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-1">Автор: {proj.authorName} (@{proj.ownerNickname})</p>
                            <p className="text-[11px] text-gray-500 mb-3">Об'єктів: {proj.shapesCount}</p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                            <button
                              onClick={() => {
                                onLoadProject(proj.projectData, proj.title);
                                onClose();
                              }}
                              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                            >
                              Відкрити в редакторі
                            </button>
                            <button
                              onClick={() => setShareModalProject(proj)}
                              className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                              title="Поділитися посиланням"
                            >
                              🔗
                            </button>
                            <button
                              onClick={() => {
                                setActionPasscodeModal({
                                  show: true,
                                  projectId: proj.id,
                                  action: 'delete'
                                });
                              }}
                              className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                              title="Видалити з групи"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: PUBLISH FORM ==================== */}
          {activeTab === 'publish' && (
            <div className="max-w-xl mx-auto bg-[var(--bg-primary,#11111b)] p-6 rounded-2xl border border-[var(--border-color,#313244)] space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold">Опублікувати / Зберегти поточний проєкт</h3>
                <p className="text-xs text-gray-400 mt-1">
                  На полотні зараз: <span className="text-indigo-400 font-semibold">{currentProjectShapesCount} об'єктів</span>
                </p>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Назва проєкту:*</label>
                  <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    placeholder="наприклад: Моє сонечко"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Ім'я автора (підпис):</label>
                    <input
                      type="text"
                      value={pubAuthorName}
                      onChange={(e) => setPubAuthorName(e.target.value)}
                      placeholder="Олена К."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Ваш Нікнейм:*</label>
                    <input
                      type="text"
                      value={pubNickname}
                      onChange={(e) => setPubNickname(e.target.value)}
                      placeholder="olena_2026"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Пароль проєкту (для керування/видалення):*
                  </label>
                  <input
                    type="password"
                    value={pubPasscode}
                    onChange={(e) => setPubPasscode(e.target.value)}
                    placeholder="Придумайте пароль"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Цей пароль потрібен для підтвердження видалення або зміни статусу
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Варіант публікації / призначення:*</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPubVisibility('public')}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${
                        pubVisibility === 'public'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-gray-800 bg-black/20 text-gray-400 hover:text-white'
                      }`}
                    >
                      🌐 1) Публічно
                      <span className="block text-[10px] text-gray-500 font-normal mt-1">Доступно всім користувачам у галереї</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPubVisibility('private')}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${
                        pubVisibility === 'private'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold'
                          : 'border-gray-800 bg-black/20 text-gray-400 hover:text-white'
                      }`}
                    >
                      👤 2) Моя особиста скриня
                      <span className="block text-[10px] text-gray-500 font-normal mt-1">Тільки у вашій особистій скрині</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPubVisibility('group')}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${
                        pubVisibility === 'group'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                          : 'border-gray-800 bg-black/20 text-gray-400 hover:text-white'
                      }`}
                    >
                      🏫 3) Скриня гурту/осередка
                      <span className="block text-[10px] text-gray-500 font-normal mt-1">Доступно членам обраного осередку</span>
                    </button>
                  </div>
                </div>

                {pubVisibility === 'group' && (
                  <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
                    <label className="block text-xs font-medium text-amber-300 mb-1">Код групи / осередка:*</label>
                    <input
                      type="text"
                      value={pubGroupCode}
                      onChange={(e) => setPubGroupCode(e.target.value.toUpperCase())}
                      placeholder="наприклад: HUB-ROBOT3"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-amber-500/40 text-sm uppercase focus:outline-none"
                      required={pubVisibility === 'group'}
                    />
                  </div>
                )}

                {publishStatusMessage && (
                  <p className={`text-xs p-2.5 rounded-xl border ${
                    publishStatusMessage.includes('успішно')
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {publishStatusMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-900/30"
                >
                  {isPublishing ? 'Збереження...' : 'Зберегти у хмару'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Action Confirmation Modal (for entering passcode when deleting/updating) */}
        {actionPasscodeModal.show && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-sm w-full space-y-4">
              <h4 className="font-bold text-base">Підтвердження дії</h4>
              <p className="text-xs text-gray-300">
                {actionPasscodeModal.action === 'delete' ? 'Вкажіть пароль проєкту/автора для підтвердження видалення:' : 'Вкажіть пароль проєкту/автора для підтвердження:'}
              </p>
              <input
                type="password"
                placeholder="Введіть пароль"
                value={promptPasscode}
                onChange={(e) => setPromptPasscode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
                    setPromptPasscode('');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-500 font-medium"
                >
                  Підтвердити
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Project Overlay Modal */}
        {shareModalProject && (
          <div 
            onClick={() => {
              setShareModalProject(null);
              setCopiedLink(false);
            }}
            className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-secondary,#1e1e2e)] text-[var(--text-primary,#ffffff)] p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 relative shadow-2xl overflow-hidden cursor-default"
            >
              <button
                onClick={() => {
                  setShareModalProject(null);
                  setCopiedLink(false);
                }}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors z-10"
                title="Закрити"
              >
                <XIcon size={20} />
              </button>

              {/* Branding Header & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-indigo-500/30 text-white flex items-center justify-center p-1.5 shadow-lg shadow-indigo-500/20 shrink-0">
                  <VeretkaLogoIcon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[var(--text-primary)]">Поділитися проєктом</h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                      ВереTkа
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[260px]">
                    "{shareModalProject.title}" ({shareModalProject.authorName})
                  </p>
                </div>
              </div>

              {/* Thumbnail Preview Card with Branding */}
              <div className="relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] px-2 py-1 mb-1 border-b border-[var(--border-color)]">
                  <span className="font-medium text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
                    🎨 Векторний проєкт ВереTkа
                  </span>
                  <span>Об'єктів: <strong className="text-[var(--text-primary)]">{shareModalProject.shapesCount}</strong></span>
                </div>
                <ProjectCardPreview
                  projectData={shareModalProject.projectData}
                  title={shareModalProject.title}
                  allowClickModal={false}
                />
              </div>

              {/* Direct Link Input */}
              <div className="space-y-1.5">
                <label className="block text-xs text-[var(--text-secondary)] font-semibold">Пряме посилання на проєкт:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] select-all focus:outline-none font-mono focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`;
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0 shadow-md shadow-indigo-600/30"
                  >
                    {copiedLink ? '✓ Скопійовано' : '📋 Скопіювати'}
                  </button>
                </div>
              </div>

              {/* Sharing Destinations */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
                <label className="block text-xs text-[var(--text-secondary)] font-semibold">Поділитися в соціальних мережах та месенджерах:</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&text=${encodeURIComponent(`Перегляньте мій векторний проєкт "${shareModalProject.title}" у Веретці!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>

                  {/* Viber */}
                  <a
                    href={`viber://forward?text=${encodeURIComponent(`Проєкт "${shareModalProject.title}" у Веретці: ${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#7360f2] hover:bg-[#5e4bd8] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M19.385 1.77C15.176-.328 8.795-.333 4.58.106 1.758.4 0 2.505 0 5.405v8.13c0 2.871 1.742 4.978 4.542 5.275 1.05.111 2.112.164 3.178.164.218 0 .432-.008.647-.024l.086 2.653a1.442 1.442 0 0 0 2.37 1.042l3.414-3.111c1.782-.047 3.522-.387 5.148-1.01 2.801-1.071 4.615-3.41 4.615-6.505V5.405c0-2.072-1.253-3.023-4.615-3.635zm3.115 11.765c0 2.322-1.365 4.077-3.468 4.881-1.464.561-3.031.866-4.636.908l-3.23 2.943-.075-2.316a.72.72 0 0 0-.712-.698c-1.096.012-2.192-.041-3.282-.157-2.1-.223-3.412-1.799-3.412-3.951V5.405c0-2.176 1.32-3.75 3.412-3.971 3.821-.398 9.619-.398 13.441 0 2.094.217 3.462 1.051 3.462 3.971v8.13z"/>
                    </svg>
                    Viber
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Проєкт "${shareModalProject.title}" у Веретці: ${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                    WhatsApp
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>

                  {/* Messenger */}
                  <a
                    href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#0084FF] hover:bg-[#0073e6] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.888-3.26-6.559 6.963z"/>
                    </svg>
                    Messenger
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&text=${encodeURIComponent(`Перегляньте мій векторний проєкт "${shareModalProject.title}" у Веретці!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white border border-slate-700 text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#08529c] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.62 1.62 0 1 0 .01 3.24 1.62 1.62 0 0 0-.01-3.24z"/>
                    </svg>
                    LinkedIn
                  </a>

                  {/* Pinterest */}
                  <a
                    href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&description=${encodeURIComponent(`Векторний проєкт "${shareModalProject.title}" у Веретці`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-[#E60023] hover:bg-[#cc001f] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z"/>
                    </svg>
                    Pinterest
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Проєкт "${shareModalProject.title}" у Веретці`)}&body=${encodeURIComponent(`Привіт! Переглянь мій проєкт "${shareModalProject.title}" у Веретці за посиланням:\n\n${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    className="flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Large Image Preview Modal */}
        {largePreviewProject && (
          <ProjectLargePreviewModal
            project={largePreviewProject}
            onClose={() => setLargePreviewProject(null)}
            onLoadProject={(data, title) => {
              onLoadProject(data, title);
              setLargePreviewProject(null);
              onClose();
            }}
            onShare={(proj) => {
              setShareModalProject(proj);
            }}
          />
        )}

      </div>
    </div>
  );
};
