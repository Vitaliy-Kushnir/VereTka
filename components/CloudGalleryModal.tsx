import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XIcon, EyeIcon, EyeOffIcon } from './icons';
import { VeretkaLoader } from './VeretkaLoader';
import { generateSvg } from '../lib/exportUtils';
import { 
  getPublicProjectsPaginated, 
  searchPublicProjects,
  getPersonalProjects, 
  getGroupProjects, 
  publishProjectToCloud, 
  updateProjectVisibility,
  updateProjectContentInCloud,
  updateProjectDetailsInCloud,
  copyProjectToGroup,
  deleteProjectFromCloud, 
  createCloudGroup, 
  verifyAndGetGroup, 
  registerUserAccount,
  checkNicknameExists,
  loginUserAccount,
  signInWithGoogleAccount,
  recoverAccountByEmail,
  getUserAccountProfile,
  updateUserAccountProfile,
  saveGroupPasscodeToAccount,
  deleteUserAccount,
  deleteCloudGroup,
  updateCloudGroupParams,
  getGroupMembersList,
  getUserGroups,
  getGroupInfoByCode,
  checkGroupProjectDuplicate,
  CloudProject, 
  CloudGroup, 
  ProjectVisibility,
  GroupMode,
  StudentUpdatePolicy,
  GroupMember
} from '../lib/firebase';

export type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'shapes_desc' | 'shapes_asc';
export type ShapesFilterOption = 'all' | 'small' | 'medium' | 'large';
export type VisibilityFilterOption = 'all' | 'public' | 'private' | 'group';

function filterAndSortProjects(
  projects: CloudProject[],
  query: string,
  visFilter: VisibilityFilterOption,
  shFilter: ShapesFilterOption,
  sort: SortOption
): CloudProject[] {
  let list = [...projects];

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.authorName || '').toLowerCase().includes(q) ||
      (p.ownerNickname || '').toLowerCase().includes(q) ||
      (p.groupName && p.groupName.toLowerCase().includes(q))
    );
  }

  if (visFilter !== 'all') {
    if (visFilter === 'group') {
      list = list.filter((p) => p.visibility === 'group' || (p.sentToGroups && p.sentToGroups.length > 0) || !!p.groupId);
    } else {
      list = list.filter((p) => p.visibility === visFilter);
    }
  }

  if (shFilter === 'small') {
    list = list.filter((p) => (p.shapesCount || 0) <= 10);
  } else if (shFilter === 'medium') {
    list = list.filter((p) => (p.shapesCount || 0) > 10 && (p.shapesCount || 0) <= 50);
  } else if (shFilter === 'large') {
    list = list.filter((p) => (p.shapesCount || 0) > 50);
  }

  list.sort((a, b) => {
    switch (sort) {
      case 'newest':
        return (b.createdAt || 0) - (a.createdAt || 0);
      case 'oldest':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '', 'uk');
      case 'title_desc':
        return (b.title || '').localeCompare(a.title || '', 'uk');
      case 'shapes_desc':
        return (b.shapesCount || 0) - (a.shapesCount || 0);
      case 'shapes_asc':
        return (a.shapesCount || 0) - (b.shapesCount || 0);
      default:
        return 0;
    }
  });

  return list;
}

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  sortBy: SortOption;
  onSortChange: (val: SortOption) => void;
  shapesFilter: ShapesFilterOption;
  onShapesFilterChange: (val: ShapesFilterOption) => void;
  visibilityFilter?: VisibilityFilterOption;
  onVisibilityFilterChange?: (val: VisibilityFilterOption) => void;
  showVisibilityFilter?: boolean;
  onRefresh?: () => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters?: () => void;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = '🔍 Пошук за назвою, автором...',
  sortBy,
  onSortChange,
  shapesFilter,
  onShapesFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  showVisibilityFilter = false,
  onRefresh,
  totalCount,
  filteredCount,
  onResetFilters
}) => {
  const isFiltered =
    searchQuery.trim() !== '' ||
    shapesFilter !== 'all' ||
    (showVisibilityFilter && visibilityFilter !== 'all') ||
    sortBy !== 'newest';

  return (
    <div className="bg-[var(--bg-primary,#11111b)] p-3 rounded-2xl border border-[var(--border-color,#313244)] space-y-3">
      {/* Top Row: Full width Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-black/40 border border-gray-700/80 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 transition-colors"
        />
        <span className="absolute left-3 top-3 text-xs text-gray-400 pointer-events-none">🔍</span>
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-3 text-xs text-gray-400 hover:text-white transition-colors"
            title="Очистити пошук"
          >
            ✕
          </button>
        )}
      </div>

      {/* Second Row: Filters Group */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-gray-700/80 text-xs">
            <span className="text-gray-400 font-medium whitespace-nowrap">Сортування:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs font-medium"
            >
              <option value="newest" className="bg-gray-900 text-white">🕒 Новіші спочатку</option>
              <option value="oldest" className="bg-gray-900 text-white">⌛ Старіші спочатку</option>
              <option value="title_asc" className="bg-gray-900 text-white">🔤 Назва (А - Я)</option>
              <option value="title_desc" className="bg-gray-900 text-white">🔠 Назва (Я - А)</option>
              <option value="shapes_desc" className="bg-gray-900 text-white">🧩 Більше об'єктів</option>
              <option value="shapes_asc" className="bg-gray-900 text-white">🎯 Менше об'єктів</option>
            </select>
          </div>

          {/* Shapes Count Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-gray-700/80 text-xs">
            <span className="text-gray-400 font-medium whitespace-nowrap">Об'єкти:</span>
            <select
              value={shapesFilter}
              onChange={(e) => onShapesFilterChange(e.target.value as ShapesFilterOption)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs font-medium"
            >
              <option value="all" className="bg-gray-900 text-white">📊 Усі розміри</option>
              <option value="small" className="bg-gray-900 text-white">🟢 Прості (1–10)</option>
              <option value="medium" className="bg-gray-900 text-white">🟡 Середні (11–50)</option>
              <option value="large" className="bg-gray-900 text-white">🔴 Складні (50+)</option>
            </select>
          </div>

          {/* Visibility Filter (if enabled) */}
          {showVisibilityFilter && onVisibilityFilterChange && (
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-gray-700/80 text-xs">
              <span className="text-gray-400 font-medium whitespace-nowrap">Тип:</span>
              <select
                value={visibilityFilter}
                onChange={(e) => onVisibilityFilterChange(e.target.value as VisibilityFilterOption)}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="all" className="bg-gray-900 text-white">👁️ Усі типи</option>
                <option value="public" className="bg-gray-900 text-white">🌐 Публічні</option>
                <option value="private" className="bg-gray-900 text-white">🔒 Приватні</option>
                <option value="group" className="bg-gray-900 text-white">🏫 Для груп</option>
              </select>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors flex items-center gap-1"
              title="Оновити список"
            >
              🔄 Оновити
            </button>
          )}
        </div>
      </div>

      {/* Stats bar & Reset button */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800/60">
        <div>
          <span>Показано проєктів: <strong className="text-white">{filteredCount}</strong></span>
          {totalCount > 0 && (
            <span className="text-gray-500 ml-1">(із {totalCount})</span>
          )}
        </div>
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 underline"
          >
            ✕ Скинути всі фільтри
          </button>
        )}
      </div>
    </div>
  );
};

interface ProjectCardPreviewProps {
  projectData: string;
  title: string;
  onOpenLargePreview?: () => void;
  interactive?: boolean;
  allowClickModal?: boolean;
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
  interactive = true,
  allowClickModal = true
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const isInteractive = interactive && allowClickModal;

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
      onClick={isInteractive ? onOpenLargePreview : undefined}
      className={`relative w-full h-44 bg-slate-950 rounded-xl overflow-hidden border border-gray-800 mb-3 flex items-center justify-center p-2 transition-all shrink-0 select-none group ${
        isInteractive
          ? 'cursor-pointer hover:border-indigo-500/80 hover:shadow-lg hover:shadow-indigo-500/20'
          : ''
      }`}
      title={isInteractive ? "Натисніть для збільшеного модального перегляду" : title}
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
          className={`w-full h-full object-contain relative z-10 transition-transform duration-300 ease-out ${
            isInteractive ? 'group-hover:scale-110' : ''
          }`}
        />
      ) : (
        <div className="text-gray-500 text-xs text-center z-10 flex flex-col items-center gap-1">
          <span className="text-2xl">🖼️</span>
          <span>Без зображення</span>
        </div>
      )}

      {isInteractive && (
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
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const togglePassword = (key: string) => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!showAccountDropdown) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showAccountDropdown]);

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
  const [personalAuthMode, setPersonalAuthMode] = useState<'login' | 'register'>('login');

  // Personal Registration State
  const [regNickname, setRegNickname] = useState('');
  const [regAuthorName, setRegAuthorName] = useState('');
  const [regPasscode, setRegPasscode] = useState('');
  const [regConfirmPasscode, setRegConfirmPasscode] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameTaken, setNicknameTaken] = useState(false);

  // Real-time nickname check
  useEffect(() => {
    if (personalAuthMode !== 'register' || !regNickname.trim() || regNickname.trim().length < 2) {
      setNicknameTaken(false);
      setIsCheckingNickname(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingNickname(true);
      const exists = await checkNicknameExists(regNickname.trim());
      setNicknameTaken(exists);
      setIsCheckingNickname(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [regNickname, personalAuthMode]);

  // Account Recovery State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Edit Account / Profile State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [currentAccountEmail, setCurrentAccountEmail] = useState<string | null>(null);
  const [currentAccountAuthorName, setCurrentAccountAuthorName] = useState<string | null>(null);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editAuthorNameInput, setEditAuthorNameInput] = useState('');
  const [editNewPasscode, setEditNewPasscode] = useState('');
  const [editCurrentPasscode, setEditCurrentPasscode] = useState('');
  const [editProfileMessage, setEditProfileMessage] = useState('');
  const [editProfileSuccess, setEditProfileSuccess] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Account Deletion State
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deleteAccountPasscode, setDeleteAccountPasscode] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');

  // Group Deletion State
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deleteGroupPasscode, setDeleteGroupPasscode] = useState('');
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState('');

  // Load user profile when logged in
  const [savedGroupPasscodes, setSavedGroupPasscodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isPersonalLoggedIn && personalNickname) {
      getUserAccountProfile(personalNickname).then((res) => {
        if (res.success) {
          setCurrentAccountEmail(res.email || '');
          setCurrentAccountAuthorName(res.authorName || '');
          if (res.savedGroups) {
            setSavedGroupPasscodes(res.savedGroups);
          }
          if (res.authorName) {
            localStorage.setItem('veretka_author_name', res.authorName);
            setPubAuthorName(res.authorName);
          }
        }
      });
    } else {
      setSavedGroupPasscodes({});
    }
  }, [isPersonalLoggedIn, personalNickname]);

  // --- Group Space State ---
  const [groupCodeInput, setGroupCodeInput] = useState(() => localStorage.getItem('veretka_group_code') || '');
  const [groupPasscodeInput, setGroupPasscodeInput] = useState(() => localStorage.getItem('veretka_group_passcode') || '');
  const [activeGroup, setActiveGroup] = useState<CloudGroup | null>(null);
  const [groupProjects, setGroupProjects] = useState<CloudProject[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [groupError, setGroupError] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupTabSubView, setGroupTabSubView] = useState<'open' | 'my_groups' | 'create'>('open');
  const [myUserGroups, setMyUserGroups] = useState<CloudGroup[]>([]);
  const [isLoadingMyGroups, setIsLoadingMyGroups] = useState(false);

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPasscode, setNewGroupPasscode] = useState('');
  const [newGroupConfirmPasscode, setNewGroupConfirmPasscode] = useState('');
  const [newGroupCreator, setNewGroupCreator] = useState(() => localStorage.getItem('veretka_nickname') || '');
  const [newGroupMode, setNewGroupMode] = useState<'education' | 'gallery' | 'readonly'>('gallery');
  const [newGroupStudentPolicy, setNewGroupStudentPolicy] = useState<StudentUpdatePolicy>('allow_overwrite');

  // Group Settings Modal State
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupMode, setEditGroupMode] = useState<GroupMode>('gallery');
  const [editGroupStudentPolicy, setEditGroupStudentPolicy] = useState<StudentUpdatePolicy>('allow_overwrite');
  const [editGroupNewPasscode, setEditGroupNewPasscode] = useState('');
  const [isSavingGroupSettings, setIsSavingGroupSettings] = useState(false);
  const [groupSettingsMessage, setGroupSettingsMessage] = useState('');
  const [groupSettingsError, setGroupSettingsError] = useState('');
  const [copyStatusText, setCopyStatusText] = useState('');

  // Conflict Resolution Modal State
  const [groupConflictModal, setGroupConflictModal] = useState<{
    show: boolean;
    projectToCopy?: CloudProject;
    passcode: string;
    groupId: string;
    groupName: string;
    existingProject?: CloudProject;
    studentUpdatePolicy?: StudentUpdatePolicy;
    groupMode?: GroupMode;
    customTitleInput: string;
    isEditingTitle: boolean;
    nextSuggestedTitle?: string;
    existingUserTitlesInGroup?: string[];
  }>({
    show: false,
    passcode: '',
    groupId: '',
    groupName: '',
    customTitleInput: '',
    isEditingTitle: false,
    nextSuggestedTitle: '',
    existingUserTitlesInGroup: [],
  });
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Group Members Modal State
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [groupMembersList, setGroupMembersList] = useState<GroupMember[]>([]);
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = useState(false);
  const [groupMemberSearchQuery, setGroupMemberSearchQuery] = useState('');

  const handleOpenGroupMembers = async (groupCode: string) => {
    setShowGroupMembersModal(true);
    setIsLoadingGroupMembers(true);
    setGroupMemberSearchQuery('');
    const list = await getGroupMembersList(groupCode);
    setGroupMembersList(list);
    setIsLoadingGroupMembers(false);
  };

  const handleOpenGroupSettings = (group: CloudGroup) => {
    setEditGroupName(group.name || '');
    setEditGroupDesc(group.description || '');
    setEditGroupMode(group.mode || 'gallery');
    setEditGroupStudentPolicy(group.studentUpdatePolicy || 'allow_overwrite');
    setEditGroupNewPasscode('');
    setGroupSettingsMessage('');
    setGroupSettingsError('');
    setCopyStatusText('');
    setShowGroupSettingsModal(true);
  };

  const handleSaveGroupSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    if (!editGroupName.trim()) {
      setGroupSettingsError('Назва групи не може бути порожньою');
      return;
    }

    setGroupSettingsError('');
    setGroupSettingsMessage('');
    setIsSavingGroupSettings(true);

    const storedPass = savedGroupPasscodes[activeGroup.groupCode.toUpperCase()] || localStorage.getItem('veretka_group_passcode') || '';

    const res = await updateCloudGroupParams({
      groupId: activeGroup.id,
      passcode: storedPass,
      name: editGroupName,
      description: editGroupDesc,
      mode: editGroupMode,
      studentUpdatePolicy: editGroupStudentPolicy,
      newPasscode: editGroupNewPasscode,
      userNickname: isPersonalLoggedIn ? personalNickname : undefined
    });

    setIsSavingGroupSettings(false);
    if (res.success) {
      setGroupSettingsMessage(res.message);
      setActiveGroup(prev => prev ? {
        ...prev,
        name: editGroupName.trim(),
        description: editGroupDesc.trim(),
        mode: editGroupMode,
        studentUpdatePolicy: editGroupStudentPolicy
      } : null);

      if (editGroupNewPasscode.trim()) {
        localStorage.setItem('veretka_group_passcode', editGroupNewPasscode.trim());
        if (isPersonalLoggedIn && personalNickname) {
          await saveGroupPasscodeToAccount(personalNickname, activeGroup.groupCode, editGroupNewPasscode.trim());
          setSavedGroupPasscodes(prev => ({ ...prev, [activeGroup.groupCode.toUpperCase()]: editGroupNewPasscode.trim() }));
        }
      }
    } else {
      setGroupSettingsError(res.message);
    }
  };

  // --- Publish Form State ---
  const [pubTitle, setPubTitle] = useState(currentProjectName || 'Мій проєкт');
  const [pubAuthorName, setPubAuthorName] = useState(() => localStorage.getItem('veretka_author_name') || '');
  const [pubNickname, setPubNickname] = useState(() => localStorage.getItem('veretka_nickname') || '');
  const [pubPasscode, setPubPasscode] = useState(() => localStorage.getItem('veretka_passcode') || '');
  const [pubDescription, setPubDescription] = useState('');
  const [pubIsPublic, setPubIsPublic] = useState(true);
  const [pubIsGroup, setPubIsGroup] = useState(false);
  const [pubGroupCode, setPubGroupCode] = useState(() => localStorage.getItem('veretka_group_code') || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatusMessage, setPublishStatusMessage] = useState('');
  const [returnToPublishAfterLogin, setReturnToPublishAfterLogin] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [fetchedGroupInfo, setFetchedGroupInfo] = useState<CloudGroup | null>(null);

  // Share project modal state
  const [shareModalProject, setShareModalProject] = useState<CloudProject | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Large preview modal state
  const [largePreviewProject, setLargePreviewProject] = useState<CloudProject | null>(null);

  // Sent groups list modal state
  const [selectedSentGroupsProject, setSelectedSentGroupsProject] = useState<CloudProject | null>(null);
  const [sentGroupCopyStatus, setSentGroupCopyStatus] = useState<string | null>(null);

  // Action passcodes for deleting/updating items
  const [actionPasscodeModal, setActionPasscodeModal] = useState<{
    show: boolean;
    projectId: string;
    action: 'delete' | 'make_public' | 'make_group' | 'make_private';
    targetGroupCode?: string;
  }>({ show: false, projectId: '', action: 'delete' });
  const [promptPasscode, setPromptPasscode] = useState('');

  // Send to Group Modal state
  const [sendToGroupModal, setSendToGroupModal] = useState<{
    show: boolean;
    project: CloudProject | null;
  }>({ show: false, project: null });

  const [sendGroupCodeInput, setSendGroupCodeInput] = useState('');
  const [sendGroupInfo, setSendGroupInfo] = useState<CloudGroup | null>(null);
  const [isSearchingSendGroup, setIsSearchingSendGroup] = useState(false);
  const [isSendingToGroup, setIsSendingToGroup] = useState(false);
  const [sendGroupError, setSendGroupError] = useState<string | null>(null);
  const [sendGroupSuccess, setSendGroupSuccess] = useState<string | null>(null);

  const openSendToGroupModal = async (proj: CloudProject) => {
    setSendToGroupModal({ show: true, project: proj });
    setSendGroupCodeInput('');
    setSendGroupInfo(null);
    setSendGroupError(null);
    setSendGroupSuccess(null);
    if (isPersonalLoggedIn && personalNickname) {
      setIsLoadingMyGroups(true);
      const userG = await getUserGroups(personalNickname);
      setMyUserGroups(userG);
      setIsLoadingMyGroups(false);
    }
  };

  const handleSendGroupCodeChange = async (code: string) => {
    const normCode = code.toUpperCase().trim();
    setSendGroupCodeInput(normCode);
    setSendGroupError(null);
    setSendGroupSuccess(null);

    if (!normCode) {
      setSendGroupInfo(null);
      return;
    }

    if (normCode.length >= 2) {
      setIsSearchingSendGroup(true);
      const gInfo = await getGroupInfoByCode(normCode);
      setSendGroupInfo(gInfo);
      setIsSearchingSendGroup(false);
      if (!gInfo) {
        setSendGroupError(`Осередок з кодом "${normCode}" не знайдено.`);
      }
    }
  };

  const handleSelectGroupFromList = (g: CloudGroup) => {
    setSendGroupCodeInput(g.groupCode);
    setSendGroupInfo(g);
    setSendGroupError(null);
    setSendGroupSuccess(null);
  };

  const handleConfirmSendToGroup = async () => {
    if (!sendToGroupModal.project || !sendGroupCodeInput.trim()) return;
    const normCode = sendGroupCodeInput.toUpperCase().trim();

    let targetGroup = sendGroupInfo;
    if (!targetGroup) {
      setIsSearchingSendGroup(true);
      targetGroup = await getGroupInfoByCode(normCode);
      setSendGroupInfo(targetGroup);
      setIsSearchingSendGroup(false);
    }

    if (!targetGroup) {
      setSendGroupError(`Осередок з кодом "${normCode}" не знайдено.`);
      return;
    }

    const groupMode = targetGroup.mode || 'gallery';
    const groupCreator = (targetGroup.creatorNickname || '').trim().toLowerCase();
    const userNick = (personalNickname || '').trim().toLowerCase();

    if (groupMode === 'readonly' && groupCreator !== userNick) {
      setSendGroupError(`Ця група працює в режимі "Дошка шаблонів" (readonly). Тільки її засновник (@${targetGroup.creatorNickname}) може публікувати сюди роботи.`);
      return;
    }

    setIsSendingToGroup(true);
    setSendGroupError(null);

    // Pre-check for existing duplicate project in target group
    const dupCheck = await checkGroupProjectDuplicate(
      normCode,
      sendToGroupModal.project.title,
      personalNickname,
      sendToGroupModal.project.authorName || personalNickname
    );

    setIsSendingToGroup(false);

    if (dupCheck.isDuplicate && dupCheck.existingProject) {
      const suggestedTitle = dupCheck.nextSuggestedTitle || `${sendToGroupModal.project.title} (v.2)`;
      // Trigger conflict resolution modal
      setGroupConflictModal({
        show: true,
        projectToCopy: sendToGroupModal.project,
        passcode: personalPasscode,
        groupId: normCode,
        groupName: targetGroup.name || dupCheck.groupName || normCode,
        existingProject: dupCheck.existingProject,
        studentUpdatePolicy: dupCheck.studentUpdatePolicy || 'allow_overwrite',
        groupMode: dupCheck.groupMode,
        customTitleInput: suggestedTitle,
        isEditingTitle: false,
        nextSuggestedTitle: suggestedTitle,
        existingUserTitlesInGroup: dupCheck.existingUserTitlesInGroup || []
      });
      setSendToGroupModal({ show: false, project: null });
      return;
    }

    // Otherwise proceed with direct send
    setIsSendingToGroup(true);
    const res = await copyProjectToGroup(
      sendToGroupModal.project.id,
      personalPasscode,
      normCode,
      targetGroup.name || '',
      personalNickname
    );

    setIsSendingToGroup(false);

    if (res.success) {
      setSendGroupSuccess(`✓ Копію проєкту успішно надіслано в осередок "${targetGroup.name || normCode}"!`);
      
      // Update local personal projects state
      setPersonalProjects(prev => prev.map(p => {
        if (p.id === sendToGroupModal.project?.id) {
          const existingSent = p.sentToGroups || [];
          const exists = existingSent.some(g => g.groupId === normCode);
          if (!exists) {
            return {
              ...p,
              sentToGroups: [
                ...existingSent,
                { groupId: normCode, groupName: targetGroup?.name || normCode, sentAt: Date.now() }
              ]
            };
          }
        }
        return p;
      }));

      setTimeout(() => {
        setSendToGroupModal({ show: false, project: null });
        setSendGroupSuccess(null);
        setSendGroupCodeInput('');
        setSendGroupInfo(null);
        if (activeGroup) {
          getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
        }
      }, 1200);
    } else {
      setSendGroupError(res.message || 'Помилка при надсиланні проєкту у групу');
    }
  };

  const handleResolveConflictAction = async (
    action: 'overwrite' | 'new_copy' | 'custom_title',
    overrideTitle?: string
  ) => {
    if (!groupConflictModal.projectToCopy) return;

    const {
      projectToCopy,
      passcode,
      groupId,
      groupName,
      existingProject,
      nextSuggestedTitle,
      existingUserTitlesInGroup
    } = groupConflictModal;

    setConflictError(null);

    let targetTitle = projectToCopy.title;
    if (action === 'new_copy') {
      targetTitle = overrideTitle || nextSuggestedTitle || `${projectToCopy.title} (v.2)`;
    } else if (action === 'custom_title') {
      targetTitle = (overrideTitle || groupConflictModal.customTitleInput || projectToCopy.title).trim();
    } else if (action === 'overwrite' && existingProject) {
      targetTitle = existingProject.title;
    }

    // Check if targetTitle already exists in the group for this user
    if (action !== 'overwrite') {
      const isTaken = (existingUserTitlesInGroup || []).some(
        t => t.trim().toLowerCase() === targetTitle.trim().toLowerCase()
      );
      if (isTaken) {
        setConflictError(
          `Проєкт із назвою "${targetTitle}" вже існує в цьому осередку від вашого імені. Будь ласка, оберіть іншу версію (наприклад, ${nextSuggestedTitle || 'новшу'}).`
        );
        return;
      }
    }

    setIsResolvingConflict(true);

    const res = await copyProjectToGroup(
      projectToCopy.id,
      passcode,
      groupId,
      groupName,
      personalNickname,
      {
        action: action === 'overwrite' ? 'overwrite' : 'new_copy',
        existingProjectId: action === 'overwrite' ? existingProject?.id : undefined,
        targetTitle
      }
    );

    setIsResolvingConflict(false);

    if (res.success) {
      // Update local sentToGroups link
      setPersonalProjects(prev => prev.map(p => {
        if (p.id === projectToCopy.id) {
          const existingSent = p.sentToGroups || [];
          const exists = existingSent.some(g => g.groupId === groupId);
          if (!exists) {
            return {
              ...p,
              sentToGroups: [
                ...existingSent,
                { groupId: groupId, groupName: groupName || groupId, sentAt: Date.now() }
              ]
            };
          }
        }
        return p;
      }));

      setGroupConflictModal(prev => ({ ...prev, show: false }));
      if (activeGroup && activeGroup.groupCode === groupId) {
        getGroupProjects(groupId).then(setGroupProjects);
      }
    } else {
      setConflictError(res.message || 'Помилка при виконанні дії');
    }
  };
  
  // Inline Project Editing
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [isSavingProjectDetails, setIsSavingProjectDetails] = useState(false);

  const [publishConflictModal, setPublishConflictModal] = useState<{
    show: boolean;
    existingId: string;
    projectData: string;
    finalGroupId: string;
    personalVisibility: ProjectVisibility;
  } | null>(null);

  // --- Sorting & Filtering State ---
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [shapesFilter, setShapesFilter] = useState<ShapesFilterOption>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterOption>('all');
  const [personalSearchQuery, setPersonalSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const displayedPublicProjects = useMemo(() => {
    return filterAndSortProjects(publicProjects, '', 'all', shapesFilter, sortBy);
  }, [publicProjects, shapesFilter, sortBy]);

  const displayedPersonalProjects = useMemo(() => {
    return filterAndSortProjects(personalProjects, personalSearchQuery, visibilityFilter, shapesFilter, sortBy);
  }, [personalProjects, personalSearchQuery, visibilityFilter, shapesFilter, sortBy]);

  const displayedGroupProjects = useMemo(() => {
    let allowedProjects = groupProjects;

    if (activeGroup) {
      const isCreator = isPersonalLoggedIn && personalNickname === activeGroup.creatorNickname;
      if (!isCreator && activeGroup.mode === 'education') {
        allowedProjects = groupProjects.filter(p => 
          p.ownerNickname === activeGroup.creatorNickname ||
          (isPersonalLoggedIn && p.ownerNickname === personalNickname) ||
          (!isPersonalLoggedIn && p.authorName === pubAuthorName)
        );
      }
    }

    return filterAndSortProjects(allowedProjects, groupSearchQuery, 'all', shapesFilter, sortBy);
  }, [groupProjects, groupSearchQuery, shapesFilter, sortBy, activeGroup, isPersonalLoggedIn, personalNickname, pubAuthorName]);

  // Sync current project name when modal opens
  useEffect(() => {
    if (currentProjectName) {
      setPubTitle(currentProjectName);
    }
  }, [currentProjectName]);

  // Auto-fill publish fields when logged in
  useEffect(() => {
    if (isPersonalLoggedIn) {
      if (personalNickname) {
        setPubNickname(personalNickname);
      }
      if (personalPasscode) {
        setPubPasscode(personalPasscode);
      }
      const savedAuthor = localStorage.getItem('veretka_author_name');
      if (savedAuthor) {
        setPubAuthorName(savedAuthor);
      } else if (personalNickname && !pubAuthorName) {
        setPubAuthorName(personalNickname);
      }
    }
  }, [isPersonalLoggedIn, personalNickname, personalPasscode]);

  // Load group metadata when pubGroupCode changes
  useEffect(() => {
    if (pubIsGroup && pubGroupCode.trim()) {
      getGroupInfoByCode(pubGroupCode.trim()).then(setFetchedGroupInfo);
    } else if (!pubGroupCode.trim()) {
      setFetchedGroupInfo(null);
    }
  }, [pubIsGroup, pubGroupCode]);

  // Load public projects when tab is selected, modal opens, or searchQuery changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'public') return;

    const timer = setTimeout(() => {
      loadPublicProjects(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, searchQuery]);

  const loadPublicProjects = async (queryStr = searchQuery) => {
    setIsLoadingPublic(true);
    setHasMorePublic(true);
    try {
      const res = queryStr.trim()
        ? await searchPublicProjects(queryStr, 12, null)
        : await getPublicProjectsPaginated(12, null);
      setPublicProjects(res.projects);
      setPublicLastVisible(res.lastVisible);
      if (res.projects.length < 12) {
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
      const res = searchQuery.trim()
        ? await searchPublicProjects(searchQuery, 12, publicLastVisible)
        : await getPublicProjectsPaginated(12, publicLastVisible);
      setPublicProjects((prev) => [...prev, ...res.projects]);
      setPublicLastVisible(res.lastVisible);
      if (res.projects.length < 12) {
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
      setPersonalError('Будь ласка, вкажіть Нікнейм та Пароль');
      return;
    }

    setPersonalError('');
    setIsLoadingPersonal(true);
    const res = await loginUserAccount(personalNickname, personalPasscode);
    setIsLoadingPersonal(false);

    if (res.success && res.projects) {
      const activeNick = res.nickname || personalNickname.trim();
      setIsPersonalLoggedIn(true);
      setPersonalNickname(activeNick);
      setPersonalProjects(res.projects);
      localStorage.setItem('veretka_nickname', activeNick);
      localStorage.setItem('veretka_passcode', personalPasscode.trim());

      if (returnToPublishAfterLogin) {
        setReturnToPublishAfterLogin(false);
        setActiveTab('publish');
      }
    } else {
      setPersonalError(res.message || 'Не вдалося відкрити особисту скриню');
    }
  };

  // Personal Cabinet Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNickname.trim()) {
      setPersonalError('Будь ласка, вкажіть Нікнейм (Логін)');
      return;
    }
    if (nicknameTaken) {
      setPersonalError('Такий Нікнейм вже зайнятий у спільноті. Будь ласка, оберіть інший.');
      return;
    }
    if (!regPasscode.trim()) {
      setPersonalError('Будь ласка, вкажіть пароль до скрині');
      return;
    }
    if (regPasscode !== regConfirmPasscode) {
      setPersonalError('Введені паролі не збігаються. Будь ласка, перевірте написання.');
      return;
    }

    setPersonalError('');
    setIsLoadingPersonal(true);
    const res = await registerUserAccount({
      nickname: regNickname.trim(),
      authorName: regAuthorName.trim(),
      passcode: regPasscode.trim(),
      email: regEmail.trim(),
    });

    if (res.success && res.nickname) {
      setPersonalNickname(res.nickname);
      setPersonalPasscode(regPasscode.trim());
      localStorage.setItem('veretka_nickname', res.nickname);
      localStorage.setItem('veretka_passcode', regPasscode.trim());
      if (regAuthorName.trim()) {
        localStorage.setItem('veretka_author_name', regAuthorName.trim());
      }

      const pRes = await getPersonalProjects(res.nickname, regPasscode.trim());
      setPersonalProjects(pRes.projects || []);
      setIsPersonalLoggedIn(true);

      if (returnToPublishAfterLogin) {
        setReturnToPublishAfterLogin(false);
        setActiveTab('publish');
      }
    } else {
      setPersonalError(res.message || 'Не вдалося створити скриню');
    }
    setIsLoadingPersonal(false);
  };

  // Google Sign-In / Register Handler
  const handleGoogleSignIn = async () => {
    setPersonalError('');
    setIsLoadingPersonal(true);

    if (personalAuthMode === 'register') {
      let passcodeToUse = regPasscode.trim();
      if (!passcodeToUse) {
        const promptPass = prompt('Увага: Пароль є обов’язковим для захисту вашої скрині!\nБудь ласка, введіть пароль (щонайменше 3 символи):');
        if (!promptPass || promptPass.trim().length < 3) {
          setPersonalError('Для створення скрині через Google обов’язково вкажіть пароль (щонайменше 3 символи)');
          setIsLoadingPersonal(false);
          return;
        }
        passcodeToUse = promptPass.trim();
        setRegPasscode(passcodeToUse);
      }

      const res = await signInWithGoogleAccount(regNickname.trim(), passcodeToUse);
      setIsLoadingPersonal(false);

      if (res.success && res.nickname) {
        setIsPersonalLoggedIn(true);
        setPersonalNickname(res.nickname);
        setPersonalPasscode(res.passcode || passcodeToUse);
        setPersonalProjects(res.projects || []);
        localStorage.setItem('veretka_nickname', res.nickname);
        localStorage.setItem('veretka_passcode', res.passcode || passcodeToUse);

        if (returnToPublishAfterLogin) {
          setReturnToPublishAfterLogin(false);
          setActiveTab('publish');
        }
      } else {
        setPersonalError(res.message || 'Не вдалося створити скриню через Google');
      }
    } else {
      const res = await signInWithGoogleAccount();
      setIsLoadingPersonal(false);

      if (res.success && res.nickname) {
        setIsPersonalLoggedIn(true);
        setPersonalNickname(res.nickname);
        setPersonalProjects(res.projects || []);
        localStorage.setItem('veretka_nickname', res.nickname);
        if (res.passcode) {
          setPersonalPasscode(res.passcode);
          localStorage.setItem('veretka_passcode', res.passcode);
        }

        if (returnToPublishAfterLogin) {
          setReturnToPublishAfterLogin(false);
          setActiveTab('publish');
        }
      } else {
        setPersonalError(res.message || 'Не вдалося увійти через Google');
      }
    }
  };

  // Account Recovery Handler
  const handleAccountRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryMessage('Будь ласка, вкажіть вашу електронну пошту');
      setRecoverySuccess(false);
      return;
    }

    setIsRecovering(true);
    setRecoveryMessage('');
    const res = await recoverAccountByEmail(recoveryEmail);
    setIsRecovering(false);

    setRecoverySuccess(res.success);
    setRecoveryMessage(res.message);
  };

  // Profile Edit Handler
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileMessage('');
    setIsUpdatingProfile(true);

    const res = await updateUserAccountProfile({
      nickname: personalNickname,
      authorName: editAuthorNameInput,
      currentPasscode: editCurrentPasscode || personalPasscode,
      email: editEmailInput,
      newPasscode: editNewPasscode,
    });

    setIsUpdatingProfile(false);
    setEditProfileSuccess(res.success);
    setEditProfileMessage(res.message);

    if (res.success) {
      setCurrentAccountEmail(res.email !== undefined ? res.email : editEmailInput.trim().toLowerCase());
      setCurrentAccountAuthorName(res.authorName !== undefined ? res.authorName : editAuthorNameInput.trim());
      if (res.authorName) {
        localStorage.setItem('veretka_author_name', res.authorName);
        setPubAuthorName(res.authorName);
      }
      if (editNewPasscode.trim()) {
        setPersonalPasscode(editNewPasscode.trim());
        localStorage.setItem('veretka_passcode', editNewPasscode.trim());
      }
      setEditNewPasscode('');
      setEditCurrentPasscode('');
      setShowEditProfileModal(false);
    }
  };

  // Account Deletion Handler
  const handleDeleteAccountSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDeleteAccountError('');
    setIsDeletingAccount(true);

    const res = await deleteUserAccount(personalNickname);
    setIsDeletingAccount(false);

    if (res.success) {
      setIsPersonalLoggedIn(false);
      setPersonalProjects([]);
      setPersonalNickname('');
      setCurrentAccountEmail(null);
      localStorage.removeItem('veretka_nickname');
      localStorage.removeItem('veretka_passcode');
      setShowEditProfileModal(false);
      setShowDeleteAccountConfirm(false);
      alert('Вашу особисту скриню та її проєкти успішно видалено.');
    } else {
      setDeleteAccountError(res.message);
    }
  };

  // Group Deletion Handler
  const handleDeleteGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    setDeleteGroupError('');
    setIsDeletingGroup(true);

    const res = await deleteCloudGroup(activeGroup.id, deleteGroupPasscode);
    setIsDeletingGroup(false);

    if (res.success) {
      setActiveGroup(null);
      setGroupProjects([]);
      localStorage.removeItem('veretka_group_code');
      localStorage.removeItem('veretka_group_passcode');
      setShowDeleteGroupModal(false);
      setDeleteGroupPasscode('');
      alert(`Групу "${activeGroup.name}" успішно видалено.`);
    } else {
      setDeleteGroupError(res.message);
    }
  };

  // Group Login
  const handleGroupLogin = async (e?: React.FormEvent, bypassPasscode?: string) => {
    if (e) e.preventDefault();
    
    const code = groupCodeInput.trim();
    const isCreatorBypass = isPersonalLoggedIn && personalNickname;
    let passcodeToUse = bypassPasscode || groupPasscodeInput.trim();

    if (!code) {
      setGroupError('Вкажіть код групи');
      return;
    }
    
    // If no explicit passcode and we have a saved one for this group, use it
    if (!passcodeToUse && savedGroupPasscodes[code.toUpperCase()]) {
      passcodeToUse = savedGroupPasscodes[code.toUpperCase()];
    }

    if (!passcodeToUse && !isCreatorBypass) {
      setGroupError('Вкажіть пароль');
      return;
    }

    setGroupError('');
    setIsLoadingGroup(true);
    const res = await verifyAndGetGroup(code, passcodeToUse, isPersonalLoggedIn ? personalNickname : undefined);

    if (res.success && res.group) {
      setActiveGroup(res.group);
      localStorage.setItem('veretka_group_code', res.group.groupCode);
      if (passcodeToUse) {
        localStorage.setItem('veretka_group_passcode', passcodeToUse);
        
        // Save to user account if logged in
        if (isPersonalLoggedIn && personalNickname) {
          saveGroupPasscodeToAccount(personalNickname, res.group.groupCode, passcodeToUse).then((saved) => {
             if (saved) {
               setSavedGroupPasscodes(prev => ({ ...prev, [res.group!.groupCode]: passcodeToUse }));
             }
          });
        }
      }

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
    if (newGroupPasscode !== newGroupConfirmPasscode) {
      setGroupError('Паролі не збігаються. Перевірте правильність введення.');
      return;
    }

    setGroupError('');
    setIsLoadingGroup(true);
    const res = await createCloudGroup({
      name: newGroupName,
      description: newGroupDesc,
      groupCode: newGroupCode,
      passcode: newGroupPasscode,
      creatorNickname: newGroupCreator || 'Анонім',
      mode: newGroupMode,
      studentUpdatePolicy: newGroupStudentPolicy
    });

    setIsLoadingGroup(false);
    if (res.success && res.group) {
      setIsCreatingGroup(false);
      setActiveGroup(res.group);
      setGroupCodeInput(res.group.groupCode);
      setGroupPasscodeInput(newGroupPasscode);
      localStorage.setItem('veretka_group_code', res.group.groupCode);
      localStorage.setItem('veretka_group_passcode', newGroupPasscode);
      
      if (isPersonalLoggedIn && personalNickname) {
        saveGroupPasscodeToAccount(personalNickname, res.group.groupCode, newGroupPasscode).then((saved) => {
           if (saved) {
             setSavedGroupPasscodes(prev => ({ ...prev, [res.group!.groupCode]: newGroupPasscode }));
           }
        });
      }

      const projs = await getGroupProjects(res.group.groupCode);
      setGroupProjects(projs);
    } else {
      setGroupError(res.message || 'Помилка створення групи');
    }
  };

  const executePublish = async (titleToUse: string, isUpdate: boolean, existingId?: string, projectDataStr?: string, finalGroupId?: string, personalVisibility?: ProjectVisibility) => {
    setIsPublishing(true);
    setPublishStatusMessage('Збереження у хмару...');
    
    try {
      let newDocId = existingId || '';
      
      if (isUpdate && existingId) {
        await updateProjectContentInCloud(existingId, pubPasscode || personalPasscode, projectDataStr || '', titleToUse, currentProjectShapesCount);
        if (personalVisibility) {
          await updateProjectVisibility(existingId, pubPasscode || personalPasscode, personalVisibility);
        }
      } else {
        newDocId = await publishProjectToCloud({
          title: titleToUse,
          description: pubDescription,
          authorName: pubAuthorName || personalNickname || 'Анонім',
          ownerNickname: pubNickname || personalNickname,
          passcode: pubPasscode || personalPasscode,
          visibility: personalVisibility || 'private',
          projectData: projectDataStr || '',
          shapesCount: currentProjectShapesCount
        });
      }

      if (pubIsGroup && finalGroupId) {
        await publishProjectToCloud({
          title: titleToUse,
          description: pubDescription,
          authorName: pubAuthorName || personalNickname || 'Анонім',
          ownerNickname: pubNickname || personalNickname,
          passcode: pubPasscode || personalPasscode,
          visibility: 'group',
          groupId: finalGroupId,
          projectData: projectDataStr || '',
          shapesCount: currentProjectShapesCount,
          isGroupCopy: true
        });
      }

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
        title: titleToUse,
        authorName: pubAuthorName || 'Анонім',
        ownerNickname: pubNickname,
        passcodeHash: '',
        visibility: personalVisibility || 'private',
        groupId: '',
        projectData: projectDataStr || '',
        shapesCount: currentProjectShapesCount,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Refresh corresponding tabs
      if (isPersonalLoggedIn) {
        handlePersonalLogin();
      }
      
      if (pubIsPublic || personalVisibility === 'public') {
        loadPublicProjects();
      }

      if (pubIsGroup && finalGroupId && activeGroup && activeGroup.groupCode === finalGroupId) {
        getGroupProjects(finalGroupId).then(setGroupProjects);
      }

      setTimeout(() => setActiveTab('personal'), 800);
    } catch (err: any) {
      setIsPublishing(false);
      setPublishStatusMessage(err.message || 'Помилка зберігання');
    }
  };

  // Publish Form Handler
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim()) {
      setPublishStatusMessage('Вкажіть назву проєкту');
      return;
    }

    if (!isPersonalLoggedIn) {
      setPublishStatusMessage('Будь ласка, спочатку відкрийте свою особисту скриню');
      setReturnToPublishAfterLogin(true);
      setActiveTab('personal');
      setPersonalAuthMode('login');
      return;
    }

    const activeNick = personalNickname.trim() || pubNickname.trim();
    const activePass = personalPasscode.trim() || pubPasscode.trim();

    if (!activeNick || !activePass) {
      setPublishStatusMessage('Помилка авторизації. Відкрийте скриню знову.');
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
      if (pubIsGroup) {
        finalGroupId = pubGroupCode.trim().toUpperCase();
        if (!finalGroupId) {
          setPublishStatusMessage('Вкажіть код групи для публікації');
          setIsPublishing(false);
          return;
        }
      }

      const personalVisibility = pubIsPublic ? 'public' : 'private';

      let existingId = '';
      if (isPersonalLoggedIn && personalNickname === pubNickname.trim().toLowerCase()) {
        const existing = personalProjects.find(p => p.title.toLowerCase() === pubTitle.trim().toLowerCase() && !p.isGroupCopy && p.visibility !== 'group');
        if (existing) existingId = existing.id;
      } else {
        const res = await getPersonalProjects(pubNickname, pubPasscode);
        if (res.success && res.projects) {
          const existing = res.projects.find(p => p.title.toLowerCase() === pubTitle.trim().toLowerCase() && !p.isGroupCopy && p.visibility !== 'group');
          if (existing) existingId = existing.id;
        }
      }

      if (existingId) {
        setIsPublishing(false);
        setPublishStatusMessage('');
        setPublishConflictModal({
          show: true,
          existingId,
          projectData,
          finalGroupId,
          personalVisibility
        });
        return;
      }

      await executePublish(pubTitle.trim(), false, undefined, projectData, finalGroupId, personalVisibility);
    } catch (err: any) {
      setIsPublishing(false);
      setPublishStatusMessage(err.message || 'Помилка зберігання');
    }
  };

  // Handle Project Passcode Actions (Delete, Change Visibility)
  const handleConfirmAction = async () => {
    const { projectId, action, targetGroupCode } = actionPasscodeModal;
    if (!projectId) return;

    if (action === 'delete') {
      const res = await deleteProjectFromCloud(projectId);
      if (res.success) {
        setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
        setPromptPasscode('');
        // Refresh
        loadPublicProjects();
        if (isPersonalLoggedIn) handlePersonalLogin();
        if (activeGroup) getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
      } else {
        alert(res.message || 'Не вдалося видалити проєкт');
      }
    } else {
      const passToUse = promptPasscode.trim() || personalPasscode;
      if (!passToUse) {
        alert('Вкажіть пароль для виконання дії');
        return;
      }
      if (action === 'make_public' || action === 'make_private') {
        const passToUse = personalPasscode || promptPasscode.trim();
        const newVis = action === 'make_public' ? 'public' : 'private';
        const res = await updateProjectVisibility(projectId, passToUse, newVis, '', '', isPersonalLoggedIn ? personalNickname : '');
        if (res.success) {
          setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
          setPromptPasscode('');
          loadPublicProjects();
          if (isPersonalLoggedIn) handlePersonalLogin();
        } else {
          alert(res.message || 'Помилка виконання дії');
        }
      } else if (action === 'make_group') {
        const passToUse = promptPasscode.trim() || personalPasscode;
        const code = targetGroupCode || prompt('Введіть код групи / осередка:');
        if (!code) return;
        const res = await copyProjectToGroup(projectId, passToUse, code.toUpperCase(), '', personalNickname);
        if (res.success) {
          setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
          setPromptPasscode('');
          if (isPersonalLoggedIn) handlePersonalLogin();
          if (activeGroup) getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
        } else {
          alert(res.message || 'Не вдалося надіслати у групу');
        }
      }
    }
  };

  // Global ESC key listener to close active overlays or modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sendToGroupModal.show) {
          setSendToGroupModal({ show: false, project: null });
        } else if (shareModalProject) {
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
  }, [isOpen, sendToGroupModal.show, shareModalProject, largePreviewProject, actionPasscodeModal.show, onClose]);

  const handleSaveProjectDetails = async (projectId: string, projPasscode: string) => {
    if (!editProjectTitle.trim()) {
      alert('Назва проєкту не може бути порожньою');
      return;
    }
    
    setIsSavingProjectDetails(true);
    const res = await updateProjectDetailsInCloud(
      projectId,
      projPasscode,
      editProjectTitle.trim(),
      editProjectDesc.trim()
    );
    setIsSavingProjectDetails(false);

    if (res.success) {
      // Update local states
      const updateList = (list: CloudProject[]) => 
        list.map(p => p.id === projectId ? { ...p, title: editProjectTitle.trim(), description: editProjectDesc.trim() } : p);
      
      setPersonalProjects(updateList);
      setGroupProjects(updateList);
      setPublicProjects(updateList);
      setEditingProjectId(null);
    } else {
      alert(res.message || 'Помилка збереження');
    }
  };

  if (!isOpen) return null;

  const filteredPublicProjects = publicProjects;

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
          <div className="flex items-center gap-3 relative">
            {isPersonalLoggedIn ? (
              <div className="relative mr-2" ref={accountDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-left"
                  title="Мій акаунт"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm border border-indigo-400/30">
                    {personalNickname ? personalNickname.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-200 truncate max-w-[120px]">@{personalNickname}</span>
                    {(currentAccountAuthorName || pubAuthorName) && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[120px] -mt-0.5 font-normal">
                        {currentAccountAuthorName || pubAuthorName}
                      </span>
                    )}
                  </div>
                </button>

                {showAccountDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-gray-800 bg-black/30">
                      <p className="text-xs text-gray-400 font-medium">Ваш акаунт</p>
                      <p className="text-sm font-bold text-white truncate">@{personalNickname}</p>
                      {currentAccountAuthorName && (
                        <p className="text-xs text-gray-300 mt-1 truncate">Підпис: {currentAccountAuthorName}</p>
                      )}
                      {currentAccountEmail && (
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{currentAccountEmail}</p>
                      )}
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditEmailInput(currentAccountEmail || '');
                          setEditAuthorNameInput(currentAccountAuthorName || '');
                          setEditNewPasscode('');
                          setEditCurrentPasscode('');
                          setEditProfileMessage('');
                          setShowEditProfileModal(true);
                          setShowAccountDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 transition-colors flex items-center gap-2"
                      >
                        ⚙️ Редагувати акаунт
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPersonalLoggedIn(false);
                          setPersonalProjects([]);
                          setShowAccountDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-800 text-gray-300 transition-colors flex items-center gap-2"
                      >
                        🚪 Закрити скриню
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 mr-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('personal');
                    setPersonalAuthMode('login');
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                >
                  Вхід
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('personal');
                    setPersonalAuthMode('register');
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                >
                  Реєстрація
                </button>
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Закрити"
            >
              <XIcon size={20} />
            </button>
          </div>
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
            🏫 Скриня групи/осередку
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
              <FilterToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Пошук по всій галереї (назва, автор, нікнейм)..."
                sortBy={sortBy}
                onSortChange={setSortBy}
                shapesFilter={shapesFilter}
                onShapesFilterChange={setShapesFilter}
                onRefresh={() => loadPublicProjects(searchQuery)}
                totalCount={publicProjects.length}
                filteredCount={displayedPublicProjects.length}
                onResetFilters={() => {
                  setSearchQuery('');
                  setSortBy('newest');
                  setShapesFilter('all');
                }}
              />

              {isLoadingPublic ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <VeretkaLoader className="w-24 h-24 mb-4" />
                  <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">Завантаження галереї...</div>
                </div>
              ) : displayedPublicProjects.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-black/20 rounded-2xl border border-dashed border-gray-700">
                  <p className="text-base font-medium">
                    {publicProjects.length === 0 ? 'Публічних проєктів поки немає' : 'Жодного проєкту не знайдено за вибраними фільтрами'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {publicProjects.length === 0
                      ? 'Опублікуйте свій проєкт першим за допомогою кнопки "Опублікувати поточний проєкт"'
                      : 'Спробуйте змінити критерії пошуку чи фільтрації'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPublicProjects.map((proj) => (
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
                        {proj.description && (
                          <p className="text-xs text-gray-300 mb-2 line-clamp-2" title={proj.description}>{proj.description}</p>
                        )}
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
                  
                  {/* Auth Mode Toggle */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonalAuthMode('login');
                        setPersonalError('');
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        personalAuthMode === 'login'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🔓 Вхід (Відкрити скриню)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPersonalAuthMode('register');
                        setPersonalError('');
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                        personalAuthMode === 'register'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      📝 Реєстрація (Отримати скриню)
                    </button>
                  </div>

                  {personalAuthMode === 'login' ? (
                    /* LOGIN FORM */
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white">Відкрити особисту скриню</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Вкажіть свій унікальний Нікнейм (або Email) та Пароль від вашої скрині
                        </p>
                      </div>

                      <form onSubmit={handlePersonalLogin} className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-300 font-medium mb-1">Ваш Нікнейм або Email:*</label>
                          <input
                            type="text"
                            placeholder="наприклад: petro_2026 або user@gmail.com"
                            value={personalNickname}
                            onChange={(e) => setPersonalNickname(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-gray-300 font-medium">Пароль до скрині:*</label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRecoveryModal(true);
                                setRecoveryMessage('');
                              }}
                              className="text-[11px] text-indigo-400 hover:underline"
                            >
                              Забули нікнейм або пароль?
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswords['login'] ? "text" : "password"}
                              placeholder="Введіть пароль"
                              value={personalPasscode}
                              onChange={(e) => setPersonalPasscode(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePassword('login')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                            >
                              {showPasswords['login'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                          </div>
                        </div>

                        {personalError && (
                          <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                            {personalError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isLoadingPersonal}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-900/30"
                        >
                          {isLoadingPersonal ? 'Авторизація...' : 'Відкрити особисту скриню'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* REGISTRATION FORM */
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white">Створити нову особисту скриню</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Придумайте унікальний Нікнейм та Пароль для захисту та впорядкування ваших проєктів
                        </p>
                      </div>

                      <form onSubmit={handleRegisterSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-300 font-medium mb-1">Ваш унікальний Нікнейм (Логін):*</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="наприклад: petro_2026"
                              value={regNickname}
                              onChange={(e) => setRegNickname(e.target.value)}
                              className={`w-full px-3 py-2 pr-9 rounded-xl bg-black/40 border text-sm focus:outline-none text-white transition-colors ${
                                nicknameTaken
                                  ? 'border-red-500 focus:border-red-500'
                                  : regNickname.trim().length >= 2 && !isCheckingNickname
                                  ? 'border-emerald-500 focus:border-emerald-500'
                                  : 'border-gray-700 focus:border-indigo-500'
                              }`}
                              required
                            />
                            {isCheckingNickname && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          {nicknameTaken && (
                            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                              ⚠️ Такий нікнейм вже зайнятий у спільноті. Оберіть інший.
                            </p>
                          )}
                          {!nicknameTaken && regNickname.trim().length >= 2 && !isCheckingNickname && (
                            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                              ✓ Нікнейм вільний
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 font-medium mb-1">Ім'я (підпис) <span className="text-gray-400 font-normal">(необов'язково)</span>:</label>
                          <input
                            type="text"
                            placeholder="Олена К."
                            value={regAuthorName}
                            onChange={(e) => setRegAuthorName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 font-medium mb-1">Пароль до скрині:*</label>
                          <div className="relative">
                            <input
                              type={showPasswords['reg'] ? "text" : "password"}
                              placeholder="Придумайте пароль"
                              value={regPasscode}
                              onChange={(e) => setRegPasscode(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePassword('reg')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                            >
                              {showPasswords['reg'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 font-medium mb-1">Повторіть пароль:*</label>
                          <div className="relative">
                            <input
                              type={showPasswords['regConfirm'] ? "text" : "password"}
                              placeholder="Підтвердіть пароль"
                              value={regConfirmPasscode}
                              onChange={(e) => setRegConfirmPasscode(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePassword('regConfirm')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                            >
                              {showPasswords['regConfirm'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 font-medium mb-1">
                            Електронна пошта (Email): <span className="text-gray-400 font-normal">(необов'язково)</span>
                          </label>
                          <input
                            type="email"
                            placeholder="наприклад: user@gmail.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                          />
                          <div className="mt-1.5 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300/90 leading-relaxed flex items-start gap-2">
                            <span className="shrink-0 text-base">ℹ️</span>
                            <span>
                              <strong>Для чого пошта:</strong> Це поле не є обов'язковим. Якщо ви його заповните, пошта слугуватиме надійним способом відновити свій Нікнейм та доступ до скрині, якщо ви їх раптом забудете.
                            </span>
                          </div>
                        </div>

                        {personalError && (
                          <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                            {personalError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isLoadingPersonal}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-900/30"
                        >
                          {isLoadingPersonal ? 'Створення скрині...' : '✨ Отримати та відкрити скриню'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Google Login Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <span className="relative bg-[var(--bg-primary,#11111b)] px-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      або
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoadingPersonal}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>
                      {personalAuthMode === 'register' ? 'Отримати через Google' : 'Увійти через Google'}
                    </span>
                  </button>

                  {personalAuthMode === 'register' && (
                    <p className="text-[10px] text-gray-400 text-center mt-2 leading-relaxed">
                      💡 При отримані через Google Нікнеймом за замовчуванням стане частина пошти (до @), а пароль вказується у полі вище або запитується при створенні.
                    </p>
                  )}

                </div>
              ) : (
                <div className="space-y-4">
                  <FilterToolbar
                    searchQuery={personalSearchQuery}
                    onSearchChange={setPersonalSearchQuery}
                    searchPlaceholder="Пошук у моїй скрині..."
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    shapesFilter={shapesFilter}
                    onShapesFilterChange={setShapesFilter}
                    showVisibilityFilter={true}
                    visibilityFilter={visibilityFilter}
                    onVisibilityFilterChange={setVisibilityFilter}
                    onRefresh={handlePersonalLogin}
                    totalCount={personalProjects.length}
                    filteredCount={displayedPersonalProjects.length}
                    onResetFilters={() => {
                      setPersonalSearchQuery('');
                      setSortBy('newest');
                      setShapesFilter('all');
                      setVisibilityFilter('all');
                    }}
                  />

                  {isLoadingPersonal ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <VeretkaLoader className="w-24 h-24 mb-4" />
                      <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">Оновлення скрині...</div>
                    </div>
                  ) : displayedPersonalProjects.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-black/20 rounded-2xl border border-dashed border-gray-700">
                      <p className="text-base font-medium">
                        {personalProjects.length === 0
                          ? 'У вашій особистій скрині ще немає збережених проєктів'
                          : 'Нічого не знайдено в особистій скрині за вибраними фільтрами'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {personalProjects.length === 0
                          ? 'Збережіть поточний проєкт у Мою особисту скриню за допомогою вкладки "Опублікувати"'
                          : 'Спробуйте змінити критерії пошуку чи фільтрації'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedPersonalProjects.map((proj) => (
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
                            {editingProjectId === proj.id ? (
                              <div className="mb-3 space-y-2">
                                <input
                                  type="text"
                                  value={editProjectTitle}
                                  onChange={(e) => setEditProjectTitle(e.target.value)}
                                  className="w-full px-2 py-1 bg-black/40 border border-indigo-500 rounded text-sm text-white focus:outline-none"
                                />
                                <textarea
                                  value={editProjectDesc}
                                  onChange={(e) => setEditProjectDesc(e.target.value)}
                                  placeholder="Опис проєкту..."
                                  className="w-full px-2 py-1 bg-black/40 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:border-indigo-500 min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveProjectDetails(proj.id, personalPasscode)}
                                    disabled={isSavingProjectDetails}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded"
                                  >
                                    Зберегти
                                  </button>
                                  <button
                                    onClick={() => setEditingProjectId(null)}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] rounded"
                                  >
                                    Скасувати
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2 group">
                                  <h3 className="font-bold text-base text-white truncate max-w-[150px]" title={proj.title}>
                                    {proj.title}
                                  </h3>
                                  <div className="flex items-center gap-1 flex-wrap justify-end">
                                    <button
                                      onClick={() => {
                                        setEditingProjectId(proj.id);
                                        setEditProjectTitle(proj.title);
                                        setEditProjectDesc(proj.description || '');
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-white transition-opacity"
                                      title="Редагувати назву/опис"
                                    >
                                      ✏️
                                    </button>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                      proj.visibility === 'public'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        : proj.visibility === 'group'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                    }`}>
                                      {proj.visibility === 'public' ? 'Публічний' : proj.visibility === 'group' ? `Група: ${proj.groupId}` : 'Приватний'}
                                    </span>
                                    {((proj.sentToGroups && proj.sentToGroups.length > 0) || (proj.visibility === 'group' && proj.groupId)) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSentGroupsProject(proj);
                                        }}
                                        className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer font-medium shadow-sm"
                                        title="Натисніть, щоб переглянути список груп, куди надіслано копію проєкту"
                                      >
                                        🏫 {proj.sentToGroups && proj.sentToGroups.length > 0 ? `У групах (${proj.sentToGroups.length})` : `Група: ${proj.groupId}`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {proj.description && (
                                  <p className="text-xs text-gray-300 mb-2 line-clamp-2" title={proj.description}>{proj.description}</p>
                                )}
                              </>
                            )}
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
                              {proj.visibility !== 'public' ? (
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
                                  🌐 Виставити у галереї
                                </button>
                              ) : (
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
                                  🔒 Прибрати з галереї
                                </button>
                              )}

                              <button
                                onClick={() => openSendToGroupModal(proj)}
                                className="flex-1 py-1 px-2 rounded text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors"
                              >
                                🏫 Надіслати копію у групу
                              </button>

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
                <div className="max-w-xl mx-auto bg-[var(--bg-primary,#11111b)] p-6 rounded-2xl border border-[var(--border-color,#313244)] space-y-5">
                  <div className="flex flex-wrap rounded-xl bg-black/40 p-1 border border-gray-800 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGroupTabSubView('open');
                        setIsCreatingGroup(false);
                      }}
                      className={`flex-1 min-w-[120px] py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center ${
                        groupTabSubView === 'open' && !isCreatingGroup ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🔑 Вхід за кодом
                    </button>

                    {isPersonalLoggedIn && (
                      <button
                        type="button"
                        onClick={async () => {
                          setGroupTabSubView('my_groups');
                          setIsCreatingGroup(false);
                          setIsLoadingMyGroups(true);
                          const userG = await getUserGroups(personalNickname);
                          setMyUserGroups(userG);
                          setIsLoadingMyGroups(false);
                        }}
                        className={`flex-1 min-w-[140px] py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center flex items-center justify-center gap-1 ${
                          groupTabSubView === 'my_groups' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>📋</span> Мої групи/осередки
                      </button>
                    )}

                    {isPersonalLoggedIn && (
                      <button
                        type="button"
                        onClick={() => {
                          setGroupTabSubView('create');
                          setIsCreatingGroup(true);
                          setNewGroupCreator(personalNickname);
                        }}
                        className={`flex-1 min-w-[130px] py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center ${
                          isCreatingGroup ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        ➕ Створити осередок
                      </button>
                    )}
                  </div>
                  
                  {!isPersonalLoggedIn && groupTabSubView === 'open' && (
                    <div className="text-center p-3 text-xs text-amber-500 bg-amber-500/10 rounded-xl">
                      💡 Створювати нові групи та переглядати власні осередки можуть лише авторизовані користувачі. Але ви можете приєднатися за кодом доступу та паролем.
                    </div>
                  )}

                  {/* Sub-view 1: Login by Code */}
                  {groupTabSubView === 'open' && !isCreatingGroup && (
                    <form onSubmit={handleGroupLogin} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Код групи / осередку:*</label>
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
                        <label className="block text-xs text-gray-400 mb-1">
                          Пароль доступу до групи:
                          <span className="text-[10px] text-gray-500 block">Необов'язково для власників та збережених груп</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords['groupJoin'] ? "text" : "password"}
                            placeholder="Залиште порожнім, якщо збережено"
                            value={groupPasscodeInput}
                            onChange={(e) => setGroupPasscodeInput(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePassword('groupJoin')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                          >
                            {showPasswords['groupJoin'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
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
                        {isLoadingGroup ? 'Перевірка...' : 'Відкрити скриню групи'}
                      </button>
                    </form>
                  )}

                  {/* Sub-view 2: My Groups */}
                  {groupTabSubView === 'my_groups' && !isCreatingGroup && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                        <div>
                          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                            📋 Мої групи та осередки
                          </h3>
                          <p className="text-[10px] text-gray-400">
                            Засновані вами осередки або класи, де ви є учасником
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setIsLoadingMyGroups(true);
                            const userG = await getUserGroups(personalNickname);
                            setMyUserGroups(userG);
                            setIsLoadingMyGroups(false);
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-1"
                        >
                          🔄 Оновити
                        </button>
                      </div>

                      {isLoadingMyGroups ? (
                        <div className="text-center py-8 text-xs text-gray-400 flex items-center justify-center gap-2">
                          <VeretkaLoader size="sm" />
                          <span>Завантаження ваших груп...</span>
                        </div>
                      ) : myUserGroups.length === 0 ? (
                        <div className="text-center py-8 bg-black/30 rounded-xl border border-gray-800/80 p-5 space-y-3">
                          <p className="text-xs text-gray-400 leading-relaxed">
                            У вас поки немає збережених груп або опублікованих робіт в осередках.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setGroupTabSubView('create');
                              setIsCreatingGroup(true);
                              setNewGroupCreator(personalNickname);
                            }}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                          >
                            ➕ Створити перший осередок
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
                          {myUserGroups.map((g) => {
                            const isCreator = g.creatorNickname?.toLowerCase() === personalNickname.toLowerCase();
                            return (
                              <div
                                key={g.id || g.groupCode}
                                className="bg-black/40 border border-gray-800 hover:border-indigo-500/50 p-3.5 rounded-xl transition-all space-y-2 flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-white">{g.name}</h4>
                                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                                        {g.groupCode}
                                      </span>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium shrink-0 ${
                                      isCreator ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`}>
                                      {isCreator ? '👑 Засновник' : '👤 Учасник'}
                                    </span>
                                  </div>

                                  {g.description && (
                                    <p className="text-[11px] text-gray-400 line-clamp-2">{g.description}</p>
                                  )}

                                  <div className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-0.5">
                                    <span>Режим:</span>
                                    <span className="font-medium text-gray-300">
                                      {g.mode === 'education' ? '🏫 Освітній клас' : g.mode === 'readonly' ? '📢 Дошка шаблонів' : '🎨 Спільна майстерня'}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    setGroupCodeInput(g.groupCode);
                                    setGroupTabSubView('open');
                                    setIsCreatingGroup(false);
                                    
                                    const codeUpper = g.groupCode.toUpperCase();
                                    const savedPass = savedGroupPasscodes[codeUpper];
                                    
                                    if (isCreator || savedPass) {
                                      // Bypass prompt
                                      await handleGroupLogin({ preventDefault: () => {} } as any, savedPass || '');
                                    } else {
                                      const pass = prompt(`Вкажіть пароль доступу для осередка "${g.name}" (${g.groupCode}):`);
                                      if (pass) {
                                        setGroupPasscodeInput(pass);
                                        await handleGroupLogin({ preventDefault: () => {} } as any, pass);
                                      }
                                    }
                                  }}
                                  className="w-full py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium border border-indigo-500/30 transition-all text-center mt-2"
                                >
                                  🚀 Увійти в цей осередок
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-view 3: Create Group Form */}
                  {isCreatingGroup && (
                    <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                      {/* Scenario Selector Cards */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Оберіть режим (сценарій використання):
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewGroupMode('gallery')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              newGroupMode === 'gallery'
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <span className="text-lg mb-1">🎨</span>
                            <div>
                              <div className="text-xs font-bold leading-tight">Спільна майстерня</div>
                              <div className="text-[9px] text-gray-400 mt-0.5">Всі бачать все</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewGroupMode('education')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              newGroupMode === 'education'
                                ? 'bg-amber-600/20 border-amber-500 text-white'
                                : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <span className="text-lg mb-1">🏫</span>
                            <div>
                              <div className="text-xs font-bold leading-tight">Освітній клас</div>
                              <div className="text-[9px] text-gray-400 mt-0.5">Приватна здача</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewGroupMode('readonly')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              newGroupMode === 'readonly'
                                ? 'bg-purple-600/20 border-purple-500 text-white'
                                : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                            }`}
                          >
                            <span className="text-lg mb-1">📢</span>
                            <div>
                              <div className="text-xs font-bold leading-tight">Дошка шаблонів</div>
                              <div className="text-[9px] text-gray-400 mt-0.5">Публікує засновник</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Scenario Context Info */}
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        newGroupMode === 'education'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : newGroupMode === 'readonly'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                      }`}>
                        {newGroupMode === 'education' && (
                          <div className="space-y-2">
                            <strong className="font-semibold block text-amber-300">🏫 Особливості Освітнього Класу:</strong>
                            <p className="text-[11px] text-gray-300">
                              • Учні повідомляють цей Код та Пароль і надсилають сюди виконані завдання.<br />
                              • <span className="text-amber-300 font-medium">Захист від списування:</span> Учні бачать лише свої роботи та ваші шаблони.<br />
                              • Ви як засновник маєте повний доступ до перевірки робіт усіх учнів.
                            </p>

                            <div className="mt-3 pt-2 border-t border-amber-500/20 space-y-1.5">
                              <label className="block text-xs font-semibold text-amber-200">
                                🎓 Правило повторного надсилання робіт учнями:
                              </label>
                              <div className="space-y-1 text-[11px]">
                                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                                  <input
                                    type="radio"
                                    name="newStudentPolicy"
                                    value="allow_overwrite"
                                    checked={newGroupStudentPolicy === 'allow_overwrite'}
                                    onChange={() => setNewGroupStudentPolicy('allow_overwrite')}
                                    className="mt-0.5 accent-amber-500"
                                  />
                                  <div>
                                    <span className="font-semibold text-white">🟢 Вільне оновлення (дозволити перезапис)</span>
                                    <p className="text-[10px] text-gray-400">Учень може оновлювати існуючу здану роботу — стара версія перезаписується.</p>
                                  </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                                  <input
                                    type="radio"
                                    name="newStudentPolicy"
                                    value="create_versions"
                                    checked={newGroupStudentPolicy === 'create_versions'}
                                    onChange={() => setNewGroupStudentPolicy('create_versions')}
                                    className="mt-0.5 accent-amber-500"
                                  />
                                  <div>
                                    <span className="font-semibold text-white">🔵 Авто-версіонування (зберігати v2, v3...)</span>
                                    <p className="text-[10px] text-gray-400">Кожне повторне надсилання створює окрему нову версію роботи для відстеження прогресу.</p>
                                  </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                                  <input
                                    type="radio"
                                    name="newStudentPolicy"
                                    value="freeze_after_submit"
                                    checked={newGroupStudentPolicy === 'freeze_after_submit'}
                                    onChange={() => setNewGroupStudentPolicy('freeze_after_submit')}
                                    className="mt-0.5 accent-amber-500"
                                  />
                                  <div>
                                    <span className="font-semibold text-white">🔒 Фіксація здачі (заборона повторного оновлення)</span>
                                    <p className="text-[10px] text-gray-400">Після здачі учень не може оновити цей же проєкт (ідеально для контрольних робіт).</p>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                        {newGroupMode === 'gallery' && (
                          <div className="space-y-1">
                            <strong className="font-semibold block text-indigo-300">🎨 Особливості Спільної Майстерні:</strong>
                            <p className="text-[11px] text-gray-300">
                              • Відкрита колекція для команди, студії чи групи за інтересами.<br />
                              • Усі учасники з кодом та паролем можуть публікувати та переглядати роботи один одного.<br />
                              • Чудовий вибір для хакатонів, обміну досвідом та спільної творчості.
                            </p>
                          </div>
                        )}
                        {newGroupMode === 'readonly' && (
                          <div className="space-y-1">
                            <strong className="font-semibold block text-purple-300">📢 Особливості Дошки Шаблонів:</strong>
                            <p className="text-[11px] text-gray-300">
                              • Каталог готових заготовок, векторних шрифтів та векторних узорів.<br />
                              • Учасники можуть заходити й завантажувати копії у свій редактор.<br />
                              • <span className="text-purple-300 font-medium">Обмеження публікації:</span> Надсилати нові проєкти сюди може ТІЛЬКИ засновник (ви).
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Form Fields */}
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          {newGroupMode === 'education' ? 'Назва класу / групи:*' :
                           newGroupMode === 'readonly' ? 'Назва колекції шаблонів:*' :
                           'Назва групи / осередку:*'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            newGroupMode === 'education' ? 'наприклад: 8-А клас (Графічний дизайн)' :
                            newGroupMode === 'readonly' ? 'наприклад: Офіційні шаблони Веретка' :
                            'наприклад: Клуб вектористів "Палітра"'
                          }
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Унікальний Код (англійськими літерами):*
                        </label>
                        <input
                          type="text"
                          placeholder={
                            newGroupMode === 'education' ? 'HUB-CLASS8A' :
                            newGroupMode === 'readonly' ? 'HUB-PATTERNS' :
                            'HUB-DESIGNCLUB'
                          }
                          value={newGroupCode}
                          onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Опис (опціонально):</label>
                        <input
                          type="text"
                          placeholder={
                            newGroupMode === 'education' ? 'наприклад: Здача практичних робіт з теми "Векторні форми"' :
                            'Короткий опис осередка'
                          }
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          {newGroupMode === 'education' ? 'Пароль класу (для учнів):*' :
                           newGroupMode === 'readonly' ? 'Пароль доступу до шаблонів:*' :
                           'Пароль групи:*'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords['newGroup'] ? "text" : "password"}
                            placeholder="Придумайте пароль доступу"
                            value={newGroupPasscode}
                            onChange={(e) => setNewGroupPasscode(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePassword('newGroup')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                          >
                            {showPasswords['newGroup'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {newGroupMode === 'education'
                            ? '💡 Повідомте цей пароль та код учням для входу в клас.'
                            : '💡 Знаючи цей пароль та код, учасники зможуть увійти в осередок.'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Повторіть пароль:*</label>
                        <div className="relative">
                          <input
                            type={showPasswords['newGroupConfirm'] ? "text" : "password"}
                            placeholder="Підтвердіть пароль"
                            value={newGroupConfirmPasscode}
                            onChange={(e) => setNewGroupConfirmPasscode(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePassword('newGroupConfirm')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                          >
                            {showPasswords['newGroupConfirm'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Засновник (Адміністратор):</label>
                        <input
                          type="text"
                          value={newGroupCreator}
                          disabled
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm text-gray-400 cursor-not-allowed"
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
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-900/20"
                      >
                        {isLoadingGroup ? 'Створення...' : 'Створити осередок'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-950/40 p-4 rounded-xl border border-amber-500/30 gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded font-mono border border-amber-500/30 font-bold">
                            {activeGroup.groupCode}
                          </span>
                          <h3 className="text-lg font-bold text-white">{activeGroup.name}</h3>

                          {/* USER ROLE BADGE IN GROUP HEADER */}
                          {(() => {
                            const isCreator = isPersonalLoggedIn && activeGroup.creatorNickname?.trim().toLowerCase() === personalNickname.trim().toLowerCase();
                            return (
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                                isCreator ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                isPersonalLoggedIn ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/40'
                              }`}>
                                {isCreator ? '👑 Засновник групи' : isPersonalLoggedIn ? '👤 Учасник групи' : '👀 Гість'}
                              </span>
                            );
                          })()}
                        </div>

                        {activeGroup.description && (
                          <p className="text-xs text-gray-300 mt-1">{activeGroup.description}</p>
                        )}

                        <div className="mt-2 text-[11px] flex items-center gap-2">
                          <span className="text-gray-400">Режим роботи:</span>
                          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-200 border border-gray-700 font-medium">
                            {activeGroup.mode === 'education' ? '🏫 Освітній клас (Учні бачать лише свої роботи)' : 
                             activeGroup.mode === 'readonly' ? '🔒 Дошка шаблонів (Публікує лише засновник)' : 
                             '🎨 Спільна майстерня (Всі бачать все)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenGroupMembers(activeGroup.groupCode)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-semibold border border-indigo-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
                          title="Переглянути всіх учасників цієї групи"
                        >
                          👥 Учасники
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenGroupSettings(activeGroup)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold border border-gray-700 transition-colors flex items-center gap-1.5 shadow-sm"
                          title="Налаштування цієї групи"
                        >
                          ⚙️ Налаштування
                        </button>

                        {isPersonalLoggedIn && (
                          <button
                            type="button"
                            onClick={async () => {
                              setActiveGroup(null);
                              setGroupTabSubView('my_groups');
                              setIsLoadingMyGroups(true);
                              const userG = await getUserGroups(personalNickname);
                              setMyUserGroups(userG);
                              setIsLoadingMyGroups(false);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-black/40 hover:bg-gray-800 text-gray-300 font-medium border border-gray-800 transition-colors flex items-center gap-1"
                            title="Повернутися до моїх груп"
                          >
                            📋 Мої групи
                          </button>
                        )}
                      </div>
                    </div>

                  <FilterToolbar
                    searchQuery={groupSearchQuery}
                    onSearchChange={setGroupSearchQuery}
                    searchPlaceholder="Пошук у скрині групи..."
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    shapesFilter={shapesFilter}
                    onShapesFilterChange={setShapesFilter}
                    onRefresh={handleGroupLogin}
                    totalCount={groupProjects.length}
                    filteredCount={displayedGroupProjects.length}
                    onResetFilters={() => {
                      setGroupSearchQuery('');
                      setSortBy('newest');
                      setShapesFilter('all');
                    }}
                  />

                  {isLoadingGroup ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <VeretkaLoader className="w-24 h-24 mb-4" />
                      <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">Завантаження осередку...</div>
                    </div>
                  ) : displayedGroupProjects.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-black/20 rounded-2xl border border-dashed border-gray-700">
                      <p className="text-base font-medium">
                        {groupProjects.length === 0
                          ? 'У цій групі ще немає опублікованих проєктів'
                          : 'Нічого не знайдено у групі за вибраними фільтрами'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {groupProjects.length === 0
                          ? 'Опублікуйте свій проєкт у цю групу через вкладку "Опублікувати"'
                          : 'Спробуйте змінити критерії пошуку чи фільтрації'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedGroupProjects.map((proj) => (
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
                            {editingProjectId === proj.id ? (
                              <div className="mb-3 space-y-2">
                                <input
                                  type="text"
                                  value={editProjectTitle}
                                  onChange={(e) => setEditProjectTitle(e.target.value)}
                                  className="w-full px-2 py-1 bg-black/40 border border-indigo-500 rounded text-sm text-white focus:outline-none"
                                />
                                <textarea
                                  value={editProjectDesc}
                                  onChange={(e) => setEditProjectDesc(e.target.value)}
                                  placeholder="Опис проєкту..."
                                  className="w-full px-2 py-1 bg-black/40 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:border-indigo-500 min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveProjectDetails(proj.id, personalPasscode)}
                                    disabled={isSavingProjectDetails}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded"
                                  >
                                    Зберегти
                                  </button>
                                  <button
                                    onClick={() => setEditingProjectId(null)}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] rounded"
                                  >
                                    Скасувати
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2 group">
                                  <h3 className="font-bold text-base text-white truncate max-w-[150px]" title={proj.title}>
                                    {proj.title}
                                  </h3>
                                  <div className="flex items-center gap-1">
                                    {(isPersonalLoggedIn && proj.ownerNickname === personalNickname) && (
                                      <button
                                        onClick={() => {
                                          setEditingProjectId(proj.id);
                                          setEditProjectTitle(proj.title);
                                          setEditProjectDesc(proj.description || '');
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-white transition-opacity"
                                        title="Редагувати назву/опис"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                                      Група
                                    </span>
                                  </div>
                                </div>
                                {proj.description && (
                                  <p className="text-xs text-gray-300 mb-2 line-clamp-2" title={proj.description}>{proj.description}</p>
                                )}
                              </>
                            )}
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
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    required
                  />
                </div>

                {!isPersonalLoggedIn ? (
                  <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 p-4 rounded-xl border border-amber-500/30 text-center space-y-3">
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Для публікації та збереження проєкту у вашій особистій скрині, будь ласка, відкрийте свою скриню.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnToPublishAfterLogin(true);
                        setActiveTab('personal');
                        setPersonalAuthMode('login');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                    >
                      <span>🔓</span>
                      <span>Увійти (Відкрити власну скриню)</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Ім'я автора (підпис):</label>
                      <input
                        type="text"
                        value={pubAuthorName}
                        onChange={(e) => {
                          setPubAuthorName(e.target.value);
                          localStorage.setItem('veretka_author_name', e.target.value);
                        }}
                        placeholder="Олена К."
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 text-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-300">Ваш Нікнейм:*</label>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('personal');
                            setPersonalAuthMode('login');
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1 font-medium"
                          title="Перейти до входу для зміни акаунту"
                        >
                          🔄 Змінити
                        </button>
                      </div>
                      <input
                        type="text"
                        value={pubNickname}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-700 text-sm text-gray-400 cursor-not-allowed select-none font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Опис проєкту (необов'язково):
                  </label>
                  <textarea
                    value={pubDescription}
                    onChange={(e) => setPubDescription(e.target.value)}
                    placeholder="Короткий опис вашого проєкту, використаних орнаментів або коментар..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 text-white placeholder:text-gray-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Налаштування публікації:</label>
                  <div className="text-xs text-gray-400 mb-3 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    ℹ️ Ваш проєкт завжди автоматично зберігається у Вашу <b>Особисту скриню</b>. Нижче Ви можете обрати додаткові місця для публікації.
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      pubIsPublic ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-800 bg-black/20 hover:border-gray-600'
                    }`}>
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          checked={pubIsPublic}
                          onChange={(e) => setPubIsPublic(e.target.checked)}
                          className="w-4 h-4 rounded bg-black/50 border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                        />
                      </div>
                      <div>
                        <div className={`font-semibold ${pubIsPublic ? 'text-emerald-400' : 'text-gray-300'}`}>🌐 Загальна галерея</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Проєкт буде видно всім у вкладці "Публічна галерея".</div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      pubIsGroup ? 'border-amber-500 bg-amber-500/10' : 'border-gray-800 bg-black/20 hover:border-gray-600'
                    }`}>
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          checked={pubIsGroup}
                          onChange={(e) => setPubIsGroup(e.target.checked)}
                          className="w-4 h-4 rounded bg-black/50 border-gray-600 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
                        />
                      </div>
                      <div>
                        <div className={`font-semibold ${pubIsGroup ? 'text-amber-400' : 'text-gray-300'}`}>🏫 Скриня групи</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Створити копію у групі.</div>
                      </div>
                    </label>
                  </div>

                  {pubIsGroup && (
                    <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-amber-300">Код групи / осередка:*</label>
                        {isPersonalLoggedIn && (
                          <button
                            type="button"
                            onClick={async () => {
                              setShowGroupPicker(!showGroupPicker);
                              if (!myUserGroups.length && personalNickname) {
                                setIsLoadingMyGroups(true);
                                const userG = await getUserGroups(personalNickname);
                                setMyUserGroups(userG);
                                setIsLoadingMyGroups(false);
                              }
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors font-medium flex items-center gap-1"
                          >
                            📋 Ваші групи
                          </button>
                        )}
                      </div>

                      {showGroupPicker && (
                        <div className="bg-black/80 border border-amber-500/40 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                          <div className="text-[11px] font-semibold text-gray-400 mb-1">Оберіть вашу групу:</div>
                          {isLoadingMyGroups ? (
                            <p className="text-xs text-gray-400 animate-pulse py-2 text-center">Завантаження вашої групи...</p>
                          ) : myUserGroups.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2 text-center">У вас ще немає збережених груп</p>
                          ) : (
                            myUserGroups.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setPubGroupCode(g.groupCode);
                                  setFetchedGroupInfo(g);
                                  setShowGroupPicker(false);
                                }}
                                className={`w-full text-left p-2 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                                  pubGroupCode.toUpperCase() === g.groupCode
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                                    : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-amber-500/40 hover:bg-black/50'
                                }`}
                              >
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded">
                                      {g.groupCode}
                                    </span>
                                    <span>{g.name}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">
                                    Режим: {g.mode === 'education' ? '🏫 Освітній' : g.mode === 'readonly' ? '🔒 Дошка шаблонів' : '🎨 Галерея'}
                                  </div>
                                </div>
                                <span className="text-xs text-amber-400">Обрати ➔</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      <input
                        type="text"
                        value={pubGroupCode}
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase();
                          setPubGroupCode(code);
                          if (code.trim()) {
                            getGroupInfoByCode(code).then(setFetchedGroupInfo);
                          } else {
                            setFetchedGroupInfo(null);
                          }
                        }}
                        placeholder="наприклад: HUB-ROBOT3"
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-amber-500/40 text-sm uppercase focus:outline-none focus:border-amber-400 text-white font-mono"
                        required={pubIsGroup}
                      />

                      {fetchedGroupInfo && (
                        <div className="bg-black/40 p-3 rounded-lg border border-amber-500/20 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">{fetchedGroupInfo.name}</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                              {fetchedGroupInfo.mode === 'education' ? '🏫 Освітній режим' : 
                               fetchedGroupInfo.mode === 'readonly' ? '🔒 Дошка шаблонів' : 
                               '🎨 Галерея'}
                            </span>
                          </div>
                          {fetchedGroupInfo.description && (
                            <p className="text-gray-400 text-[11px]">{fetchedGroupInfo.description}</p>
                          )}
                          <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                            {fetchedGroupInfo.mode === 'education' && (
                              <p className="text-amber-200/90">💡 В освітньому режимі учні бачать тільки свої опубліковані роботи.</p>
                            )}
                            {fetchedGroupInfo.mode === 'readonly' && (
                              <p className="text-amber-200/90">⚠️ Режим шаблонів: публікація дозволена засновникy (@{fetchedGroupInfo.creatorNickname}).</p>
                            )}
                            {fetchedGroupInfo.mode === 'gallery' && (
                              <p className="text-emerald-300/90">✓ Відкрита галерея: всі учасники групи можуть публікувати роботи.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? 'Збереження...' : '🚀 Опублікувати проєкт'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Edit Profile / Account Settings Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <h4 className="font-bold text-base flex items-center gap-2 text-indigo-300">
                  ⚙️ Редагування акаунту
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfileModal(false);
                    setEditProfileMessage('');
                  }}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="text-xs text-gray-300 space-y-1">
                <p>Нікнейм скрині: <strong className="text-white font-mono">@{personalNickname}</strong></p>
                <p className="text-gray-400">Тут ви можете прив'язати або оновити пошту, а також змінити пароль до вашої скрині.</p>
              </div>

              <form onSubmit={handleEditProfileSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Ім'я (підпис):
                  </label>
                  <input
                    type="text"
                    value={editAuthorNameInput}
                    onChange={(e) => setEditAuthorNameInput(e.target.value)}
                    placeholder="Олена К."
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Електронна пошта (Email):
                  </label>
                  <input
                    type="email"
                    value={editEmailInput}
                    onChange={(e) => setEditEmailInput(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-indigo-300/80 mt-1">
                    💡 Прив'яжіть пошту, щоб не втратити доступ та мати змогу відновити Нікнейм.
                  </p>
                </div>

                <div className="border-t border-gray-800 pt-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-300">Зміна паролю (необов'язково):</p>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Новий пароль:
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords['editNew'] ? "text" : "password"}
                        value={editNewPasscode}
                        onChange={(e) => setEditNewPasscode(e.target.value)}
                        placeholder="Залиште порожнім, якщо не змінюєте"
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePassword('editNew')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      >
                        {showPasswords['editNew'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Поточний пароль (для підтвердження):
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords['editCurrent'] ? "text" : "password"}
                        value={editCurrentPasscode}
                        onChange={(e) => setEditCurrentPasscode(e.target.value)}
                        placeholder="Введіть поточний пароль"
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePassword('editCurrent')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      >
                        {showPasswords['editCurrent'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {editProfileMessage && (
                  <p className={`text-xs p-3 rounded-xl border leading-relaxed ${
                    editProfileSuccess
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border-red-500/30'
                  }`}>
                    {editProfileMessage}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfileModal(false);
                      setEditProfileMessage('');
                      setShowDeleteAccountConfirm(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/30"
                  >
                    {isUpdatingProfile ? 'Збереження...' : 'Зберегти зміни'}
                  </button>
                </div>
              </form>

              {/* Account Deletion Section */}
              <div className="border-t border-red-500/20 pt-3.5 mt-4">
                {!showDeleteAccountConfirm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteAccountError('');
                      setShowDeleteAccountConfirm(true);
                    }}
                    className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    🗑️ Видалити особисту скриню (акаунт)
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 space-y-3 text-left">
                    <p className="text-xs text-red-300 leading-relaxed font-medium">
                      ⚠️ <strong>Увага! Незворотна дія!</strong> Ви збираєтеся остаточно видалити вашу особисту скриню <span className="font-mono text-white">@{personalNickname}</span>. Усі ваші проєкти в цій скрині будуть видалені безповоротно.
                    </p>

                    {deleteAccountError && (
                      <p className="text-xs text-red-300 bg-red-950/80 p-2 rounded-lg border border-red-500/30">
                        {deleteAccountError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDeleteAccountConfirm(false)}
                        className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                      >
                        Скасувати
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccountSubmit()}
                        disabled={isDeletingAccount}
                        className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-md shadow-red-900/40 flex items-center justify-center gap-1"
                      >
                        {isDeletingAccount ? 'Видалення...' : '🗑️ Так, видалити скриню'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Group Deletion Modal */}
        {showDeleteGroupModal && activeGroup && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <h4 className="font-bold text-base flex items-center gap-2 text-red-400">
                  🗑️ Видалення групи / осередку
                </h4>
                <button
                  type="button"
                  onClick={() => setShowDeleteGroupModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Ви збираєтеся повністю видалити групу <strong className="text-white">{activeGroup.name}</strong> (<span className="font-mono text-amber-300">{activeGroup.groupCode}</span>).
                Усі учасники втратять доступ до цієї групи.
              </p>

              <form onSubmit={handleDeleteGroupSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Введіть пароль групи для підтвердження:*
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords['deleteGroup'] ? "text" : "password"}
                      value={deleteGroupPasscode}
                      onChange={(e) => setDeleteGroupPasscode(e.target.value)}
                      placeholder="Пароль групи"
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-black/50 border border-red-500/30 text-sm focus:outline-none focus:border-red-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('deleteGroup')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      {showPasswords['deleteGroup'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {deleteGroupError && (
                  <p className="text-xs p-3 rounded-xl border leading-relaxed bg-red-500/10 text-red-300 border-red-500/30">
                    {deleteGroupError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteGroupModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingGroup}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-md shadow-red-900/40"
                  >
                    {isDeletingGroup ? 'Видалення...' : 'Видалити групу'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Recovery Modal */}
        {showRecoveryModal && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <h4 className="font-bold text-base flex items-center gap-2">
                  🔑 Відновлення Нікнейму / Доступу
                </h4>
                <button
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryEmail('');
                    setRecoveryMessage('');
                    setRecoverySuccess(false);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Вкажіть вашу зареєстровану електронну пошту (Email). На цю пошту буде надіслано лист із вашим прив'язаним Нікнеймом та паролем доступу:
              </p>

              <form onSubmit={handleAccountRecoverySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Ваша електронна пошта (Email):*</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => {
                      setRecoveryEmail(e.target.value);
                      setRecoverySuccess(false);
                      setRecoveryMessage('');
                    }}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {recoveryMessage && (
                  <div className={`text-xs p-3 rounded-xl border leading-relaxed whitespace-pre-line ${
                    recoverySuccess
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-300 border-red-500/30'
                  }`}>
                    {recoveryMessage}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecoveryModal(false);
                      setRecoveryEmail('');
                      setRecoveryMessage('');
                      setRecoverySuccess(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                  >
                    Закрити
                  </button>
                  <button
                    type="submit"
                    disabled={isRecovering || recoverySuccess}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1"
                  >
                    {isRecovering ? 'Надсилання...' : recoverySuccess ? '✓ Лист надіслано' : '📧 Відновити та надіслати'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Publish Conflict Modal */}
        {publishConflictModal?.show && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4">
              <h4 className="font-bold text-base text-amber-400">Проєкт вже існує</h4>
              <p className="text-sm text-gray-300">
                У вашій скрині вже є проєкт з назвою <b>{pubTitle}</b>. Бажаєте оновити існуючий проєкт чи створити новий?
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => setPublishConflictModal(null)}
                  className="px-4 py-2 text-xs rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={async () => {
                    const { existingId, projectData, finalGroupId, personalVisibility } = publishConflictModal;
                    setPublishConflictModal(null);
                    await executePublish(pubTitle.trim(), true, existingId, projectData, finalGroupId, personalVisibility);
                  }}
                  className="px-4 py-2 text-xs rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors font-medium"
                >
                  Оновити існуючий
                </button>
                <button
                  onClick={async () => {
                    const { projectData, finalGroupId, personalVisibility } = publishConflictModal;
                    const newTitle = pubTitle.trim() + ' (Копія)';
                    setPubTitle(newTitle); // Update the title field if needed, but not required since we pass it directly
                    setPublishConflictModal(null);
                    await executePublish(newTitle, false, undefined, projectData, finalGroupId, personalVisibility);
                  }}
                  className="px-4 py-2 text-xs rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium"
                >
                  Створити новий
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Confirmation Modal (for deleting/updating) */}
        {actionPasscodeModal.show && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-sm w-full space-y-4 shadow-2xl relative">
              <h4 className={`font-bold text-base flex items-center gap-2 ${
                actionPasscodeModal.action === 'delete' ? 'text-red-400' :
                actionPasscodeModal.action === 'make_public' ? 'text-emerald-400' :
                actionPasscodeModal.action === 'make_private' ? 'text-amber-400' :
                'text-white'
              }`}>
                {actionPasscodeModal.action === 'delete' ? '🗑️ Видалення проєкту' :
                 actionPasscodeModal.action === 'make_public' ? '🌐 Публікація у Загальну галерею' :
                 actionPasscodeModal.action === 'make_private' ? '🔒 Прибрання із Загальної галереї' :
                 '🔐 Підтвердження дії'}
              </h4>

              {actionPasscodeModal.action === 'delete' ? (
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  ⚠️ <strong>Увага!</strong> Ви збираєтеся остаточно видалити цей проєкт. Цю дію неможливо скасувати. Ви дійсно бажаєте продовжити?
                </p>
              ) : actionPasscodeModal.action === 'make_public' ? (
                <p className="text-xs text-gray-300 leading-relaxed font-medium bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
                  🌐 <strong>Публікація у Загальну галерею:</strong><br />
                  Ви збираєтеся опублікувати цей проєкт у Загальній галереї. Він стане доступним для перегляду та завантаження усією спільнотою ВереTkа. Ви зможете прибрати його назад у будь-який момент.
                </p>
              ) : actionPasscodeModal.action === 'make_private' ? (
                <p className="text-xs text-gray-300 leading-relaxed font-medium bg-amber-950/30 p-3 rounded-xl border border-amber-500/30">
                  🔒 <strong>Прибрання із Загальної галереї:</strong><br />
                  Ви збираєтеся прибрати цей проєкт із Загальної галереї. Він залишиться збереженим у вашій особистій скрині і більше не буде доступний іншим користувачам.
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-300">
                    Вкажіть пароль проєкту/автора для підтвердження:
                  </p>
                  <div className="relative mt-2">
                    <input
                      type={showPasswords['actionPasscode'] ? "text" : "password"}
                      placeholder="Введіть пароль"
                      value={promptPasscode}
                      onChange={(e) => setPromptPasscode(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-black/50 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('actionPasscode')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      {showPasswords['actionPasscode'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
                    setPromptPasscode('');
                  }}
                  className="px-3.5 py-2 text-xs rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-xs rounded-xl text-white font-bold transition-colors shadow-md ${
                    actionPasscodeModal.action === 'delete'
                      ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                      : actionPasscodeModal.action === 'make_public'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : actionPasscodeModal.action === 'make_private'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                >
                  {actionPasscodeModal.action === 'delete' ? '🗑️ Так, видалити' :
                   actionPasscodeModal.action === 'make_public' ? '🌐 Так, опублікувати' :
                   actionPasscodeModal.action === 'make_private' ? '🔒 Так, прибрати' :
                   'Підтвердити'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send to Group Modal */}
        {sendToGroupModal.show && sendToGroupModal.project && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 shadow-2xl relative">
              <button
                onClick={() => {
                  setSendToGroupModal({ show: false, project: null });
                  setSendGroupError(null);
                  setSendGroupSuccess(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
              >
                <XIcon size={18} />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-lg">
                  🏫
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Надіслати у групу / осередок</h4>
                  <p className="text-xs text-amber-300/80 truncate max-w-[280px]">
                    Проєкт: "{sendToGroupModal.project.title}"
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Код групи або осередка:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Введіть код (наприклад: UA-8392)"
                      value={sendGroupCodeInput}
                      onChange={(e) => handleSendGroupCodeChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-amber-500/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 uppercase tracking-wider font-mono"
                      autoFocus
                    />
                    {isSearchingSendGroup && (
                      <div className="absolute right-3 top-2.5 text-xs text-amber-400 animate-spin">
                        ⏳
                      </div>
                    )}
                  </div>
                </div>

                {/* Found group preview card */}
                {sendGroupInfo && (
                  <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/30 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-amber-200">
                        {sendGroupInfo.name || 'Осередок спільноти'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        sendGroupInfo.mode === 'education'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : sendGroupInfo.mode === 'readonly'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {sendGroupInfo.mode === 'education' ? '🎓 Освітня' :
                         sendGroupInfo.mode === 'readonly' ? '🔒 Дошка шаблонів' :
                         '🖼️ Галерея'}
                      </span>
                    </div>
                    {sendGroupInfo.description && (
                      <p className="text-xs text-gray-300 line-clamp-2">{sendGroupInfo.description}</p>
                    )}
                    <div className="text-[11px] text-gray-400 flex justify-between pt-1 border-t border-amber-500/10">
                      <span>Засновник: @{sendGroupInfo.creatorNickname || 'анонім'}</span>
                      <span>Код: {sendGroupInfo.groupCode}</span>
                    </div>

                    {sendGroupInfo.mode === 'readonly' && 
                     (sendGroupInfo.creatorNickname || '').trim().toLowerCase() !== (personalNickname || '').trim().toLowerCase() && (
                      <div className="p-2 bg-red-950/40 rounded-lg border border-red-500/30 text-[11px] text-red-300 leading-relaxed mt-1">
                        ⚠️ Ця група працює у режимі "Дошка шаблонів" (readonly). Публікувати нові роботи сюди дозволено лише її засновнику (@{sendGroupInfo.creatorNickname}).
                      </div>
                    )}
                  </div>
                )}

                {/* Quick selection from My Groups */}
                {myUserGroups.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                      Або оберіть зі своїх осередків:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {myUserGroups.map((g) => (
                        <button
                          key={g.groupCode}
                          type="button"
                          onClick={() => handleSelectGroupFromList(g)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs border transition-all text-left flex items-center gap-1.5 ${
                            sendGroupCodeInput === g.groupCode
                              ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-semibold'
                              : 'bg-black/30 text-gray-300 border-gray-800 hover:border-gray-600 hover:text-white'
                          }`}
                        >
                          <span>🏫</span>
                          <span className="truncate max-w-[130px]">{g.name || g.groupCode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {sendGroupError && (
                  <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 font-medium">
                    {sendGroupError}
                  </div>
                )}
                {sendGroupSuccess && (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                    {sendGroupSuccess}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setSendToGroupModal({ show: false, project: null });
                    setSendGroupError(null);
                    setSendGroupSuccess(null);
                  }}
                  className="px-3.5 py-2 text-xs rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendToGroup}
                  disabled={!sendGroupCodeInput.trim() || isSendingToGroup}
                  className="px-4 py-2 text-xs rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold transition-colors shadow-md shadow-amber-600/30 flex items-center gap-1.5"
                >
                  {isSendingToGroup ? (
                    <>
                      <span className="animate-spin">⏳</span> Надсилання...
                    </>
                  ) : (
                    <>🏫 Надіслати у групу</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sent Groups List Modal */}
        {selectedSentGroupsProject && (
          <div 
            className="fixed inset-0 z-[10025] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn cursor-pointer"
            onClick={() => setSelectedSentGroupsProject(null)}
          >
            <div 
              className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 relative shadow-2xl overflow-hidden cursor-default max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedSentGroupsProject(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-gray-700 transition-colors z-10"
                title="Закрити"
              >
                <XIcon size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-800 pb-3 pr-8">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/30 shrink-0">
                  🏫
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white">Групи з копією проєкту</h3>
                  <p className="text-xs text-amber-300/90 truncate max-w-[240px]">"{selectedSentGroupsProject.title}"</p>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-gray-800">
                Копію цього проєкту збережено/надіслано у такі групи та осередки:
              </p>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px] max-h-[300px]">
                {(() => {
                  const groups = selectedSentGroupsProject.sentToGroups && selectedSentGroupsProject.sentToGroups.length > 0
                    ? selectedSentGroupsProject.sentToGroups
                    : selectedSentGroupsProject.groupId
                    ? [{ groupId: selectedSentGroupsProject.groupId, groupName: selectedSentGroupsProject.groupName || selectedSentGroupsProject.groupId }]
                    : [];

                  if (groups.length === 0) {
                    return (
                      <div className="py-6 text-center text-xs text-gray-400">
                        Інформація про групи відсутня
                      </div>
                    );
                  }

                  return groups.map((g, idx) => (
                    <div 
                      key={g.groupId + '_' + idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-amber-500/20 hover:border-amber-500/40 transition-colors gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{g.groupName || g.groupId}</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30 font-bold shrink-0">
                            {g.groupId}
                          </span>
                        </div>
                        {g.sentAt && (
                          <p className="text-[10px] text-gray-500">
                            Надіслано: {new Date(g.sentAt).toLocaleDateString('uk-UA')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(g.groupId);
                            setSentGroupCopyStatus(g.groupId);
                            setTimeout(() => setSentGroupCopyStatus(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-medium border border-indigo-500/30 transition-colors"
                        >
                          {sentGroupCopyStatus === g.groupId ? '✓ Скопійовано' : '📋 Код'}
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setSelectedSentGroupsProject(null);
                            setActiveTab('group');
                            setGroupCodeInput(g.groupId);
                            const savedPass = savedGroupPasscodes[g.groupId] || '';
                            setGroupPasscodeInput(savedPass);
                            handleGroupLogin(undefined, savedPass);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white text-[11px] font-medium border border-amber-500/30 transition-colors"
                        >
                          🏫 Перейти
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="pt-2 border-t border-gray-800 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedSentGroupsProject(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
                >
                  Закрити
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
                  interactive={false}
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

        {/* Group Settings Modal */}
        {showGroupSettingsModal && activeGroup && (
          <div 
            className="fixed inset-0 z-[10008] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setShowGroupSettingsModal(false)}
          >
            <div 
              className="bg-[var(--bg-secondary,#1e1e2e)] text-[var(--text-primary,#ffffff)] p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-lg w-full space-y-5 relative shadow-2xl overflow-hidden cursor-default max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGroupSettingsModal(false)}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors"
                title="Закрити"
              >
                <XIcon size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30 shrink-0">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Налаштування групи</h3>
                  <p className="text-xs text-gray-400">"{activeGroup.name}" ({activeGroup.groupCode})</p>
                </div>
              </div>

              {/* Quick Copy Links */}
              <div className="bg-black/40 p-3 rounded-xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Код групи: <strong className="text-amber-300 font-mono">{activeGroup.groupCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeGroup.groupCode);
                      setCopyStatusText('Код скопійовано!');
                      setTimeout(() => setCopyStatusText(''), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-medium transition-colors"
                  >
                    📋 Скопіювати код
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Пряме посилання:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/?group=${activeGroup.groupCode}`;
                      navigator.clipboard.writeText(link);
                      setCopyStatusText('Посилання скопійовано!');
                      setTimeout(() => setCopyStatusText(''), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[11px] font-medium transition-colors"
                  >
                    🔗 Скопіювати посилання
                  </button>
                </div>
                {copyStatusText && (
                  <p className="text-[11px] text-emerald-400 text-right font-medium">{copyStatusText}</p>
                )}
              </div>

              {/* Info Block */}
              <div className="text-xs text-gray-400 space-y-1 bg-black/20 p-3 rounded-xl border border-gray-800">
                <div>Засновник: <strong className="text-gray-200">@{activeGroup.creatorNickname || 'Анонім'}</strong></div>
                <div>Ваша роль: <strong className="text-indigo-300">
                  {isPersonalLoggedIn && activeGroup.creatorNickname?.trim().toLowerCase() === personalNickname.trim().toLowerCase()
                    ? '👑 Засновник групи (Повний доступ)'
                    : '👤 Учасник групи'}
                </strong></div>
              </div>

              {/* Editable parameters for creator */}
              {isPersonalLoggedIn && activeGroup.creatorNickname?.trim().toLowerCase() === personalNickname.trim().toLowerCase() ? (
                <form onSubmit={handleSaveGroupSettingsSubmit} className="space-y-3 pt-2 border-t border-gray-800">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Редагування даних групи (Засновник):</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Назва групи:*</label>
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Опис групи:</label>
                    <input
                      type="text"
                      value={editGroupDesc}
                      onChange={(e) => setEditGroupDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Режим роботи групи:</label>
                    <select
                      value={editGroupMode}
                      onChange={(e) => setEditGroupMode(e.target.value as GroupMode)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    >
                      <option value="gallery" className="bg-gray-900">🎨 Спільна майстерня (Всі бачать все)</option>
                      <option value="education" className="bg-gray-900">🏫 Освітній клас (Учні бачать лише свої роботи)</option>
                      <option value="readonly" className="bg-gray-900">🔒 Дошка шаблонів (Публікує лише засновник)</option>
                    </select>
                  </div>

                  {editGroupMode === 'education' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                      <label className="block text-xs font-semibold text-amber-200">
                        🎓 Правило повторного надсилання робіт учнями:
                      </label>
                      <div className="space-y-1 text-[11px]">
                        <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                          <input
                            type="radio"
                            name="editStudentPolicy"
                            value="allow_overwrite"
                            checked={editGroupStudentPolicy === 'allow_overwrite'}
                            onChange={() => setEditGroupStudentPolicy('allow_overwrite')}
                            className="mt-0.5 accent-amber-500"
                          />
                          <div>
                            <span className="font-semibold text-white">🟢 Вільне оновлення (дозволити перезапис)</span>
                            <p className="text-[10px] text-gray-400">Учень може оновлювати існуючу здану роботу — стара версія перезаписується.</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                          <input
                            type="radio"
                            name="editStudentPolicy"
                            value="create_versions"
                            checked={editGroupStudentPolicy === 'create_versions'}
                            onChange={() => setEditGroupStudentPolicy('create_versions')}
                            className="mt-0.5 accent-amber-500"
                          />
                          <div>
                            <span className="font-semibold text-white">🔵 Авто-версіонування (зберігати v2, v3...)</span>
                            <p className="text-[10px] text-gray-400">Кожне повторне надсилання створює окрему нову версію роботи для відстеження прогресу.</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors">
                          <input
                            type="radio"
                            name="editStudentPolicy"
                            value="freeze_after_submit"
                            checked={editGroupStudentPolicy === 'freeze_after_submit'}
                            onChange={() => setEditGroupStudentPolicy('freeze_after_submit')}
                            className="mt-0.5 accent-amber-500"
                          />
                          <div>
                            <span className="font-semibold text-white">🔒 Фіксація здачі (заборона повторного оновлення)</span>
                            <p className="text-[10px] text-gray-400">Після здачі учень не може оновити цей же проєкт (ідеально для контрольних робіт).</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Новий пароль групи (залиште порожнім, якщо не змінюєте):</label>
                    <input
                      type="password"
                      value={editGroupNewPasscode}
                      onChange={(e) => setEditGroupNewPasscode(e.target.value)}
                      placeholder="Новий пароль"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {groupSettingsError && (
                    <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{groupSettingsError}</p>
                  )}
                  {groupSettingsMessage && (
                    <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{groupSettingsMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingGroupSettings}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-900/30"
                  >
                    {isSavingGroupSettings ? 'Збереження...' : '💾 Зберегти зміни в групі'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-gray-400 italic bg-black/30 p-3 rounded-xl border border-gray-800">
                  Змінювати назву, режим та пароль групи має право лише її Засновник.
                </p>
              )}

              {/* Action buttons transferred here: Leave & Delete */}
              <div className="pt-3 border-t border-gray-800 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Дії з групою:</h4>
                
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      setActiveGroup(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    🚪 Вийти з групи
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      setDeleteGroupError('');
                      setDeleteGroupPasscode('');
                      setShowDeleteGroupModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs bg-red-600/80 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    🗑️ Видалити групу
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Members Modal */}
        {showGroupMembersModal && activeGroup && (
          <div 
            className="fixed inset-0 z-[10008] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setShowGroupMembersModal(false)}
          >
            <div 
              className="bg-[var(--bg-secondary,#1e1e2e)] text-[var(--text-primary,#ffffff)] p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-md w-full space-y-4 relative shadow-2xl overflow-hidden cursor-default max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGroupMembersModal(false)}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors"
                title="Закрити"
              >
                <XIcon size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30 shrink-0">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Учасники групи</h3>
                  <p className="text-xs text-gray-400">
                    "{activeGroup.name}" • Всього: <strong className="text-indigo-300">{groupMembersList.length}</strong>
                  </p>
                </div>
              </div>

              {/* Member search input */}
              <div>
                <input
                  type="text"
                  placeholder="🔍 Пошук учасника за ім'ям або нікнеймом..."
                  value={groupMemberSearchQuery}
                  onChange={(e) => setGroupMemberSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-gray-700 text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
                {isLoadingGroupMembers ? (
                  <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <VeretkaLoader size="sm" />
                    <span>Завантаження списку учасників...</span>
                  </div>
                ) : groupMembersList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-gray-400">
                    У цій групі ще немає зареєстрованих учасників
                  </div>
                ) : (
                  groupMembersList
                    .filter(m => 
                      !groupMemberSearchQuery.trim() ||
                      m.nickname.toLowerCase().includes(groupMemberSearchQuery.toLowerCase()) ||
                      (m.authorName && m.authorName.toLowerCase().includes(groupMemberSearchQuery.toLowerCase()))
                    )
                    .map((m) => {
                      const displayName = m.authorName || m.nickname;
                      const initials = displayName.slice(0, 2).toUpperCase();
                      const isCreator = m.role === 'creator';
                      
                      return (
                        <div 
                          key={m.nickname}
                          className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-gray-800/80 hover:border-gray-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                              isCreator ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-900/40' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{displayName}</span>
                                {m.authorName && (
                                  <span className="text-[10px] text-gray-400 font-mono">(@{m.nickname})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                                <span>🎨 {m.projectsCount} {m.projectsCount === 1 ? 'проєкт' : (m.projectsCount >= 2 && m.projectsCount <= 4) ? 'проєкти' : 'проєктів'} у групі</span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium shrink-0 border ${
                            isCreator 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          }`}>
                            {isCreator ? '👑 Засновник' : '👤 Учасник'}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="pt-2 border-t border-gray-800 text-right">
                <button
                  type="button"
                  onClick={() => setShowGroupMembersModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-colors"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Group Conflict Resolution Modal */}
        {groupConflictModal.show && groupConflictModal.projectToCopy && (
          <div className="fixed inset-0 z-[10025] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary,#1e1e2e)] text-white p-6 rounded-2xl border border-[var(--border-color,#313244)] max-w-lg w-full space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                <h4 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  ⚠️ Виявлено дублікат проєкту
                </h4>
                <button
                  type="button"
                  onClick={() => setGroupConflictModal(prev => ({ ...prev, show: false }))}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl space-y-2 text-xs">
                <p className="text-amber-200">
                  У групі <strong className="text-white">"{groupConflictModal.groupName}"</strong> вже є проєкт з назвою <strong className="text-amber-300 font-semibold">"{groupConflictModal.existingProject?.title || groupConflictModal.projectToCopy.title}"</strong> від цього ж автора (<span className="text-indigo-300">@{personalNickname}</span>).
                </p>
                {groupConflictModal.studentUpdatePolicy === 'freeze_after_submit' && (
                  <p className="p-2 rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 font-medium">
                    🔒 <strong>Правило групи: Фіксація здачі.</strong> Оновлення існуючого проєкту заборонено автором групи. Ви можете опублікувати його як нову копію з іншою назвою.
                  </p>
                )}
                {groupConflictModal.studentUpdatePolicy === 'create_versions' && (
                  <p className="p-2 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-medium">
                    🔵 <strong>Правило групи: Авто-версіонування.</strong> Для відстеження вашого навчального прогресу рекомендується створити нову версію.
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                {/* Option 1: Update Existing */}
                <button
                  type="button"
                  disabled={isResolvingConflict || groupConflictModal.studentUpdatePolicy === 'freeze_after_submit'}
                  onClick={() => handleResolveConflictAction('overwrite')}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    groupConflictModal.studentUpdatePolicy === 'freeze_after_submit'
                      ? 'opacity-40 cursor-not-allowed bg-black/20 border-gray-800 text-gray-500'
                      : 'bg-amber-600/10 hover:bg-amber-600/20 border-amber-500/40 text-amber-100 hover:border-amber-400'
                  }`}
                >
                  <span className="text-xl shrink-0">🔄</span>
                  <div>
                    <div className="font-bold text-xs text-white">Оновити існуючий проєкт у групі</div>
                    <div className="text-[11px] text-gray-300 mt-0.5">
                      Перезаписати вміст існуючого проєкту новою версією. Зручно для доопрацювання завдання.
                    </div>
                  </div>
                </button>

                {/* Option 2: Publish as New Copy */}
                <button
                  type="button"
                  disabled={isResolvingConflict}
                  onClick={() => handleResolveConflictAction('new_copy', groupConflictModal.nextSuggestedTitle)}
                  className="w-full p-3 rounded-xl border border-indigo-500/40 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-100 hover:border-indigo-400 text-left transition-all flex items-start gap-3"
                >
                  <span className="text-xl shrink-0">📄</span>
                  <div>
                    <div className="font-bold text-xs text-white">Опублікувати як окрему копію (автоверсія)</div>
                    <div className="text-[11px] text-gray-300 mt-0.5">
                      Створити копію з автоматичною наступною вільною версією: <span className="text-indigo-300 font-mono font-bold">"{groupConflictModal.nextSuggestedTitle || `${groupConflictModal.projectToCopy.title} (v.2)`}"</span>
                    </div>
                  </div>
                </button>

                {/* Option 3: Custom Rename */}
                <div className="p-3 rounded-xl border border-gray-700 bg-black/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✏️</span>
                    <span className="font-bold text-xs text-white">Вказати власну назву чи версію для копії</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupConflictModal.customTitleInput}
                      onChange={(e) => setGroupConflictModal(prev => ({ ...prev, customTitleInput: e.target.value }))}
                      placeholder={`Наприклад, ${groupConflictModal.nextSuggestedTitle || 'Проєкт (v.5)'}`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-gray-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={isResolvingConflict || !groupConflictModal.customTitleInput.trim()}
                      onClick={() => handleResolveConflictAction('custom_title')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                    >
                      Зберегти
                    </button>
                  </div>
                </div>
              </div>

              {conflictError && (
                <p className="text-xs p-3 rounded-xl bg-red-500/10 text-red-300 border border-red-500/30">
                  {conflictError}
                </p>
              )}

              <div className="pt-2 border-t border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setGroupConflictModal(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                >
                  ❌ Скасувати надсилання
                </button>
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
