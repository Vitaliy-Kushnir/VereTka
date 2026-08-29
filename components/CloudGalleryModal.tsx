import { useLanguage } from "./LanguageContext";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { XIcon, EyeIcon, EyeOffIcon } from './icons';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Download, 
  Share2, 
  Move, 
  Layers, 
  ExternalLink,
  Info
} from 'lucide-react';
import { VeretkaLoader } from './VeretkaLoader';
import { generateSvg, getOrderedShapesFromParsed } from '../lib/exportUtils';
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

export const formatProjectDate = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatProjectDateTime = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isProjectUpdated = (proj: { createdAt?: number; updatedAt?: number }) => {
  if (!proj.updatedAt || !proj.createdAt) return false;
  return proj.updatedAt - proj.createdAt > 60000;
};

function filterAndSortProjects(
  projects: CloudProject[],
  query: string,
  visFilter: VisibilityFilterOption,
  shFilter: ShapesFilterOption,
  sort: SortOption
): CloudProject[] {
  let list = [...projects];

  if (((query) || "").trim()) {
    const q = ((query) || "").trim().toLowerCase();
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
      case 'newest': {
        const timeA = Math.max(a.updatedAt || 0, a.createdAt || 0);
        const timeB = Math.max(b.updatedAt || 0, b.createdAt || 0);
        return timeB - timeA;
      }
      case 'oldest': {
        const timeA = a.createdAt || a.updatedAt || 0;
        const timeB = b.createdAt || b.updatedAt || 0;
        return timeA - timeB;
      }
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
  searchPlaceholder,
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
  const { t } = useLanguage();
  searchPlaceholder = searchPlaceholder || t("cloud.gallery.001");
  const isFiltered =
    ((searchQuery) || "").trim() !== '' ||
    shapesFilter !== 'all' ||
    (showVisibilityFilter && visibilityFilter !== 'all') ||
    sortBy !== 'newest';

  return (
    <div className="bg-[var(--bg-primary)] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] space-y-2.5 sm:space-y-3">
      {/* Top Row: Full width Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors"
        />
        <span className="absolute left-3 top-2.5 sm:top-3 text-xs text-[var(--text-tertiary)] pointer-events-none">🔍</span>
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-2.5 sm:top-3 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            title={t('cloud.gallery.002')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Second Row: Filters Group */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <div className="grid grid-cols-2 xs:flex xs:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[var(--bg-secondary)] px-2 sm:px-3 py-1.5 rounded-xl border border-[var(--border-secondary)] text-xs flex-1 min-w-0">
            <span className="text-[var(--text-secondary)] font-medium whitespace-nowrap text-[10px] sm:text-xs shrink-0">{t('cloud.gallery.003')}</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-[11px] sm:text-xs font-medium w-full min-w-0 truncate"
            >
              <option value="newest" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.004')}</option>
              <option value="oldest" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.005')}</option>
              <option value="title_asc" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.006')}</option>
              <option value="title_desc" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.007')}</option>
              <option value="shapes_desc" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.008')}</option>
              <option value="shapes_asc" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.009')}</option>
            </select>
          </div>

          {/* Shapes Count Filter */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[var(--bg-secondary)] px-2 sm:px-3 py-1.5 rounded-xl border border-[var(--border-secondary)] text-xs flex-1 min-w-0">
            <span className="text-[var(--text-secondary)] font-medium whitespace-nowrap text-[10px] sm:text-xs shrink-0">{t('cloud.gallery.010')}</span>
            <select
              value={shapesFilter}
              onChange={(e) => onShapesFilterChange(e.target.value as ShapesFilterOption)}
              className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-[11px] sm:text-xs font-medium w-full min-w-0 truncate"
            >
              <option value="all" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.011')}</option>
              <option value="small" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.012')}</option>
              <option value="medium" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.013')}</option>
              <option value="large" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.014')}</option>
            </select>
          </div>

          {/* Visibility Filter (if enabled) */}
          {showVisibilityFilter && onVisibilityFilterChange && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[var(--bg-secondary)] px-2 sm:px-3 py-1.5 rounded-xl border border-[var(--border-secondary)] text-xs col-span-2 xs:col-span-1 flex-1 min-w-0">
              <span className="text-[var(--text-secondary)] font-medium whitespace-nowrap text-[10px] sm:text-xs shrink-0">{t('cloud.gallery.015')}</span>
              <select
                value={visibilityFilter}
                onChange={(e) => onVisibilityFilterChange(e.target.value as VisibilityFilterOption)}
                className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer text-[11px] sm:text-xs font-medium w-full min-w-0 truncate"
              >
                <option value="all" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.016')}</option>
                <option value="public" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.017')}</option>
                <option value="private" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.018')}</option>
                <option value="group" className="bg-[var(--bg-primary)] text-[var(--text-primary)]">{t('cloud.gallery.019')}</option>
              </select>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl text-xs bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/25 border border-[var(--accent-primary)]/30 transition-colors flex items-center justify-center gap-1 col-span-2 xs:col-span-1 font-medium"
              title={t('cloud.gallery.020')}
            >
              {t('cloud.gallery.021')}
            </button>
          )}
        </div>
      </div>

      {/* Stats bar & Reset button */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-[var(--text-secondary)] pt-1 border-t border-[var(--border-primary)] flex-wrap gap-1">
        <div>
          <span>{t('cloud.gallery.022')} <strong className="text-[var(--text-primary)]">{filteredCount}</strong></span>
          {typeof totalCount === 'number' && (
            <span className="text-[var(--text-tertiary)] ml-1">{t('cloud.gallery.023')} {totalCount})</span>
          )}
        </div>
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-[11px] sm:text-xs text-[var(--accent-primary)] hover:underline transition-colors flex items-center gap-1 font-medium"
          >
            {t('cloud.gallery.024')}
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
  const { t } = useLanguage();
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const isInteractive = interactive && allowClickModal;

  useEffect(() => {
    if (!projectData) return;
    try {
      const parsed = JSON.parse(projectData);
      const shapes = getOrderedShapesFromParsed(parsed);
      const w = parsed.canvasSettings?.width || 800;
      const h = parsed.canvasSettings?.height || 600;
      const bg = parsed.canvasSettings?.bgColor || '#ffffff';

      if (shapes && shapes.length > 0) {
        const svgStr = generateSvg(shapes, w, h, bg);
        const encoded = unescape(encodeURIComponent(svgStr));
        setThumbUrl(`data:image/svg+xml;base64,${btoa(encoded)}`);
      } else if (parsed.thumbnail) {
        setThumbUrl(parsed.thumbnail);
      } else {
        setThumbUrl(null);
      }
    } catch (e) {
      console.error('Error generating thumbnail:', e);
    }
  }, [projectData]);

  return (
    <div
      onClick={isInteractive ? onOpenLargePreview : undefined}
      className={`relative w-full h-44 bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-primary)] mb-3 flex items-center justify-center p-2 transition-all shrink-0 select-none group ${
        isInteractive
          ? 'cursor-pointer hover:border-[var(--accent-primary)] hover:shadow-lg hover:shadow-[var(--accent-primary)]/20'
          : ''
      }`}
      title={isInteractive ? t('cloud.gallery.025') : title}
    >
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
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
        <div className="text-[var(--text-tertiary)] text-xs text-center z-10 flex flex-col items-center justify-center gap-2 p-2">
          <VeretkaLoader size="sm" className="w-8 h-8" />
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium line-clamp-1">{title || t('cloud.gallery.026')}</span>
        </div>
      )}

      {isInteractive && (
        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-[var(--bg-app)]/90 via-[var(--bg-app)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
          <span className="text-[10px] text-[var(--accent-text)] bg-[var(--accent-primary)] px-2.5 py-0.5 rounded-full font-medium shadow-sm">
            {t('cloud.gallery.027')}
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
  const { t } = useLanguage();
  const [largeThumbUrl, setLargeThumbUrl] = useState<string | null>(null);
  const [rawSvgContent, setRawSvgContent] = useState<string | null>(null);
  const [canvasInfo, setCanvasInfo] = useState<{
    width: number;
    height: number;
    bgColor: string;
    shapesCount: number;
  }>({
    width: 800,
    height: 600,
    bgColor: '#ffffff',
    shapesCount: 0
  });

  const [zoomMode, setZoomMode] = useState<'fit' | 'actual' | 'custom'>('fit');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0
  });

  // Touch pinch-to-zoom state
  const touchStartRef = useRef<{ dist: number; initialZoom: number } | null>(null);

  useEffect(() => {
    if (!project || !project.projectData) return;
    try {
      const parsed = JSON.parse(project.projectData);
      const shapes = getOrderedShapesFromParsed(parsed);
      const w = parsed.canvasSettings?.width || 800;
      const h = parsed.canvasSettings?.height || 600;
      const bg = parsed.canvasSettings?.bgColor || '#ffffff';
      
      setCanvasInfo({
        width: w,
        height: h,
        bgColor: bg,
        shapesCount: shapes.length || project.shapesCount || 0
      });

      if (shapes && shapes.length > 0) {
        try {
          const svgStr = generateSvg(shapes, w, h, bg);
          setRawSvgContent(svgStr);
          const encoded = unescape(encodeURIComponent(svgStr));
          setLargeThumbUrl(`data:image/svg+xml;base64,${btoa(encoded)}`);
          return;
        } catch (svgErr) {
          console.error('Error generating SVG for preview:', svgErr);
        }
      }

      if (parsed.thumbnail) {
        setLargeThumbUrl(parsed.thumbnail);
        setRawSvgContent(null);
      }
    } catch (e) {
      console.error('Error generating large preview:', e);
    }
  }, [project]);

  // Reset view to 'fit' when a new project opens
  useEffect(() => {
    setZoomMode('fit');
    setZoomLevel(100);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [project?.id]);

  // Ctrl / Cmd + Mouse Wheel Zoom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 15 : -15;
        setZoomMode('custom');
        setZoomLevel(prev => Math.min(400, Math.max(25, Math.round((prev + delta) / 5) * 5)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !scrollContainerRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch Pinch-to-Zoom support on Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        initialZoom: zoomMode === 'fit' ? 100 : zoomLevel
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStartRef.current.dist;
      const newZoom = Math.min(400, Math.max(25, Math.round((touchStartRef.current.initialZoom * scale) / 5) * 5));
      setZoomMode('custom');
      setZoomLevel(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleZoomIn = () => {
    setZoomMode('custom');
    setZoomLevel(prev => Math.min(400, Math.round((prev + 25) / 25) * 25));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setZoomLevel(prev => Math.max(25, Math.round((prev - 25) / 25) * 25));
  };

  const handleSetFit = () => {
    setZoomMode('fit');
    setZoomLevel(100);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleSetActual = () => {
    setZoomMode('actual');
    setZoomLevel(100);
  };

  const handleDownloadSvg = () => {
    if (!rawSvgContent && !largeThumbUrl) return;
    if (rawSvgContent) {
      const blob = new Blob([rawSvgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'project'}_preview.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (largeThumbUrl) {
      const a = document.createElement('a');
      a.href = largeThumbUrl;
      a.download = `${project?.title || 'project'}_preview.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!project) return null;

  const targetWidth = zoomMode === 'actual' ? canvasInfo.width : Math.round((canvasInfo.width * zoomLevel) / 100);
  const targetHeight = zoomMode === 'actual' ? canvasInfo.height : Math.round((canvasInfo.height * zoomLevel) / 100);

  return (
    <div 
      className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl border border-[var(--border-primary)] w-full max-w-[98vw] 2xl:max-w-[1700px] h-[94vh] sm:h-[96vh] max-h-[98vh] shadow-2xl flex flex-col overflow-hidden relative cursor-default select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shrink-0 z-20">
          {/* Left: Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-base sm:text-xl border border-[var(--accent-primary)]/30 shrink-0 shadow-inner">
              🎨
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-bold text-xs sm:text-base text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-xs md:max-w-md" title={project.title}>
                  {project.title}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 shrink-0" title={t('cloud.gallery.preview.canvas') || "Розмір полотна"}>
                  {canvasInfo.width} × {canvasInfo.height} px
                </span>
                <span className="hidden xs:inline-block text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-secondary)] shrink-0">
                  {t('cloud.gallery.030') || "Об'єктів:"} <strong className="text-[var(--text-secondary)]">{canvasInfo.shapesCount}</strong>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                {t('cloud.gallery.029')} <span className="text-[var(--text-secondary)] font-medium">{project.authorName}</span> (@{project.ownerNickname})
              </p>
            </div>
          </div>

          {/* Right: Controls & Top-Right Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleSetFit}
                className={`px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                  zoomMode === 'fit'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
                title={t('cloud.gallery.preview.fit') || "Вписати повністю у вікно"}
              >
                <Maximize2 size={13} />
                <span className="hidden sm:inline">{t('cloud.gallery.preview.fit') || "Вписати"}</span>
              </button>

              <button
                type="button"
                onClick={handleSetActual}
                className={`px-1.5 sm:px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                  zoomMode === 'actual'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
                title={t('cloud.gallery.preview.actual') || "100% реальний розмір полотна"}
              >
                <span>100%</span>
              </button>

              <div className="h-3.5 w-px bg-[var(--border-secondary)] mx-0.5" />

              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 25}
                className="p-1 sm:p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 rounded-lg transition-colors"
                title={t('cloud.gallery.preview.zoomOut') || "Зменшити"}
              >
                <ZoomOut size={13} />
              </button>

              <span className="text-[10px] sm:text-[11px] font-mono font-medium px-1 text-[var(--text-secondary)] min-w-[32px] sm:min-w-[38px] text-center">
                {zoomMode === 'fit' ? 'Auto' : `${zoomLevel}%`}
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 400}
                className="p-1 sm:p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 rounded-lg transition-colors"
                title={t('cloud.gallery.preview.zoomIn') || "Збільшити"}
              >
                <ZoomIn size={13} />
              </button>
            </div>

            {/* Close Modal Button positioned at top right */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] transition-all active:scale-95 shadow-xs"
              title={t('cloud.gallery.028') || "Закрити"}
              aria-label="Закрити перегляд"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Center Canvas Viewport */}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 min-h-0 w-full bg-[var(--bg-secondary)] relative overflow-auto overscroll-contain select-none ${
            isDragging ? 'cursor-grabbing' : (zoomMode !== 'fit' ? 'cursor-grab' : 'cursor-default')
          }`}
          style={{
            scrollbarWidth: 'thin',
            touchAction: zoomMode === 'fit' ? 'auto' : 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Subtle Grid Backdrop */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {largeThumbUrl ? (
            <div className="min-w-full min-h-full flex p-3 sm:p-6 md:p-8">
              <div 
                className="m-auto transition-all duration-100 flex items-center justify-center shrink-0"
                style={
                  zoomMode === 'fit'
                    ? {
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }
                    : {
                        width: `${targetWidth}px`,
                        height: `${targetHeight}px`,
                        minWidth: `${targetWidth}px`,
                        minHeight: `${targetHeight}px`,
                      }
                }
              >
                {/* Canvas Shadow & Frame Container */}
                <div 
                  className="relative rounded-xl shadow-2xl border border-[var(--border-primary)] overflow-hidden flex items-center justify-center group"
                  style={{
                    backgroundColor: canvasInfo.bgColor || '#ffffff',
                    boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(128, 128, 128, 0.1)',
                    ...(zoomMode === 'fit'
                      ? {
                          maxWidth: '100%',
                          maxHeight: '100%',
                          aspectRatio: `${canvasInfo.width} / ${canvasInfo.height}`
                        }
                      : {
                          width: '100%',
                          height: '100%'
                        })
                  }}
                >
                  <img
                    src={largeThumbUrl}
                    alt={project.title}
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none select-none block"
                    style={{
                      backgroundColor: canvasInfo.bgColor || '#ffffff'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="min-w-full min-h-full flex items-center justify-center p-6">
              <div className="text-[var(--text-tertiary)] text-sm z-10 flex flex-col items-center gap-3 my-auto">
                <span className="text-4xl">🖼️</span>
                <span className="font-medium">{t('cloud.gallery.031')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[var(--text-tertiary)] flex-wrap">
            {(() => {
              const latestTime = Math.max(project.updatedAt || 0, project.createdAt || 0);
              return (
                <span title={formatProjectDateTime(latestTime)}>
                  {t('cloud.gallery.032') || 'Створено:'} <strong className="text-[var(--text-secondary)]">{formatProjectDate(latestTime)}</strong>
                </span>
              );
            })()}
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="hidden sm:inline">
              Тло: <span className="inline-block w-3 h-3 rounded-full border border-[var(--border-secondary)] align-middle ml-1 mr-0.5" style={{ backgroundColor: canvasInfo.bgColor }} /> <span className="font-mono">{canvasInfo.bgColor}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download SVG / Thumbnail button */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="py-2 px-3 sm:px-3.5 rounded-xl text-xs font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
              title={t('cloud.gallery.preview.downloadSvg') || "Завантажити зображення перегляду"}
            >
              <Download size={14} className="text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">{t('cloud.gallery.preview.downloadSvg') || "Завантажити SVG"}</span>
            </button>

            {/* Share Project */}
            <button
              type="button"
              onClick={() => onShare(project)}
              className="py-2 px-3 sm:px-3.5 rounded-xl text-xs font-medium bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Share2 size={14} />
              <span>{t('cloud.gallery.034') || "Поділитися"}</span>
            </button>

            {/* Open / Load Project in editor */}
            <button
              type="button"
              onClick={() => {
                onLoadProject(project.projectData, project.title);
                onClose();
              }}
              className="py-2 px-4 sm:px-5 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>{t('cloud.gallery.033') || "Відкрити в редакторі"}</span>
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
  const { t } = useLanguage();
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
  const [publicTotalCount, setPublicTotalCount] = useState<number>(0);
  const [isLoadingPublic, setIsLoadingPublic] = useState(true);
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
    if (personalAuthMode !== 'register' || !((regNickname) || "").trim() || ((regNickname) || "").trim().length < 2) {
      setNicknameTaken(false);
      setIsCheckingNickname(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingNickname(true);
      const exists = await checkNicknameExists(((regNickname) || "").trim());
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
    if (!((editGroupName) || "").trim()) {
      setGroupSettingsError(t('cloud.gallery.035'));
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
        name: ((editGroupName) || "").trim(),
        description: (editGroupDesc || '').trim(),
        mode: editGroupMode,
        studentUpdatePolicy: editGroupStudentPolicy
      } : null);

      if (((editGroupNewPasscode) || "").trim()) {
        localStorage.setItem('veretka_group_passcode', ((editGroupNewPasscode) || "").trim());
        if (isPersonalLoggedIn && personalNickname) {
          await saveGroupPasscodeToAccount(personalNickname, activeGroup.groupCode, ((editGroupNewPasscode) || "").trim());
          setSavedGroupPasscodes(prev => ({ ...prev, [activeGroup.groupCode.toUpperCase()]: ((editGroupNewPasscode) || "").trim() }));
        }
      }
    } else {
      setGroupSettingsError(res.message);
    }
  };

  // --- Publish Form State ---
  const [pubTitle, setPubTitle] = useState(currentProjectName || t('cloud.gallery.036'));
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
    if (!sendToGroupModal.project || !((sendGroupCodeInput) || "").trim()) return;
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
      setSendGroupError(res.message || t('cloud.gallery.037'));
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

    let targetTitle = projectToCopy.title || '';
    if (action === 'new_copy') {
      targetTitle = overrideTitle || nextSuggestedTitle || `${projectToCopy.title || 'Без назви'} (v.2)`;
    } else if (action === 'custom_title') {
      targetTitle = (overrideTitle || groupConflictModal.customTitleInput || projectToCopy.title || '').trim();
    } else if (action === 'overwrite' && existingProject) {
      targetTitle = existingProject.title || '';
    }

    // Check if targetTitle already exists in the group for this user
    if (action !== 'overwrite') {
      const isTaken = (existingUserTitlesInGroup || []).some(
        t => (t || '').trim().toLowerCase() === (targetTitle || '').trim().toLowerCase()
      );
      if (isTaken) {
        setConflictError(
          `Проєкт із назвою "${targetTitle}" вже існує в цьому осередку від вашого імені. Будь ласка, оберіть іншу версію (наприклад, ${nextSuggestedTitle || t('cloud.gallery.038')}).`
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
      setConflictError(res.message || t('cloud.gallery.039'));
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
    if (pubIsGroup && ((pubGroupCode) || "").trim()) {
      getGroupInfoByCode(((pubGroupCode) || "").trim()).then(setFetchedGroupInfo);
    } else if (!((pubGroupCode) || "").trim()) {
      setFetchedGroupInfo(null);
    }
  }, [pubIsGroup, pubGroupCode]);

  // Load public projects when tab is selected, modal opens, or searchQuery changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'public') return;

    if (!((searchQuery) || '').trim()) {
      setIsLoadingPublic(true);
      loadPublicProjects('');
    } else {
      setIsLoadingPublic(true);
      const timer = setTimeout(() => {
        loadPublicProjects(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, searchQuery]);

  const loadPublicProjects = async (queryStr = searchQuery) => {
    setIsLoadingPublic(true);
    setHasMorePublic(true);
    try {
      const res = ((queryStr) || "").trim()
        ? await searchPublicProjects(queryStr, 12, null)
        : await getPublicProjectsPaginated(12, null);
      setPublicProjects(res.projects);
      setPublicLastVisible(res.lastVisible);
      setPublicTotalCount(res.totalCount ?? res.projects.length);
      if (res.projects.length >= (res.totalCount ?? res.projects.length) || res.projects.length < 12) {
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
      const res = ((searchQuery) || "").trim()
        ? await searchPublicProjects(searchQuery, 12, publicLastVisible)
        : await getPublicProjectsPaginated(12, publicLastVisible);
      setPublicProjects((prev) => {
        const next = [...prev, ...res.projects];
        if (next.length >= (res.totalCount ?? publicTotalCount) || res.projects.length < 12) {
          setHasMorePublic(false);
        }
        return next;
      });
      setPublicLastVisible(res.lastVisible);
      if (res.totalCount !== undefined) {
        setPublicTotalCount(res.totalCount);
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
    if (!((personalNickname) || "").trim() || !((personalPasscode) || "").trim()) {
      setPersonalError(t('cloud.gallery.040'));
      return;
    }

    setPersonalError('');
    setIsLoadingPersonal(true);
    const res = await loginUserAccount(personalNickname, personalPasscode);
    setIsLoadingPersonal(false);

    if (res.success && res.projects) {
      const activeNick = res.nickname || ((personalNickname) || "").trim();
      setIsPersonalLoggedIn(true);
      setPersonalNickname(activeNick);
      setPersonalProjects(res.projects);
      localStorage.setItem('veretka_nickname', activeNick);
      localStorage.setItem('veretka_passcode', ((personalPasscode) || "").trim());

      if (returnToPublishAfterLogin) {
        setReturnToPublishAfterLogin(false);
        setActiveTab('publish');
      }
    } else {
      setPersonalError(res.message || t('cloud.gallery.041'));
    }
  };

  // Personal Cabinet Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!((regNickname) || "").trim()) {
      setPersonalError(t('cloud.gallery.042'));
      return;
    }
    if (nicknameTaken) {
      setPersonalError(t('cloud.gallery.043'));
      return;
    }
    if (!((regPasscode) || "").trim()) {
      setPersonalError(t('cloud.gallery.044'));
      return;
    }
    if (regPasscode !== regConfirmPasscode) {
      setPersonalError(t('cloud.gallery.045'));
      return;
    }

    setPersonalError('');
    setIsLoadingPersonal(true);
    const res = await registerUserAccount({
      nickname: ((regNickname) || "").trim(),
      authorName: ((regAuthorName) || "").trim(),
      passcode: ((regPasscode) || "").trim(),
      email: ((regEmail) || "").trim(),
    });

    if (res.success && res.nickname) {
      setPersonalNickname(res.nickname);
      setPersonalPasscode(((regPasscode) || "").trim());
      localStorage.setItem('veretka_nickname', res.nickname);
      localStorage.setItem('veretka_passcode', ((regPasscode) || "").trim());
      if (((regAuthorName) || "").trim()) {
        localStorage.setItem('veretka_author_name', ((regAuthorName) || "").trim());
      }

      const pRes = await getPersonalProjects(res.nickname, ((regPasscode) || "").trim());
      setPersonalProjects(pRes.projects || []);
      setIsPersonalLoggedIn(true);

      if (returnToPublishAfterLogin) {
        setReturnToPublishAfterLogin(false);
        setActiveTab('publish');
      }
    } else {
      setPersonalError(res.message || t('cloud.gallery.046'));
    }
    setIsLoadingPersonal(false);
  };

  // Google Sign-In / Register Handler
  const handleGoogleSignIn = async () => {
    setPersonalError('');
    setIsLoadingPersonal(true);

    if (personalAuthMode === 'register') {
      let passcodeToUse = ((regPasscode) || "").trim();
      if (!passcodeToUse) {
        const promptPass = prompt(t('cloud.gallery.047'));
        if (!promptPass || ((promptPass) || "").trim().length < 3) {
          setPersonalError(t('cloud.gallery.048'));
          setIsLoadingPersonal(false);
          return;
        }
        passcodeToUse = ((promptPass) || "").trim();
        setRegPasscode(passcodeToUse);
      }

      const res = await signInWithGoogleAccount(((regNickname) || "").trim(), passcodeToUse);
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
        setPersonalError(res.message || t('cloud.gallery.049'));
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
        setPersonalError(res.message || t('cloud.gallery.050'));
      }
    }
  };

  // Account Recovery Handler
  const handleAccountRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!((recoveryEmail) || "").trim()) {
      setRecoveryMessage(t('cloud.gallery.051'));
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
      setCurrentAccountEmail(res.email !== undefined ? res.email : ((editEmailInput) || "").trim().toLowerCase());
      setCurrentAccountAuthorName(res.authorName !== undefined ? res.authorName : ((editAuthorNameInput) || "").trim());
      if (res.authorName) {
        localStorage.setItem('veretka_author_name', res.authorName);
        setPubAuthorName(res.authorName);
      }
      if (((editNewPasscode) || "").trim()) {
        setPersonalPasscode(((editNewPasscode) || "").trim());
        localStorage.setItem('veretka_passcode', ((editNewPasscode) || "").trim());
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
      alert(t('cloud.gallery.052'));
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
    
    const code = ((groupCodeInput) || "").trim();
    const isCreatorBypass = isPersonalLoggedIn && personalNickname;
    let passcodeToUse = bypassPasscode || ((groupPasscodeInput) || "").trim();

    if (!code) {
      setGroupError(t('cloud.gallery.053'));
      return;
    }
    
    // If no explicit passcode and we have a saved one for this group, use it
    if (!passcodeToUse && savedGroupPasscodes[code.toUpperCase()]) {
      passcodeToUse = savedGroupPasscodes[code.toUpperCase()];
    }

    if (!passcodeToUse && !isCreatorBypass) {
      setGroupError(t('cloud.gallery.054'));
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
      setGroupError(res.message || t('cloud.gallery.055'));
    }
    setIsLoadingGroup(false);
  };

  // Create Group
  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!((newGroupName) || "").trim() || !((newGroupCode) || "").trim() || !((newGroupPasscode) || "").trim()) {
      setGroupError(t('cloud.gallery.056'));
      return;
    }
    if (newGroupPasscode !== newGroupConfirmPasscode) {
      setGroupError(t('cloud.gallery.057'));
      return;
    }

    setGroupError('');
    setIsLoadingGroup(true);
    const res = await createCloudGroup({
      name: newGroupName,
      description: newGroupDesc,
      groupCode: newGroupCode,
      passcode: newGroupPasscode,
      creatorNickname: newGroupCreator || t('cloud.gallery.058'),
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
      setGroupError(res.message || t('cloud.gallery.059'));
    }
  };

  const executePublish = async (titleToUse: string, isUpdate: boolean, existingId?: string, projectDataStr?: string, finalGroupId?: string, personalVisibility?: ProjectVisibility) => {
    setIsPublishing(true);
    setPublishStatusMessage(t('cloud.gallery.060'));
    
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
          authorName: pubAuthorName || personalNickname || t('cloud.gallery.061'),
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
          authorName: pubAuthorName || personalNickname || t('cloud.gallery.062'),
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

      setPublishStatusMessage(t('cloud.gallery.063'));
      setIsPublishing(false);

      // Open share modal automatically with generated cloud link
      setShareModalProject({
        id: newDocId,
        title: titleToUse,
        authorName: pubAuthorName || t('cloud.gallery.064'),
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
      setPublishStatusMessage(err.message || t('cloud.gallery.065'));
    }
  };

  // Publish Form Handler
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!((pubTitle) || "").trim()) {
      setPublishStatusMessage(t('cloud.gallery.066'));
      return;
    }

    if (!isPersonalLoggedIn) {
      setPublishStatusMessage(t('cloud.gallery.067'));
      setReturnToPublishAfterLogin(true);
      setActiveTab('personal');
      setPersonalAuthMode('login');
      return;
    }

    const activeNick = ((personalNickname) || "").trim() || ((pubNickname) || "").trim();
    const activePass = ((personalPasscode) || "").trim() || ((pubPasscode) || "").trim();

    if (!activeNick || !activePass) {
      setPublishStatusMessage(t('cloud.gallery.068'));
      return;
    }

    const projectData = getCurrentProjectDataStr();
    if (!projectData || projectData === '[]') {
      setPublishStatusMessage(t('cloud.gallery.069'));
      return;
    }

    setIsPublishing(true);
    setPublishStatusMessage(t('cloud.gallery.070'));

    try {
      let finalGroupId = '';
      if (pubIsGroup) {
        finalGroupId = ((pubGroupCode) || "").trim().toUpperCase();
        if (!finalGroupId) {
          setPublishStatusMessage(t('cloud.gallery.071'));
          setIsPublishing(false);
          return;
        }
      }

      const personalVisibility = pubIsPublic ? 'public' : 'private';

      let existingId = '';
      if (isPersonalLoggedIn && personalNickname === ((pubNickname) || "").trim().toLowerCase()) {
        const existing = personalProjects.find(p => p.title.toLowerCase() === ((pubTitle) || "").trim().toLowerCase() && !p.isGroupCopy && p.visibility !== 'group');
        if (existing) existingId = existing.id;
      } else {
        const res = await getPersonalProjects(pubNickname, pubPasscode);
        if (res.success && res.projects) {
          const existing = res.projects.find(p => p.title.toLowerCase() === ((pubTitle) || "").trim().toLowerCase() && !p.isGroupCopy && p.visibility !== 'group');
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

      await executePublish(((pubTitle) || "").trim(), false, undefined, projectData, finalGroupId, personalVisibility);
    } catch (err: any) {
      setIsPublishing(false);
      setPublishStatusMessage(err.message || t('cloud.gallery.072'));
    }
  };

  // Handle Project Passcode Actions (Delete, Change Visibility)
  const handleConfirmAction = async () => {
    const { projectId, action, targetGroupCode } = actionPasscodeModal;
    if (!projectId) return;

    if (action === 'delete') {
      const res = await deleteProjectFromCloud(
        projectId,
        ((promptPasscode) || "").trim() || personalPasscode,
        isPersonalLoggedIn ? personalNickname : ''
      );
      if (res.success) {
        setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
        setPromptPasscode('');
        // Refresh
        loadPublicProjects();
        if (isPersonalLoggedIn) handlePersonalLogin();
        if (activeGroup) getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
      } else {
        alert(res.message || t('cloud.gallery.073'));
      }
    } else {
      const passToUse = ((promptPasscode) || "").trim() || personalPasscode;
      if (!passToUse) {
        alert(t('cloud.gallery.074'));
        return;
      }
      if (action === 'make_public' || action === 'make_private') {
        const passToUse = personalPasscode || ((promptPasscode) || "").trim();
        const newVis = action === 'make_public' ? 'public' : 'private';
        const res = await updateProjectVisibility(projectId, passToUse, newVis, '', '', isPersonalLoggedIn ? personalNickname : '');
        if (res.success) {
          setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
          setPromptPasscode('');
          loadPublicProjects();
          if (isPersonalLoggedIn) handlePersonalLogin();
        } else {
          alert(res.message || t('cloud.gallery.075'));
        }
      } else if (action === 'make_group') {
        const passToUse = ((promptPasscode) || "").trim() || personalPasscode;
        const code = targetGroupCode || prompt(t('cloud.gallery.076'));
        if (!code) return;
        const res = await copyProjectToGroup(projectId, passToUse, code.toUpperCase(), '', personalNickname);
        if (res.success) {
          setActionPasscodeModal({ show: false, projectId: '', action: 'delete' });
          setPromptPasscode('');
          if (isPersonalLoggedIn) handlePersonalLogin();
          if (activeGroup) getGroupProjects(activeGroup.groupCode).then(setGroupProjects);
        } else {
          alert(res.message || t('cloud.gallery.077'));
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
    if (!((editProjectTitle) || "").trim()) {
      alert(t('cloud.gallery.078'));
      return;
    }
    
    setIsSavingProjectDetails(true);
    const res = await updateProjectDetailsInCloud(
      projectId,
      projPasscode,
      ((editProjectTitle) || "").trim(),
      (editProjectDesc || '').trim(),
      isPersonalLoggedIn ? personalNickname : ''
    );
    setIsSavingProjectDetails(false);

    if (res.success) {
      // Update local states
      const updateList = (list: CloudProject[]) => 
        list.map(p => p.id === projectId ? { ...p, title: ((editProjectTitle) || "").trim(), description: (editProjectDesc || '').trim(), updatedAt: Date.now() } : p);
      
      setPersonalProjects(updateList);
      setGroupProjects(updateList);
      setPublicProjects(updateList);
      setEditingProjectId(null);
    } else {
      alert(res.message || t('cloud.gallery.079'));
    }
  };

  if (!isOpen) return null;

  const filteredPublicProjects = publicProjects;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--modal-overlay)] backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] flex items-center justify-center p-1 sm:p-1.5 shadow-sm shrink-0">
              <VeretkaLogoIcon className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm xs:text-base sm:text-xl font-bold tracking-tight sm:tracking-wide truncate">{t('cloud.gallery.080')}</h2>
              <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] truncate">{t('cloud.gallery.081')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 relative shrink-0">
            {isPersonalLoggedIn ? (
              <div className="relative mr-1 sm:mr-2" ref={accountDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] transition-colors text-left"
                  title={t('cloud.gallery.082')}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-[var(--accent-text)] text-[10px] sm:text-xs font-bold shrink-0 shadow-sm">
                    {personalNickname ? personalNickname.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] sm:text-xs font-bold text-[var(--text-primary)] truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[120px]">@{personalNickname}</span>
                    {(currentAccountAuthorName || pubAuthorName) && (
                      <span className="text-[9px] sm:text-[10px] text-[var(--text-tertiary)] truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[120px] -mt-0.5 font-normal hidden xs:inline">
                        {currentAccountAuthorName || pubAuthorName}
                      </span>
                    )}
                  </div>
                </button>

                {showAccountDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium">{t('cloud.gallery.083')}</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">@{personalNickname}</p>
                      {currentAccountAuthorName && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{t('cloud.gallery.084')} {currentAccountAuthorName}</p>
                      )}
                      {currentAccountEmail && (
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">{currentAccountEmail}</p>
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
                        className="w-full text-left px-3 py-2 rounded-lg text-xs bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] transition-colors flex items-center gap-2 font-medium"
                      >
                        {t('cloud.gallery.085')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPersonalLoggedIn(false);
                          setPersonalProjects([]);
                          setShowAccountDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors flex items-center gap-2"
                      >
                        {t('cloud.gallery.086')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('personal');
                    setPersonalAuthMode('login');
                  }}
                  className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors"
                >
                  {t('cloud.gallery.087')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('personal');
                    setPersonalAuthMode('register');
                  }}
                  className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors"
                >
                  {t('cloud.gallery.088')}
                </button>
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              title={t('cloud.gallery.089')}
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 sm:px-6 gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('public')}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'public'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('cloud.gallery.090')}
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('cloud.gallery.091')}
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === 'group'
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('cloud.gallery.092')}
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-auto ${
              activeTab === 'publish'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-emerald-600/80 dark:text-emerald-400/80 hover:text-emerald-500'
            }`}
          >
            {t('cloud.gallery.093')}
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">

          {/* ==================== TAB 1: PUBLIC GALLERY ==================== */}
          {activeTab === 'public' && (
            <div className="space-y-4">
              <FilterToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('cloud.gallery.094')}
                sortBy={sortBy}
                onSortChange={setSortBy}
                shapesFilter={shapesFilter}
                onShapesFilterChange={setShapesFilter}
                onRefresh={() => loadPublicProjects(searchQuery)}
                totalCount={publicTotalCount > 0 ? publicTotalCount : publicProjects.length}
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
                  <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">{t('cloud.gallery.095')}</div>
                </div>
              ) : displayedPublicProjects.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-secondary)]">
                  <p className="text-base font-medium">
                    {publicProjects.length === 0 ? t('cloud.gallery.096') : t('cloud.gallery.097')}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {publicProjects.length === 0
                      ? t('cloud.gallery.098')
                      : t('cloud.gallery.099')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {displayedPublicProjects.map((proj) => (
                    <div 
                      key={proj.id} 
                      className="bg-[var(--bg-secondary)] p-3 sm:p-4 rounded-xl border border-[var(--border-secondary)] hover:border-[var(--accent-primary)]/50 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <ProjectCardPreview
                          projectData={proj.projectData}
                          title={proj.title}
                          onOpenLargePreview={() => setLargePreviewProject(proj)}
                        />
                        <div className="mb-2">
                          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate" title={proj.title}>
                            {proj.title}
                          </h3>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2" title={proj.description}>{proj.description}</p>
                        )}
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">
                          {t('cloud.gallery.101')} <span className="text-[var(--text-secondary)] font-medium">{proj.authorName}</span> (@{proj.ownerNickname})
                        </p>
                        <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5 flex-wrap mb-3">
                          <span>{t('cloud.gallery.102')} <strong className="text-[var(--text-secondary)]">{proj.shapesCount}</strong></span>
                          <span className="opacity-40">•</span>
                          {(() => {
                            const latestTime = Math.max(proj.updatedAt || 0, proj.createdAt || 0);
                            return (
                              <span title={formatProjectDateTime(latestTime)}>
                                {t('cloud.gallery.032') || 'Створено:'} <span className="text-[var(--text-secondary)] font-medium">{formatProjectDate(latestTime)}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-secondary)]">
                        <button
                          onClick={() => {
                            onLoadProject(proj.projectData, proj.title);
                            onClose();
                          }}
                          className="flex-1 py-2 sm:py-1.5 px-3 rounded-lg text-xs font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] transition-colors shadow-xs"
                        >
                          {t('cloud.gallery.103')}
                        </button>
                        <button
                          onClick={() => setShareModalProject(proj)}
                          className="py-2 sm:py-1.5 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 transition-colors"
                          title={t('cloud.gallery.104')}
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
                    className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors flex items-center gap-2"
                  >
                    {isLoadingMorePublic ? (
                       <>
                         <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                         {t('cloud.gallery.105')}
                       </>
                    ) : (
                      t('cloud.gallery.106')
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: PERSONAL SPACE ==================== */}
          {activeTab === 'personal' && (
            <div className="space-y-4 sm:space-y-6">
              {!isPersonalLoggedIn ? (
                <div className="max-w-md mx-auto bg-[var(--bg-secondary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-secondary)] space-y-4">
                  
                  {/* Auth Mode Toggle */}
                  <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-secondary)]">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonalAuthMode('login');
                        setPersonalError('');
                      }}
                      className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${
                        personalAuthMode === 'login'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t('cloud.gallery.107')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPersonalAuthMode('register');
                        setPersonalError('');
                      }}
                      className={`flex-1 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${
                        personalAuthMode === 'register'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t('cloud.gallery.108')}
                    </button>
                  </div>

                  {personalAuthMode === 'login' ? (
                    /* LOGIN FORM */
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{t('cloud.gallery.109')}</h3>
                        <p className="text-[11px] sm:text-xs text-[var(--text-tertiary)] mt-1">
                          {t('cloud.gallery.110')}
                        </p>
                      </div>

                      <form onSubmit={handlePersonalLogin} className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] font-medium mb-1">{t('cloud.gallery.111')}</label>
                          <input
                            type="text"
                            placeholder={t('cloud.gallery.112')}
                            value={personalNickname}
                            onChange={(e) => setPersonalNickname(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                            required
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs text-[var(--text-secondary)] font-medium">{t('cloud.gallery.113')}</label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRecoveryModal(true);
                                setRecoveryMessage('');
                              }}
                              className="text-[11px] text-[var(--accent-primary)] hover:underline"
                            >
                              {t('cloud.gallery.114')}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswords['login'] ? "text" : "password"}
                              placeholder={t('cloud.gallery.115')}
                              value={personalPasscode}
                              onChange={(e) => setPersonalPasscode(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePassword('login')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              {showPasswords['login'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                          </div>
                        </div>

                        {personalError && (
                          <p className="text-xs text-red-500 dark:text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                            {personalError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isLoadingPersonal}
                          className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-medium text-sm transition-colors shadow-sm"
                        >
                          {isLoadingPersonal ? t('cloud.gallery.116') : t('cloud.gallery.117')}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* REGISTRATION FORM */
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{t('cloud.gallery.118')}</h3>
                        <p className="text-[11px] sm:text-xs text-[var(--text-tertiary)] mt-1">
                          {t('cloud.gallery.119')}
                        </p>
                      </div>

                      <form onSubmit={handleRegisterSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] font-medium mb-1">{t('cloud.gallery.120')}</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder={t('cloud.gallery.121')}
                              value={regNickname}
                              onChange={(e) => setRegNickname(e.target.value)}
                              className={`w-full px-3 py-2 pr-9 rounded-xl bg-[var(--bg-primary)] border text-sm focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors ${
                                nicknameTaken
                                  ? 'border-red-500 focus:border-red-500'
                                  : ((regNickname) || "").trim().length >= 2 && !isCheckingNickname
                                  ? 'border-emerald-500 focus:border-emerald-500'
                                  : 'border-[var(--border-secondary)] focus:border-[var(--accent-primary)]'
                              }`}
                              required
                            />
                            {isCheckingNickname && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <div className="w-3.5 h-3.5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          {nicknameTaken && (
                            <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 flex items-center gap-1 font-medium">
                              {t('cloud.gallery.122')}
                            </p>
                          )}
                          {!nicknameTaken && ((regNickname) || "").trim().length >= 2 && !isCheckingNickname && (
                            <p className="text-[11px] text-emerald-500 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                              {t('cloud.gallery.123')}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] font-medium mb-1">{t('cloud.gallery.124')} <span className="text-[var(--text-tertiary)] font-normal">{t('cloud.gallery.125')}</span>:</label>
                          <input
                            type="text"
                            placeholder={t('cloud.gallery.126')}
                            value={regAuthorName}
                            onChange={(e) => setRegAuthorName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] font-medium mb-1">{t('cloud.gallery.127')}</label>
                          <div className="relative">
                            <input
                              type={showPasswords['reg'] ? "text" : "password"}
                              placeholder={t('cloud.gallery.128')}
                              value={regPasscode}
                              onChange={(e) => setRegPasscode(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePassword('reg')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              {showPasswords['reg'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] font-medium mb-1">{t('cloud.gallery.129')}</label>
                          <div className="relative">
                            <input
                              type={showPasswords['regConfirm'] ? "text" : "password"}
                              placeholder={t('cloud.gallery.130')}
                              value={regConfirmPasscode}
                              onChange={(e) => setRegConfirmPasscode(e.target.value)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => togglePassword('regConfirm')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              {showPasswords['regConfirm'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-[var(--text-secondary)] font-medium mb-1">
                            {t('cloud.gallery.131')} <span className="text-[var(--text-tertiary)] font-normal">{t('cloud.gallery.132')}</span>
                          </label>
                          <input
                            type="email"
                            placeholder={t('cloud.gallery.133')}
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                          />
                          <div className="mt-1.5 p-2.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[11px] text-[var(--accent-primary)] leading-relaxed flex items-start gap-2">
                            <span className="shrink-0 text-base">ℹ️</span>
                            <span>
                              <strong>{t('cloud.gallery.134')}</strong> {t('cloud.gallery.135')}
                            </span>
                          </div>
                        </div>

                        {personalError && (
                          <p className="text-xs text-red-500 dark:text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                            {personalError}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isLoadingPersonal}
                          className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-medium text-sm transition-colors shadow-sm"
                        >
                          {isLoadingPersonal ? t('cloud.gallery.136') : t('cloud.gallery.137')}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Google Login Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border-secondary)]"></div>
                    </div>
                    <span className="relative bg-[var(--bg-secondary)] px-3 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
                      {t('cloud.gallery.138')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoadingPersonal}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium text-xs border border-[var(--border-secondary)] transition-all flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>
                      {personalAuthMode === 'register' ? t('cloud.gallery.139') : t('cloud.gallery.140')}
                    </span>
                  </button>

                  {personalAuthMode === 'register' && (
                    <p className="text-[10px] text-[var(--text-tertiary)] text-center mt-2 leading-relaxed">
                      {t('cloud.gallery.141')}
                    </p>
                  )}

                </div>
              ) : (
                <div className="space-y-4">
                  <FilterToolbar
                    searchQuery={personalSearchQuery}
                    onSearchChange={setPersonalSearchQuery}
                    searchPlaceholder={t('cloud.gallery.142')}
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
                      <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">{t('cloud.gallery.143')}</div>
                    </div>
                  ) : displayedPersonalProjects.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-secondary)]">
                      <p className="text-base font-medium">
                        {personalProjects.length === 0
                          ? t('cloud.gallery.144')
                          : t('cloud.gallery.145')}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {personalProjects.length === 0
                          ? t('cloud.gallery.146')
                          : t('cloud.gallery.147')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {displayedPersonalProjects.map((proj) => (
                        <div 
                          key={proj.id} 
                          className="bg-[var(--bg-secondary)] p-3 sm:p-4 rounded-xl border border-[var(--border-secondary)] hover:border-[var(--accent-primary)]/50 transition-all flex flex-col justify-between"
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
                                  className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--accent-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none"
                                />
                                <textarea
                                  value={editProjectDesc}
                                  onChange={(e) => setEditProjectDesc(e.target.value)}
                                  placeholder={t('cloud.gallery.148')}
                                  className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded text-xs text-[var(--text-secondary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveProjectDetails(proj.id, personalPasscode)}
                                    disabled={isSavingProjectDetails}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded font-medium shadow-xs"
                                  >
                                    {t('cloud.gallery.149')}
                                  </button>
                                  <button
                                    onClick={() => setEditingProjectId(null)}
                                    className="px-2 py-1 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] text-[10px] rounded"
                                  >
                                    {t('cloud.gallery.150')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2 group gap-1.5">
                                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate max-w-[130px] sm:max-w-[160px]" title={proj.title}>
                                    {proj.title}
                                  </h3>
                                  <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditingProjectId(proj.id);
                                        setEditProjectTitle(proj.title);
                                        setEditProjectDesc(proj.description || '');
                                      }}
                                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-opacity"
                                      title={t('cloud.gallery.151')}
                                    >
                                      ✏️
                                    </button>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                      proj.visibility === 'public'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                        : proj.visibility === 'group'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'
                                    }`}>
                                      {proj.visibility === 'public' ? t('cloud.gallery.152') : proj.visibility === 'group' ? `Група: ${proj.groupId}` : t('cloud.gallery.153')}
                                    </span>
                                    {((proj.sentToGroups && proj.sentToGroups.length > 0) || (proj.visibility === 'group' && proj.groupId)) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSentGroupsProject(proj);
                                        }}
                                        className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer font-medium shadow-xs"
                                        title={t('cloud.gallery.154')}
                                      >
                                        🏫 {proj.sentToGroups && proj.sentToGroups.length > 0 ? `У групах (${proj.sentToGroups.length})` : `Група: ${proj.groupId}`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {proj.description && (
                                  <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2" title={proj.description}>{proj.description}</p>
                                )}
                              </>
                            )}
                            <p className="text-xs text-[var(--text-tertiary)] mb-1">{t('cloud.gallery.155')} <span className="text-[var(--text-secondary)] font-medium">{proj.authorName}</span></p>
                            <div className="text-[11px] text-[var(--text-tertiary)] space-y-0.5 mb-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{t('cloud.gallery.156')} <strong className="text-[var(--text-secondary)]">{proj.shapesCount}</strong></span>
                                <span className="opacity-40">•</span>
                                <span title={formatProjectDateTime(proj.createdAt)}>
                                  {t('cloud.gallery.032') || 'Створено:'} <span className="text-[var(--text-secondary)] font-medium">{formatProjectDate(proj.createdAt)}</span>
                                </span>
                              </div>
                              {isProjectUpdated(proj) && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium" title={formatProjectDateTime(proj.updatedAt)}>
                                  <span>🔄</span>
                                  <span>Оновлено: {formatProjectDate(proj.updatedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-[var(--border-secondary)]">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  onLoadProject(proj.projectData, proj.title);
                                  onClose();
                                }}
                                className="flex-1 py-2 sm:py-1.5 px-3 rounded-lg text-xs font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] transition-colors shadow-xs"
                              >
                                {t('cloud.gallery.157')}
                              </button>
                              <button
                                onClick={() => setShareModalProject(proj)}
                                className="py-2 sm:py-1.5 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 transition-colors flex items-center gap-1 shrink-0"
                                title={t('cloud.gallery.158')}
                              >
                                {t('cloud.gallery.159')}
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
                                  className="flex-1 py-1.5 sm:py-1 px-2 rounded-lg sm:rounded text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition-colors"
                                >
                                  {t('cloud.gallery.160')}
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
                                  className="flex-1 py-1.5 sm:py-1 px-2 rounded-lg sm:rounded text-[11px] font-medium bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors"
                                >
                                  {t('cloud.gallery.161')}
                                </button>
                              )}

                              <button
                                onClick={() => openSendToGroupModal(proj)}
                                className="flex-1 py-1.5 sm:py-1 px-2 rounded-lg sm:rounded text-[11px] font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition-colors"
                              >
                                {t('cloud.gallery.162')}
                              </button>

                              <button
                                onClick={() => {
                                  setActionPasscodeModal({
                                    show: true,
                                    projectId: proj.id,
                                    action: 'delete'
                                  });
                                }}
                                className="py-1.5 sm:py-1 px-2.5 sm:px-2 rounded-lg sm:rounded text-[11px] bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/25 transition-colors shrink-0"
                                title={t('cloud.gallery.163')}
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
            <div className="space-y-4 sm:space-y-6">
              {!activeGroup ? (
                <div className="max-w-xl mx-auto bg-[var(--bg-secondary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-secondary)] space-y-4 sm:space-y-5">
                  <div className="flex flex-wrap rounded-xl bg-[var(--bg-primary)] p-1 border border-[var(--border-secondary)] gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGroupTabSubView('open');
                        setIsCreatingGroup(false);
                      }}
                      className={`flex-1 min-w-[100px] sm:min-w-[120px] py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center ${
                        groupTabSubView === 'open' && !isCreatingGroup ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t('cloud.gallery.164')}
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
                        className={`flex-1 min-w-[110px] sm:min-w-[140px] py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center flex items-center justify-center gap-1 ${
                          groupTabSubView === 'my_groups' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span>📋</span> {t('cloud.gallery.165')}
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
                        className={`flex-1 min-w-[110px] sm:min-w-[130px] py-1.5 px-2 text-xs font-medium rounded-lg transition-colors text-center ${
                          isCreatingGroup ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {t('cloud.gallery.166')}
                      </button>
                    )}
                  </div>
                  
                  {!isPersonalLoggedIn && groupTabSubView === 'open' && (
                    <div className="text-center p-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      {t('cloud.gallery.167')}
                    </div>
                  )}

                  {/* Sub-view 1: Login by Code */}
                  {groupTabSubView === 'open' && !isCreatingGroup && (
                    <form onSubmit={handleGroupLogin} className="space-y-3">
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">{t('cloud.gallery.168')}</label>
                        <input
                          type="text"
                          placeholder={t('cloud.gallery.169')}
                          value={groupCodeInput}
                          onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] uppercase"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                          {t('cloud.gallery.170')}
                          <span className="text-[10px] text-[var(--text-tertiary)] block">{t('cloud.gallery.171')}</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords['groupJoin'] ? "text" : "password"}
                            placeholder={t('cloud.gallery.172')}
                            value={groupPasscodeInput}
                            onChange={(e) => setGroupPasscodeInput(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                          />
                          <button
                            type="button"
                            onClick={() => togglePassword('groupJoin')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                          >
                            {showPasswords['groupJoin'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                      </div>

                      {groupError && (
                        <p className="text-xs text-red-500 dark:text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          {groupError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoadingGroup}
                        className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-medium text-sm transition-colors shadow-xs"
                      >
                        {isLoadingGroup ? t('cloud.gallery.173') : t('cloud.gallery.174')}
                      </button>
                    </form>
                  )}

                  {/* Sub-view 2: My Groups */}
                  {groupTabSubView === 'my_groups' && !isCreatingGroup && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-2">
                        <div>
                          <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            {t('cloud.gallery.175')}
                          </h3>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            {t('cloud.gallery.176')}
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
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors flex items-center gap-1"
                        >
                          {t('cloud.gallery.177')}
                        </button>
                      </div>

                      {isLoadingMyGroups ? (
                        <div className="text-center py-8 text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-2">
                          <VeretkaLoader size="sm" />
                          <span>{t('cloud.gallery.178')}</span>
                        </div>
                      ) : myUserGroups.length === 0 ? (
                        <div className="text-center py-8 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] p-5 space-y-3">
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            {t('cloud.gallery.179')}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setGroupTabSubView('create');
                              setIsCreatingGroup(true);
                              setNewGroupCreator(personalNickname);
                            }}
                            className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-xs font-semibold transition-colors shadow-xs"
                          >
                            {t('cloud.gallery.180')}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
                          {myUserGroups.map((g) => {
                            const isCreator = g.creatorNickname?.toLowerCase() === personalNickname.toLowerCase();
                            return (
                              <div
                                key={g.id || g.groupCode}
                                className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:border-[var(--accent-primary)]/50 p-3.5 rounded-xl transition-all space-y-2 flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{g.name}</h4>
                                      <span className="text-[10px] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-mono px-2 py-0.5 rounded border border-[var(--accent-primary)]/25 font-semibold">
                                        {g.groupCode}
                                      </span>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium shrink-0 ${
                                      isCreator ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                                    }`}>
                                      {isCreator ? t('cloud.gallery.181') : t('cloud.gallery.182')}
                                    </span>
                                  </div>

                                  {g.description && (
                                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{g.description}</p>
                                  )}

                                  <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1.5 pt-0.5">
                                    <span>{t('cloud.gallery.183')}</span>
                                    <span className="font-medium text-[var(--text-secondary)]">
                                      {g.mode === 'education' ? t('cloud.gallery.184') : g.mode === 'readonly' ? t('cloud.gallery.185') : t('cloud.gallery.186')}
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
                                  className="w-full py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-secondary)] transition-colors text-center mt-2"
                                >
                                  {t('cloud.gallery.187')}
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
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                          {t('cloud.gallery.188')}
                        </label>
                        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewGroupMode('gallery')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              newGroupMode === 'gallery'
                                ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)] shadow-xs'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-primary)]'
                            }`}
                          >
                            <span className="text-lg mb-1">🎨</span>
                            <div>
                              <div className="text-xs font-bold leading-tight text-[var(--text-primary)]">{t('cloud.gallery.189')}</div>
                              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t('cloud.gallery.190')}</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewGroupMode('education')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              newGroupMode === 'education'
                                ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)] shadow-xs'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-primary)]'
                            }`}
                          >
                            <span className="text-lg mb-1">🏫</span>
                            <div>
                              <div className="text-xs font-bold leading-tight text-[var(--text-primary)]">{t('cloud.gallery.191')}</div>
                              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t('cloud.gallery.192')}</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewGroupMode('readonly')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              newGroupMode === 'readonly'
                                ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)] shadow-xs'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-primary)]'
                            }`}
                          >
                            <span className="text-lg mb-1">📢</span>
                            <div>
                              <div className="text-xs font-bold leading-tight text-[var(--text-primary)]">{t('cloud.gallery.193')}</div>
                              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t('cloud.gallery.194')}</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Scenario Context Info */}
                      <div className="p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs leading-relaxed text-[var(--text-secondary)]">
                        {newGroupMode === 'education' && (
                          <div className="space-y-2">
                            <strong className="font-semibold block text-[var(--text-primary)]">{t('cloud.gallery.195')}</strong>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {t('cloud.gallery.196')}<br />
                              • <span className="text-[var(--accent-primary)] font-semibold">{t('cloud.gallery.197')}</span> {t('cloud.gallery.198')}<br />
                              {t('cloud.gallery.199')}
                            </p>

                            <div className="mt-3 pt-2 border-t border-[var(--border-secondary)] space-y-1.5">
                              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                                {t('cloud.gallery.200')}
                              </label>
                              <div className="space-y-1 text-[11px]">
                                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                                  <input
                                    type="radio"
                                    name="newStudentPolicy"
                                    value="allow_overwrite"
                                    checked={newGroupStudentPolicy === 'allow_overwrite'}
                                    onChange={() => setNewGroupStudentPolicy('allow_overwrite')}
                                    className="mt-0.5 accent-[var(--accent-primary)]"
                                  />
                                  <div>
                                    <span className="font-semibold text-[var(--text-primary)]">{t('cloud.gallery.201')}</span>
                                    <p className="text-[10px] text-[var(--text-tertiary)]">{t('cloud.gallery.202')}</p>
                                  </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                                  <input
                                    type="radio"
                                    name="newStudentPolicy"
                                    value="create_versions"
                                    checked={newGroupStudentPolicy === 'create_versions'}
                                    onChange={() => setNewGroupStudentPolicy('create_versions')}
                                    className="mt-0.5 accent-[var(--accent-primary)]"
                                  />
                                  <div>
                                    <span className="font-semibold text-[var(--text-primary)]">{t('cloud.gallery.203')}</span>
                                    <p className="text-[10px] text-[var(--text-tertiary)]">{t('cloud.gallery.204')}</p>
                                  </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                                  <input
                                    type="radio"
                                    name="newStudentPolicy"
                                    value="freeze_after_submit"
                                    checked={newGroupStudentPolicy === 'freeze_after_submit'}
                                    onChange={() => setNewGroupStudentPolicy('freeze_after_submit')}
                                    className="mt-0.5 accent-[var(--accent-primary)]"
                                  />
                                  <div>
                                    <span className="font-semibold text-[var(--text-primary)]">{t('cloud.gallery.205')}</span>
                                    <p className="text-[10px] text-[var(--text-tertiary)]">{t('cloud.gallery.206')}</p>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                        {newGroupMode === 'gallery' && (
                          <div className="space-y-1">
                            <strong className="font-semibold block text-[var(--text-primary)]">{t('cloud.gallery.207')}</strong>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {t('cloud.gallery.208')}<br />
                              {t('cloud.gallery.209')}<br />
                              {t('cloud.gallery.210')}
                            </p>
                          </div>
                        )}
                        {newGroupMode === 'readonly' && (
                          <div className="space-y-1">
                            <strong className="font-semibold block text-[var(--text-primary)]">{t('cloud.gallery.211')}</strong>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {t('cloud.gallery.212')}<br />
                              {t('cloud.gallery.213')}<br />
                              • <span className="text-[var(--accent-primary)] font-semibold">{t('cloud.gallery.214')}</span> {t('cloud.gallery.215')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Form Fields */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                          {newGroupMode === 'education' ? t('cloud.gallery.216') :
                           newGroupMode === 'readonly' ? t('cloud.gallery.217') :
                           t('cloud.gallery.218')}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            newGroupMode === 'education' ? t('cloud.gallery.219') :
                            newGroupMode === 'readonly' ? t('cloud.gallery.220') :
                            t('cloud.gallery.221')
                          }
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                          {t('cloud.gallery.222')}
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
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] uppercase font-mono tracking-wider"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.223')}</label>
                        <input
                          type="text"
                          placeholder={
                            newGroupMode === 'education' ? t('cloud.gallery.224') :
                            t('cloud.gallery.225')
                          }
                          value={newGroupDesc}
                          onChange={(e) => setNewGroupDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                          {newGroupMode === 'education' ? t('cloud.gallery.226') :
                           newGroupMode === 'readonly' ? t('cloud.gallery.227') :
                           t('cloud.gallery.228')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords['newGroup'] ? "text" : "password"}
                            placeholder={t('cloud.gallery.229')}
                            value={newGroupPasscode}
                            onChange={(e) => setNewGroupPasscode(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePassword('newGroup')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                          >
                            {showPasswords['newGroup'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                          {newGroupMode === 'education'
                            ? t('cloud.gallery.230')
                            : t('cloud.gallery.231')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.232')}</label>
                        <div className="relative">
                          <input
                            type={showPasswords['newGroupConfirm'] ? "text" : "password"}
                            placeholder={t('cloud.gallery.233')}
                            value={newGroupConfirmPasscode}
                            onChange={(e) => setNewGroupConfirmPasscode(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => togglePassword('newGroupConfirm')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                          >
                            {showPasswords['newGroupConfirm'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1">{t('cloud.gallery.234')}</label>
                        <input
                          type="text"
                          value={newGroupCreator}
                          disabled
                          className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-tertiary)] cursor-not-allowed font-mono"
                        />
                      </div>

                      {groupError && (
                        <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
                          {groupError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isLoadingGroup}
                        className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isLoadingGroup ? t('cloud.gallery.235') : t('cloud.gallery.236')}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[var(--bg-secondary)] p-3.5 sm:p-4 rounded-xl border border-[var(--border-primary)] gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs bg-[var(--accent-primary)]/15 text-[var(--text-primary)] px-2.5 py-0.5 rounded-lg font-mono border border-[var(--accent-primary)]/30 font-bold">
                          {activeGroup.groupCode}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{activeGroup.name}</h3>

                        {/* USER ROLE BADGE IN GROUP HEADER */}
                        {(() => {
                          const isCreator = isPersonalLoggedIn && activeGroup.creatorNickname?.trim().toLowerCase() === ((personalNickname) || "").trim().toLowerCase();
                          return (
                            <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] flex items-center gap-1">
                              {isCreator ? t('cloud.gallery.237') : isPersonalLoggedIn ? t('cloud.gallery.238') : t('cloud.gallery.239')}
                            </span>
                          );
                        })()}
                      </div>

                      {activeGroup.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{activeGroup.description}</p>
                      )}

                      <div className="mt-2 text-[11px] flex items-center gap-2">
                        <span className="text-[var(--text-tertiary)]">{t('cloud.gallery.240')}</span>
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-secondary)] font-medium">
                          {activeGroup.mode === 'education' ? t('cloud.gallery.241') : 
                           activeGroup.mode === 'readonly' ? t('cloud.gallery.242') : 
                           t('cloud.gallery.243')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenGroupMembers(activeGroup.groupCode)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold border border-[var(--border-secondary)] transition-colors flex items-center gap-1.5 shadow-xs"
                        title={t('cloud.gallery.244')}
                      >
                        {t('cloud.gallery.245')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenGroupSettings(activeGroup)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold border border-[var(--border-secondary)] transition-colors flex items-center gap-1.5 shadow-xs"
                        title={t('cloud.gallery.246')}
                      >
                        {t('cloud.gallery.247')}
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
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] font-medium border border-[var(--border-secondary)] transition-colors flex items-center gap-1"
                          title={t('cloud.gallery.248')}
                        >
                          {t('cloud.gallery.249')}
                        </button>
                      )}
                    </div>
                  </div>

                  <FilterToolbar
                    searchQuery={groupSearchQuery}
                    onSearchChange={setGroupSearchQuery}
                    searchPlaceholder={t('cloud.gallery.250')}
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
                      <div className="text-sm font-medium text-[var(--text-tertiary)] animate-pulse">{t('cloud.gallery.251')}</div>
                    </div>
                  ) : displayedGroupProjects.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-primary)]">
                      <p className="text-base font-medium text-[var(--text-primary)]">
                        {groupProjects.length === 0
                          ? t('cloud.gallery.252')
                          : t('cloud.gallery.253')}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {groupProjects.length === 0
                          ? t('cloud.gallery.254')
                          : t('cloud.gallery.255')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {displayedGroupProjects.map((proj) => (
                        <div 
                          key={proj.id} 
                          className="bg-[var(--bg-secondary)] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[var(--border-secondary)] hover:border-[var(--accent-primary)]/50 transition-all flex flex-col justify-between"
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
                                  className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--accent-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none"
                                />
                                <textarea
                                  value={editProjectDesc}
                                  onChange={(e) => setEditProjectDesc(e.target.value)}
                                  placeholder={t('cloud.gallery.256')}
                                  className="w-full px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-xs text-[var(--text-secondary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveProjectDetails(proj.id, personalPasscode)}
                                    disabled={isSavingProjectDetails}
                                    className="px-2.5 py-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-[11px] font-semibold rounded-lg"
                                  >
                                    {t('cloud.gallery.257')}
                                  </button>
                                  <button
                                    onClick={() => setEditingProjectId(null)}
                                    className="px-2.5 py-1 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[11px] font-medium rounded-lg border border-[var(--border-secondary)]"
                                  >
                                    {t('cloud.gallery.258')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2 group">
                                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate max-w-[150px]" title={proj.title}>
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
                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-opacity"
                                        title={t('cloud.gallery.259')}
                                      >
                                        ✏️
                                      </button>
                                    )}
                                    <span className="text-[10px] bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-secondary)] font-medium">
                                      {t('cloud.gallery.260')}
                                    </span>
                                  </div>
                                </div>
                                {proj.description && (
                                  <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2" title={proj.description}>{proj.description}</p>
                                )}
                              </>
                            )}
                            <p className="text-xs text-[var(--text-secondary)] mb-1">{t('cloud.gallery.261')} {proj.authorName} (@{proj.ownerNickname})</p>
                            <div className="text-[11px] text-[var(--text-tertiary)] space-y-0.5 mb-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{t('cloud.gallery.262')} <strong className="text-[var(--text-secondary)]">{proj.shapesCount}</strong></span>
                                <span className="opacity-40">•</span>
                                <span title={formatProjectDateTime(proj.createdAt)}>
                                  {t('cloud.gallery.032') || 'Створено:'} <span className="text-[var(--text-secondary)] font-medium">{formatProjectDate(proj.createdAt)}</span>
                                </span>
                              </div>
                              {isProjectUpdated(proj) && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium" title={formatProjectDateTime(proj.updatedAt)}>
                                  <span>🔄</span>
                                  <span>Оновлено: {formatProjectDate(proj.updatedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-secondary)]">
                            <button
                              onClick={() => {
                                onLoadProject(proj.projectData, proj.title);
                                onClose();
                              }}
                              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] transition-colors shadow-xs"
                            >
                              {t('cloud.gallery.263')}
                            </button>
                            <button
                              onClick={() => setShareModalProject(proj)}
                              className="py-1.5 px-2.5 rounded-xl text-xs font-medium bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors"
                              title={t('cloud.gallery.264')}
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
                              className="py-1.5 px-2.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors"
                              title={t('cloud.gallery.265')}
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
            <div className="max-w-xl mx-auto bg-[var(--bg-secondary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-secondary)] space-y-4">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{t('cloud.gallery.266')}</h3>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-1">
                  {t('cloud.gallery.267')} <span className="text-[var(--accent-primary)] font-semibold">{currentProjectShapesCount} {t('cloud.gallery.268')}</span>
                </p>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.269')}</label>
                  <input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    placeholder={t('cloud.gallery.270')}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    required
                  />
                </div>

                {!isPersonalLoggedIn ? (
                  <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-primary)] text-center space-y-3">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {t('cloud.gallery.271')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnToPublishAfterLogin(true);
                        setActiveTab('personal');
                        setPersonalAuthMode('login');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>🔓</span>
                      <span>{t('cloud.gallery.272')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.273')}</label>
                      <input
                        type="text"
                        value={pubAuthorName}
                        onChange={(e) => {
                          setPubAuthorName(e.target.value);
                          localStorage.setItem('veretka_author_name', e.target.value);
                        }}
                        placeholder={t('cloud.gallery.274')}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-[var(--text-secondary)]">{t('cloud.gallery.275')}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('personal');
                            setPersonalAuthMode('login');
                          }}
                          className="text-[11px] text-[var(--accent-primary)] hover:underline underline-offset-2 flex items-center gap-1 font-medium"
                          title={t('cloud.gallery.276')}
                        >
                          {t('cloud.gallery.277')}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={pubNickname}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-tertiary)] cursor-not-allowed select-none font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    {t('cloud.gallery.278')}
                  </label>
                  <textarea
                    value={pubDescription}
                    onChange={(e) => setPubDescription(e.target.value)}
                    placeholder={t('cloud.gallery.279')}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">{t('cloud.gallery.280')}</label>
                  <div className="text-xs text-[var(--text-secondary)] mb-3 p-2.5 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl">
                    {t('cloud.gallery.281')} <strong className="text-[var(--text-primary)]">{t('cloud.gallery.282')}</strong>{t('cloud.gallery.283')}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      pubIsPublic ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:border-[var(--border-primary)]'
                    }`}>
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          checked={pubIsPublic}
                          onChange={(e) => setPubIsPublic(e.target.checked)}
                          className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                        />
                      </div>
                      <div>
                        <div className={`font-semibold text-xs ${pubIsPublic ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t('cloud.gallery.284')}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t('cloud.gallery.285')}</div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      pubIsGroup ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:border-[var(--border-primary)]'
                    }`}>
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          checked={pubIsGroup}
                          onChange={(e) => setPubIsGroup(e.target.checked)}
                          className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                        />
                      </div>
                      <div>
                        <div className={`font-semibold text-xs ${pubIsGroup ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t('cloud.gallery.286')}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t('cloud.gallery.287')}</div>
                      </div>
                    </label>
                  </div>

                  {pubIsGroup && (
                    <div className="bg-[var(--bg-primary)] p-3.5 rounded-xl border border-[var(--border-primary)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-[var(--text-secondary)]">{t('cloud.gallery.288')}</label>
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
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors font-semibold flex items-center gap-1"
                          >
                            {t('cloud.gallery.289')}
                          </button>
                        )}
                      </div>

                      {showGroupPicker && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto shadow-lg">
                          <div className="text-[11px] font-semibold text-[var(--text-tertiary)] mb-1">{t('cloud.gallery.290')}</div>
                          {isLoadingMyGroups ? (
                            <p className="text-xs text-[var(--text-tertiary)] animate-pulse py-2 text-center">{t('cloud.gallery.291')}</p>
                          ) : myUserGroups.length === 0 ? (
                            <p className="text-xs text-[var(--text-tertiary)] py-2 text-center">{t('cloud.gallery.292')}</p>
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
                                    ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]'
                                    : 'bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-primary)]'
                                }`}
                              >
                                <div>
                                  <div className="font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                                    <span className="font-mono text-[10px] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded border border-[var(--border-secondary)]">
                                      {g.groupCode}
                                    </span>
                                    <span>{g.name}</span>
                                  </div>
                                  <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                                    {t('cloud.gallery.293')} {g.mode === 'education' ? t('cloud.gallery.294') : g.mode === 'readonly' ? t('cloud.gallery.295') : t('cloud.gallery.296')}
                                  </div>
                                </div>
                                <span className="text-xs text-[var(--accent-primary)] font-medium">{t('cloud.gallery.297')}</span>
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
                          if (((code) || "").trim()) {
                            getGroupInfoByCode(code).then(setFetchedGroupInfo);
                          } else {
                            setFetchedGroupInfo(null);
                          }
                        }}
                        placeholder={t('cloud.gallery.298')}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-sm uppercase focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono"
                        required={pubIsGroup}
                      />

                      {fetchedGroupInfo && (
                        <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-secondary)] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)]">{fetchedGroupInfo.name}</span>
                            <span className="text-[10px] bg-[var(--bg-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded font-mono border border-[var(--border-secondary)]">
                              {fetchedGroupInfo.mode === 'education' ? t('cloud.gallery.299') : 
                               fetchedGroupInfo.mode === 'readonly' ? t('cloud.gallery.300') : 
                               t('cloud.gallery.301')}
                            </span>
                          </div>
                          {fetchedGroupInfo.description && (
                            <p className="text-[var(--text-tertiary)] text-[11px]">{fetchedGroupInfo.description}</p>
                          )}
                          <div className="text-[10px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-secondary)]">
                            {fetchedGroupInfo.mode === 'education' && (
                              <p>{t('cloud.gallery.302')}</p>
                            )}
                            {fetchedGroupInfo.mode === 'readonly' && (
                              <p>{t('cloud.gallery.303')}{fetchedGroupInfo.creatorNickname}).</p>
                            )}
                            {fetchedGroupInfo.mode === 'gallery' && (
                              <p>{t('cloud.gallery.304')}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {publishStatusMessage && (
                  <p className={`text-xs p-2.5 rounded-xl border ${
                    publishStatusMessage.includes(t('cloud.gallery.305'))
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}>
                    {publishStatusMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="w-full py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? t('cloud.gallery.306') : t('cloud.gallery.307')}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Edit Profile / Account Settings Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-secondary)]">
                <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-[var(--text-primary)]">
                  {t('cloud.gallery.308')}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfileModal(false);
                    setEditProfileMessage('');
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <p>{t('cloud.gallery.309')} <strong className="text-[var(--text-primary)] font-mono">@{personalNickname}</strong></p>
                <p className="text-[var(--text-tertiary)]">{t('cloud.gallery.310')}</p>
              </div>

              <form onSubmit={handleEditProfileSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    {t('cloud.gallery.311')}
                  </label>
                  <input
                    type="text"
                    value={editAuthorNameInput}
                    onChange={(e) => setEditAuthorNameInput(e.target.value)}
                    placeholder={t('cloud.gallery.312')}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    {t('cloud.gallery.313')}
                  </label>
                  <input
                    type="email"
                    value={editEmailInput}
                    onChange={(e) => setEditEmailInput(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    {t('cloud.gallery.314')}
                  </p>
                </div>

                <div className="border-t border-[var(--border-secondary)] pt-3 space-y-3">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{t('cloud.gallery.315')}</p>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      {t('cloud.gallery.316')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords['editNew'] ? "text" : "password"}
                        value={editNewPasscode}
                        onChange={(e) => setEditNewPasscode(e.target.value)}
                        placeholder={t('cloud.gallery.317')}
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => togglePassword('editNew')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      >
                        {showPasswords['editNew'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      {t('cloud.gallery.318')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords['editCurrent'] ? "text" : "password"}
                        value={editCurrentPasscode}
                        onChange={(e) => setEditCurrentPasscode(e.target.value)}
                        placeholder={t('cloud.gallery.319')}
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => togglePassword('editCurrent')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      >
                        {showPasswords['editCurrent'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {editProfileMessage && (
                  <p className={`text-xs p-3 rounded-xl border leading-relaxed ${
                    editProfileSuccess
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
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
                    className="flex-1 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] text-xs font-medium transition-colors"
                  >
                    {t('cloud.gallery.320')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-xs font-semibold transition-colors shadow-xs"
                  >
                    {isUpdatingProfile ? t('cloud.gallery.321') : t('cloud.gallery.322')}
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
                    className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {t('cloud.gallery.323')}
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 space-y-3 text-left">
                    <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                      ⚠️ <strong>{t('cloud.gallery.324')}</strong> {t('cloud.gallery.325')} <span className="font-mono text-[var(--text-primary)]">@{personalNickname}</span>{t('cloud.gallery.326')}
                    </p>

                    {deleteAccountError && (
                      <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/30">
                        {deleteAccountError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowDeleteAccountConfirm(false)}
                        className="flex-1 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] text-xs font-medium transition-colors"
                      >
                        {t('cloud.gallery.327')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccountSubmit()}
                        disabled={isDeletingAccount}
                        className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1"
                      >
                        {isDeletingAccount ? t('cloud.gallery.328') : t('cloud.gallery.329')}
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
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-secondary)]">
                <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                  {t('cloud.gallery.330')}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowDeleteGroupModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('cloud.gallery.331')} <strong className="text-[var(--text-primary)]">{activeGroup.name}</strong> (<span className="font-mono text-[var(--accent-primary)]">{activeGroup.groupCode}</span>{t('cloud.gallery.332')}
              </p>

              <form onSubmit={handleDeleteGroupSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    {t('cloud.gallery.333')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords['deleteGroup'] ? "text" : "password"}
                      value={deleteGroupPasscode}
                      onChange={(e) => setDeleteGroupPasscode(e.target.value)}
                      placeholder={t('cloud.gallery.334')}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-red-500/30 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-red-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('deleteGroup')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      {showPasswords['deleteGroup'] ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {deleteGroupError && (
                  <p className="text-xs p-3 rounded-xl border leading-relaxed bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                    {deleteGroupError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteGroupModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] text-xs font-medium transition-colors"
                  >
                    {t('cloud.gallery.335')}
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingGroup}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    {isDeletingGroup ? t('cloud.gallery.336') : t('cloud.gallery.337')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Recovery Modal */}
        {showRecoveryModal && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-secondary)]">
                <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-[var(--text-primary)]">
                  {t('cloud.gallery.338')}
                </h4>
                <button
                  onClick={() => {
                    setShowRecoveryModal(false);
                    setRecoveryEmail('');
                    setRecoveryMessage('');
                    setRecoverySuccess(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('cloud.gallery.339')}
              </p>

              <form onSubmit={handleAccountRecoverySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.340')}</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => {
                      setRecoveryEmail(e.target.value);
                      setRecoverySuccess(false);
                      setRecoveryMessage('');
                    }}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    required
                  />
                </div>

                {recoveryMessage && (
                  <div className={`text-xs p-3 rounded-xl border leading-relaxed whitespace-pre-line ${
                    recoverySuccess
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
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
                    className="flex-1 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] text-xs font-medium transition-colors"
                  >
                    {t('cloud.gallery.341')}
                  </button>
                  <button
                    type="submit"
                    disabled={isRecovering || recoverySuccess}
                    className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--accent-text)] text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1"
                  >
                    {isRecovering ? t('cloud.gallery.342') : recoverySuccess ? t('cloud.gallery.343') : t('cloud.gallery.344')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Publish Conflict Modal */}
        {publishConflictModal?.show && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 max-h-[90vh] overflow-y-auto">
              <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">{t('cloud.gallery.345')}</h4>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                {t('cloud.gallery.346')} <strong className="text-[var(--text-primary)]">{pubTitle}</strong>{t('cloud.gallery.347')}
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
                <button
                  onClick={() => setPublishConflictModal(null)}
                  className="px-4 py-2 text-xs rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors"
                >
                  {t('cloud.gallery.348')}
                </button>
                <button
                  onClick={async () => {
                    const { existingId, projectData, finalGroupId, personalVisibility } = publishConflictModal;
                    setPublishConflictModal(null);
                    await executePublish(((pubTitle) || "").trim(), true, existingId, projectData, finalGroupId, personalVisibility);
                  }}
                  className="px-4 py-2 text-xs rounded-xl bg-[var(--bg-primary)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/10 transition-colors font-semibold"
                >
                  {t('cloud.gallery.349')}
                </button>
                <button
                  onClick={async () => {
                    const { projectData, finalGroupId, personalVisibility } = publishConflictModal;
                    const newTitle = ((pubTitle) || "").trim() + t('cloud.gallery.350');
                    setPubTitle(newTitle);
                    setPublishConflictModal(null);
                    await executePublish(newTitle, false, undefined, projectData, finalGroupId, personalVisibility);
                  }}
                  className="px-4 py-2 text-xs rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] transition-colors font-semibold"
                >
                  {t('cloud.gallery.351')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Confirmation Modal (for deleting/updating) */}
        {actionPasscodeModal.show && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-sm w-full space-y-3.5 sm:space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <h4 className={`font-bold text-sm sm:text-base flex items-center gap-2 ${
                actionPasscodeModal.action === 'delete' ? 'text-red-600 dark:text-red-400' :
                actionPasscodeModal.action === 'make_public' ? 'text-emerald-600 dark:text-emerald-400' :
                actionPasscodeModal.action === 'make_private' ? 'text-amber-600 dark:text-amber-400' :
                'text-[var(--text-primary)]'
              }`}>
                {actionPasscodeModal.action === 'delete' ? t('cloud.gallery.352') :
                 actionPasscodeModal.action === 'make_public' ? t('cloud.gallery.353') :
                 actionPasscodeModal.action === 'make_private' ? t('cloud.gallery.354') :
                 t('cloud.gallery.355')}
              </h4>

              {actionPasscodeModal.action === 'delete' ? (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  ⚠️ <strong>{t('cloud.gallery.356')}</strong> {t('cloud.gallery.357')}
                </p>
              ) : actionPasscodeModal.action === 'make_public' ? (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-secondary)]">
                  🌐 <strong>{t('cloud.gallery.358')}</strong><br />
                  {t('cloud.gallery.359')}
                </p>
              ) : actionPasscodeModal.action === 'make_private' ? (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-secondary)]">
                  🔒 <strong>{t('cloud.gallery.360')}</strong><br />
                  {t('cloud.gallery.361')}
                </p>
              ) : (
                <>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('cloud.gallery.362')}
                  </p>
                  <div className="relative mt-2">
                    <input
                      type={showPasswords['actionPasscode'] ? "text" : "password"}
                      placeholder={t('cloud.gallery.363')}
                      value={promptPasscode}
                      onChange={(e) => setPromptPasscode(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => togglePassword('actionPasscode')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
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
                  className="px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] font-medium transition-colors"
                >
                  {t('cloud.gallery.364')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-xs rounded-xl text-white font-semibold transition-colors shadow-xs ${
                    actionPasscodeModal.action === 'delete'
                      ? 'bg-red-600 hover:bg-red-500'
                      : actionPasscodeModal.action === 'make_public'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : actionPasscodeModal.action === 'make_private'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)]'
                  }`}
                >
                  {actionPasscodeModal.action === 'delete' ? t('cloud.gallery.365') :
                   actionPasscodeModal.action === 'make_public' ? t('cloud.gallery.366') :
                   actionPasscodeModal.action === 'make_private' ? t('cloud.gallery.367') :
                   t('cloud.gallery.368')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send to Group Modal */}
        {sendToGroupModal.show && sendToGroupModal.project && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setSendToGroupModal({ show: false, project: null });
                  setSendGroupError(null);
                  setSendGroupSuccess(null);
                }}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] transition-colors"
              >
                <XIcon size={18} />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--text-primary)] flex items-center justify-center text-lg">
                  🏫
                </div>
                <div>
                  <h4 className="font-bold text-base text-[var(--text-primary)]">{t('cloud.gallery.369')}</h4>
                  <p className="text-xs text-[var(--text-secondary)] truncate max-w-[280px]">
                    {t('cloud.gallery.370')}{sendToGroupModal.project.title}"
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('cloud.gallery.371')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('cloud.gallery.372')}
                      value={sendGroupCodeInput}
                      onChange={(e) => handleSendGroupCodeChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] uppercase tracking-wider font-mono"
                      autoFocus
                    />
                    {isSearchingSendGroup && (
                      <div className="absolute right-3 top-2.5 text-xs text-[var(--text-tertiary)] animate-spin">
                        ⏳
                      </div>
                    )}
                  </div>
                </div>

                {/* Found group preview card */}
                {sendGroupInfo && (
                  <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-secondary)] space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {sendGroupInfo.name || t('cloud.gallery.373')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                        {sendGroupInfo.mode === 'education' ? t('cloud.gallery.374') :
                         sendGroupInfo.mode === 'readonly' ? t('cloud.gallery.375') :
                         t('cloud.gallery.376')}
                      </span>
                    </div>
                    {sendGroupInfo.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{sendGroupInfo.description}</p>
                    )}
                    <div className="text-[11px] text-[var(--text-tertiary)] flex justify-between pt-1 border-t border-[var(--border-secondary)]">
                      <span>{t('cloud.gallery.377')}{sendGroupInfo.creatorNickname || t('cloud.gallery.378')}</span>
                      <span className="font-mono font-semibold">{sendGroupInfo.groupCode}</span>
                    </div>

                    {sendGroupInfo.mode === 'readonly' && 
                     (sendGroupInfo.creatorNickname || '').trim().toLowerCase() !== (personalNickname || '').trim().toLowerCase() && (
                      <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-[11px] text-red-600 dark:text-red-400 leading-relaxed mt-1">
                        {t('cloud.gallery.380')}{sendGroupInfo.creatorNickname}).
                      </div>
                    )}
                  </div>
                )}

                {/* Quick selection from My Groups */}
                {myUserGroups.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-semibold text-[var(--text-tertiary)] mb-1.5">
                      {t('cloud.gallery.381')}
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {myUserGroups.map((g) => (
                        <button
                          key={g.groupCode}
                          type="button"
                          onClick={() => handleSelectGroupFromList(g)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs border transition-all text-left flex items-center gap-1.5 ${
                            sendGroupCodeInput === g.groupCode
                              ? 'bg-[var(--accent-primary)]/15 text-[var(--text-primary)] border-[var(--accent-primary)] font-semibold'
                              : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-secondary)] hover:border-[var(--border-primary)]'
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
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                    {sendGroupError}
                  </div>
                )}
                {sendGroupSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {sendGroupSuccess}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-secondary)]">
                <button
                  type="button"
                  onClick={() => {
                    setSendToGroupModal({ show: false, project: null });
                    setSendGroupError(null);
                    setSendGroupSuccess(null);
                  }}
                  className="px-3.5 py-2 text-xs rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] font-medium transition-colors"
                >
                  {t('cloud.gallery.382')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendToGroup}
                  disabled={!((sendGroupCodeInput) || "").trim() || isSendingToGroup}
                  className="px-4 py-2 text-xs rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSendingToGroup ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('cloud.gallery.383')}
                    </>
                  ) : (
                    t('cloud.gallery.384')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sent Groups List Modal */}
        {selectedSentGroupsProject && (
          <div 
            className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
            onClick={() => setSelectedSentGroupsProject(null)}
          >
            <div 
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 relative shadow-2xl overflow-hidden cursor-default max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedSentGroupsProject(null)}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] transition-colors z-10"
                title={t('cloud.gallery.385')}
              >
                <XIcon size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-[var(--border-secondary)] pb-3 pr-8">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-xl border border-[var(--accent-primary)]/30 shrink-0">
                  🏫
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">{t('cloud.gallery.386')}</h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate max-w-[240px]">"{selectedSentGroupsProject.title}"</p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-secondary)]">
                {t('cloud.gallery.387')}
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
                      <div className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                        {t('cloud.gallery.388')}
                      </div>
                    );
                  }

                  return groups.map((g, idx) => (
                    <div 
                      key={g.groupId + '_' + idx}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:border-[var(--border-primary)] transition-colors gap-2 sm:gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">{g.groupName || g.groupId}</span>
                          <span className="text-[10px] bg-[var(--bg-secondary)] text-[var(--accent-primary)] px-2 py-0.5 rounded font-mono border border-[var(--border-secondary)] font-bold shrink-0">
                            {g.groupId}
                          </span>
                        </div>
                        {g.sentAt && (
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            {t('cloud.gallery.389')} {new Date(g.sentAt).toLocaleDateString('uk-UA')}
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
                          className="px-2 sm:px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] sm:text-[11px] font-medium border border-[var(--border-secondary)] transition-colors"
                        >
                          {sentGroupCopyStatus === g.groupId ? t('cloud.gallery.390') : t('cloud.gallery.391')}
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
                          className="px-2 sm:px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-[10px] sm:text-[11px] font-semibold transition-colors"
                        >
                          {t('cloud.gallery.392')}
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="pt-2 border-t border-[var(--border-secondary)] text-right">
                <button
                  type="button"
                  onClick={() => setSelectedSentGroupsProject(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors"
                >
                  {t('cloud.gallery.393')}
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
            className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 relative shadow-2xl overflow-hidden cursor-default max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShareModalProject(null);
                  setCopiedLink(false);
                }}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] transition-colors z-10"
                title={t('cloud.gallery.394')}
              >
                <XIcon size={20} />
              </button>

              {/* Branding Header & Title */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-[var(--text-primary)] flex items-center justify-center p-1.5 shrink-0">
                  <VeretkaLogoIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">{t('cloud.gallery.395')}</h3>
                    <span className="text-[10px] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-2 py-0.5 rounded-full border border-[var(--accent-primary)]/30 font-semibold">
                      {t('cloud.gallery.396')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[220px] sm:max-w-[260px]">
                    "{shareModalProject.title}" ({shareModalProject.authorName})
                  </p>
                </div>
              </div>

              {/* Thumbnail Preview Card with Branding */}
              <div className="relative rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] p-2 overflow-hidden shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] px-2 py-1 mb-1 border-b border-[var(--border-secondary)]">
                  <span className="font-medium text-[var(--accent-primary)] flex items-center gap-1">
                    {t('cloud.gallery.397')}
                  </span>
                  <span>{t('cloud.gallery.398')} <strong className="text-[var(--text-primary)]">{shareModalProject.shapesCount}</strong></span>
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
                <label className="block text-xs text-[var(--text-secondary)] font-semibold">{t('cloud.gallery.399')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-[var(--text-primary)] select-all focus:outline-none font-mono focus:border-[var(--accent-primary)] min-w-0"
                  />
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`;
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] transition-colors shrink-0 shadow-xs"
                  >
                    {copiedLink ? t('cloud.gallery.400') : t('cloud.gallery.401')}
                  </button>
                </div>
              </div>

              {/* Sharing Destinations */}
              <div className="space-y-2.5 sm:space-y-3 pt-2 border-t border-[var(--border-secondary)]">
                <label className="block text-xs text-[var(--text-secondary)] font-semibold">{t('cloud.gallery.402')}</label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&text=${encodeURIComponent(`Перегляньте мій векторний проєкт "${shareModalProject.title}" у Веретці!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>

                  {/* Viber */}
                  <a
                    href={`viber://forward?text=${encodeURIComponent(`Проєкт "${shareModalProject.title}" у Веретці: ${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#7360f2] hover:bg-[#5e4bd8] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M19.385 1.77C15.176-.328 8.795-.333 4.58.106 1.758.4 0 2.505 0 5.405v8.13c0 2.871 1.742 4.978 4.542 5.275 1.05.111 2.112.164 3.178.164.218 0 .432-.008.647-.024l.086 2.653a1.442 1.442 0 0 0 2.37 1.042l3.414-3.111c1.782-.047 3.522-.387 5.148-1.01 2.801-1.071 4.615-3.41 4.615-6.505V5.405c0-2.072-1.253-3.023-4.615-3.635zm3.115 11.765c0 2.322-1.365 4.077-3.468 4.881-1.464.561-3.031.866-4.636.908l-3.23 2.943-.075-2.316a.72.72 0 0 0-.712-.698c-1.096.012-2.192-.041-3.282-.157-2.1-.223-3.412-1.799-3.412-3.951V5.405c0-2.176 1.32-3.75 3.412-3.971 3.821-.398 9.619-.398 13.441 0 2.094.217 3.462 1.051 3.462 3.971v8.13z"/>
                    </svg>
                    Viber
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Проєкт "${shareModalProject.title}" у Веретці: ${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                    WhatsApp
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>

                  {/* Messenger */}
                  <a
                    href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#0084FF] hover:bg-[#0073e6] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.888-3.26-6.559 6.963z"/>
                    </svg>
                    Messenger
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&text=${encodeURIComponent(`Перегляньте мій векторний проєкт "${shareModalProject.title}" у Веретці!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white border border-slate-700 text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#0A66C2] hover:bg-[#08529c] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.62 1.62 0 1 0 .01 3.24 1.62 1.62 0 0 0-.01-3.24z"/>
                    </svg>
                    LinkedIn
                  </a>

                  {/* Pinterest */}
                  <a
                    href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}&description=${encodeURIComponent(`Векторний проєкт "${shareModalProject.title}" у Веретці`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[#E60023] hover:bg-[#cc001f] text-white text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z"/>
                    </svg>
                    Pinterest
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Проєкт "${shareModalProject.title}" у Веретці`)}&body=${encodeURIComponent(`Привіт! Переглянь мій проєкт "${shareModalProject.title}" у Веретці за посиланням:\n\n${window.location.origin}${window.location.pathname}?cloudProject=${shareModalProject.id}`)}`}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-[11px] sm:text-xs font-semibold transition-colors shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
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
            className="fixed inset-0 z-[10008] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
            onClick={() => setShowGroupSettingsModal(false)}
          >
            <div 
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-lg w-full space-y-4 sm:space-y-5 relative shadow-2xl overflow-hidden cursor-default max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGroupSettingsModal(false)}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] transition-colors"
                title={t('cloud.gallery.403')}
              >
                <XIcon size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-[var(--border-secondary)] pb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-xl border border-[var(--accent-primary)]/30 shrink-0">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)]">{t('cloud.gallery.404')}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">"{activeGroup.name}" ({activeGroup.groupCode})</p>
                </div>
              </div>

              {/* Quick Copy Links */}
              <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-secondary)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{t('cloud.gallery.405')} <strong className="text-[var(--accent-primary)] font-mono">{activeGroup.groupCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeGroup.groupCode);
                      setCopyStatusText(t('cloud.gallery.406'));
                      setTimeout(() => setCopyStatusText(''), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-medium border border-[var(--border-secondary)] transition-colors"
                  >
                    {t('cloud.gallery.407')}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">{t('cloud.gallery.408')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/?group=${activeGroup.groupCode}`;
                      navigator.clipboard.writeText(link);
                      setCopyStatusText(t('cloud.gallery.409'));
                      setTimeout(() => setCopyStatusText(''), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-medium border border-[var(--border-secondary)] transition-colors"
                  >
                    {t('cloud.gallery.410')}
                  </button>
                </div>
                {copyStatusText && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-right font-medium">{copyStatusText}</p>
                )}
              </div>

              {/* Info Block */}
              <div className="text-xs text-[var(--text-secondary)] space-y-1 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-secondary)]">
                <div>{t('cloud.gallery.411')} <strong className="text-[var(--text-primary)]">@{activeGroup.creatorNickname || t('cloud.gallery.412')}</strong></div>
                <div>{t('cloud.gallery.413')} <strong className="text-[var(--accent-primary)]">
                  {isPersonalLoggedIn && activeGroup.creatorNickname?.trim().toLowerCase() === ((personalNickname) || "").trim().toLowerCase()
                    ? t('cloud.gallery.414')
                    : t('cloud.gallery.415')}
                </strong></div>
              </div>

              {/* Editable parameters for creator */}
              {isPersonalLoggedIn && activeGroup.creatorNickname?.trim().toLowerCase() === ((personalNickname) || "").trim().toLowerCase() ? (
                <form onSubmit={handleSaveGroupSettingsSubmit} className="space-y-3 pt-2 border-t border-[var(--border-secondary)]">
                  <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">{t('cloud.gallery.416')}</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.417')}</label>
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.418')}</label>
                    <input
                      type="text"
                      value={editGroupDesc}
                      onChange={(e) => setEditGroupDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.419')}</label>
                    <select
                      value={editGroupMode}
                      onChange={(e) => setEditGroupMode(e.target.value as GroupMode)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="gallery">{t('cloud.gallery.420')}</option>
                      <option value="education">{t('cloud.gallery.421')}</option>
                      <option value="readonly">{t('cloud.gallery.422')}</option>
                    </select>
                  </div>

                  {editGroupMode === 'education' && (
                    <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] space-y-1.5">
                      <label className="block text-xs font-semibold text-[var(--text-primary)]">
                        {t('cloud.gallery.423')}
                      </label>
                      <div className="space-y-1 text-[11px]">
                        <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                          <input
                            type="radio"
                            name="editStudentPolicy"
                            value="allow_overwrite"
                            checked={editGroupStudentPolicy === 'allow_overwrite'}
                            onChange={() => setEditGroupStudentPolicy('allow_overwrite')}
                            className="mt-0.5 accent-[var(--accent-primary)]"
                          />
                          <div>
                            <span className="font-semibold text-[var(--text-primary)]">{t('cloud.gallery.424')}</span>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{t('cloud.gallery.425')}</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                          <input
                            type="radio"
                            name="editStudentPolicy"
                            value="create_versions"
                            checked={editGroupStudentPolicy === 'create_versions'}
                            onChange={() => setEditGroupStudentPolicy('create_versions')}
                            className="mt-0.5 accent-[var(--accent-primary)]"
                          />
                          <div>
                            <span className="font-semibold text-[var(--text-primary)]">{t('cloud.gallery.426')}</span>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{t('cloud.gallery.427')}</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                          <input
                            type="radio"
                            name="editStudentPolicy"
                            value="freeze_after_submit"
                            checked={editGroupStudentPolicy === 'freeze_after_submit'}
                            onChange={() => setEditGroupStudentPolicy('freeze_after_submit')}
                            className="mt-0.5 accent-[var(--accent-primary)]"
                          />
                          <div>
                            <span className="font-semibold text-[var(--text-primary)]">{t('cloud.gallery.428')}</span>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{t('cloud.gallery.429')}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t('cloud.gallery.430')}</label>
                    <input
                      type="password"
                      value={editGroupNewPasscode}
                      onChange={(e) => setEditGroupNewPasscode(e.target.value)}
                      placeholder={t('cloud.gallery.431')}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  {groupSettingsError && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{groupSettingsError}</p>
                  )}
                  {groupSettingsMessage && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{groupSettingsMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingGroupSettings}
                    className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-semibold text-sm transition-colors shadow-xs"
                  >
                    {isSavingGroupSettings ? t('cloud.gallery.432') : t('cloud.gallery.433')}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-secondary)]">
                  {t('cloud.gallery.434')}
                </p>
              )}

              {/* Action buttons transferred here: Leave & Delete */}
              <div className="pt-3 border-t border-[var(--border-secondary)] space-y-2">
                <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{t('cloud.gallery.435')}</h4>
                
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      setActiveGroup(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    {t('cloud.gallery.436')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      setDeleteGroupError('');
                      setDeleteGroupPasscode('');
                      setShowDeleteGroupModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {t('cloud.gallery.437')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Members Modal */}
        {showGroupMembersModal && activeGroup && (
          <div 
            className="fixed inset-0 z-[10008] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
            onClick={() => setShowGroupMembersModal(false)}
          >
            <div 
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-md w-full space-y-3.5 sm:space-y-4 relative shadow-2xl overflow-hidden cursor-default max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowGroupMembersModal(false)}
                className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] transition-colors"
                title={t('cloud.gallery.438')}
              >
                <XIcon size={20} />
              </button>

              <div className="flex items-center gap-3 border-b border-[var(--border-secondary)] pb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-xl border border-[var(--accent-primary)]/30 shrink-0">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)]">{t('cloud.gallery.439')}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    "{activeGroup.name}{t('cloud.gallery.440')} <strong className="text-[var(--accent-primary)]">{groupMembersList.length}</strong>
                  </p>
                </div>
              </div>

              {/* Member search input */}
              <div>
                <input
                  type="text"
                  placeholder={t('cloud.gallery.441')}
                  value={groupMemberSearchQuery}
                  onChange={(e) => setGroupMemberSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
                {isLoadingGroupMembers ? (
                  <div className="py-10 flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <VeretkaLoader size="sm" />
                    <span>{t('cloud.gallery.442')}</span>
                  </div>
                ) : groupMembersList.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                    {t('cloud.gallery.443')}
                  </div>
                ) : (
                  groupMembersList
                    .filter(m => 
                      !((groupMemberSearchQuery) || "").trim() ||
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
                          className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-secondary)] hover:border-[var(--border-primary)] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                              isCreator ? 'bg-amber-600' : 'bg-indigo-600'
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[var(--text-primary)] truncate">{displayName}</span>
                                {m.authorName && (
                                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono">(@{m.nickname})</span>
                                )}
                              </div>
                              <div className="text-[10px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                                <span>🎨 {m.projectsCount} {m.projectsCount === 1 ? t('cloud.gallery.444') : (m.projectsCount >= 2 && m.projectsCount <= 4) ? t('cloud.gallery.445') : t('cloud.gallery.446')} {t('cloud.gallery.447')}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full font-semibold shrink-0 border ${
                            isCreator 
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30' 
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-secondary)]'
                          }`}>
                            {isCreator ? t('cloud.gallery.448') : t('cloud.gallery.449')}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="pt-2 border-t border-[var(--border-secondary)] text-right">
                <button
                  type="button"
                  onClick={() => setShowGroupMembersModal(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors"
                >
                  {t('cloud.gallery.450')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Group Conflict Resolution Modal */}
        {groupConflictModal.show && groupConflictModal.projectToCopy && (
          <div className="fixed inset-0 z-[10025] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[var(--border-primary)] max-w-lg w-full space-y-3.5 sm:space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-secondary)]">
                <h4 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  {t('cloud.gallery.451')}
                </h4>
                <button
                  type="button"
                  onClick={() => setGroupConflictModal(prev => ({ ...prev, show: false }))}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <XIcon size={20} />
                </button>
              </div>

              <div className="bg-[var(--bg-primary)] border border-[var(--border-secondary)] p-3.5 rounded-xl space-y-2 text-xs">
                <p className="text-[var(--text-secondary)]">
                  {t('cloud.gallery.452')} <strong className="text-[var(--text-primary)]">"{groupConflictModal.groupName}"</strong> {t('cloud.gallery.453')} <strong className="text-[var(--accent-primary)] font-semibold">"{groupConflictModal.existingProject?.title || groupConflictModal.projectToCopy.title}"</strong> {t('cloud.gallery.454')}<span className="text-[var(--accent-primary)]">@{personalNickname}</span>).
                </p>
                {groupConflictModal.studentUpdatePolicy === 'freeze_after_submit' && (
                  <p className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
                    🔒 <strong>{t('cloud.gallery.455')}</strong> {t('cloud.gallery.456')}
                  </p>
                )}
                {groupConflictModal.studentUpdatePolicy === 'create_versions' && (
                  <p className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 font-medium">
                    🔵 <strong>{t('cloud.gallery.457')}</strong> {t('cloud.gallery.458')}
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
                      ? 'opacity-40 cursor-not-allowed bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-tertiary)]'
                      : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border-[var(--border-secondary)] hover:border-[var(--border-primary)] text-[var(--text-primary)]'
                  }`}
                >
                  <span className="text-xl shrink-0">🔄</span>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">{t('cloud.gallery.459')}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {t('cloud.gallery.460')}
                    </div>
                  </div>
                </button>

                {/* Option 2: Publish as New Copy */}
                <button
                  type="button"
                  disabled={isResolvingConflict}
                  onClick={() => handleResolveConflictAction('new_copy', groupConflictModal.nextSuggestedTitle)}
                  className="w-full p-3 rounded-xl border border-[var(--border-secondary)] hover:border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-left transition-all flex items-start gap-3"
                >
                  <span className="text-xl shrink-0">📄</span>
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">{t('cloud.gallery.461')}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {t('cloud.gallery.462')} <span className="text-[var(--accent-primary)] font-mono font-bold">"{groupConflictModal.nextSuggestedTitle || `${groupConflictModal.projectToCopy.title} (v.2)`}"</span>
                    </div>
                  </div>
                </button>

                {/* Option 3: Custom Rename */}
                <div className="p-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-primary)] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✏️</span>
                    <span className="font-bold text-xs text-[var(--text-primary)]">{t('cloud.gallery.463')}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupConflictModal.customTitleInput}
                      onChange={(e) => setGroupConflictModal(prev => ({ ...prev, customTitleInput: e.target.value }))}
                      placeholder={`Наприклад, ${groupConflictModal.nextSuggestedTitle || t('cloud.gallery.464')}`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <button
                      type="button"
                      disabled={isResolvingConflict || !((groupConflictModal.customTitleInput) || "").trim()}
                      onClick={() => handleResolveConflictAction('custom_title')}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                    >
                      {t('cloud.gallery.465')}
                    </button>
                  </div>
                </div>
              </div>

              {conflictError && (
                <p className="text-xs p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  {conflictError}
                </p>
              )}

              <div className="pt-2 border-t border-[var(--border-secondary)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setGroupConflictModal(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] text-xs font-medium transition-colors"
                >
                  {t('cloud.gallery.466')}
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
