import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon } from './icons';

export interface MergeProjectOptions {
  cloudData: any;
  cloudProjectTitle: string;
  projectNameMode: 'keepCurrent' | 'useCloud' | 'combine';
  resolvedProjectName: string;
  groupImportedShapes: boolean;
  preserveLayers: boolean;
  autoExpandCanvas: boolean;
}

interface CloudProjectOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudProjectTitle: string;
  cloudProjectData: any;
  currentProjectName: string;
  currentShapesCount: number;
  currentLayersCount: number;
  onReplace: (cloudData: any, projectName: string) => void;
  onMerge: (options: MergeProjectOptions) => void;
}

export const CloudProjectOpenModal: React.FC<CloudProjectOpenModalProps> = ({
  isOpen,
  onClose,
  cloudProjectTitle,
  cloudProjectData,
  currentProjectName,
  currentShapesCount,
  currentLayersCount,
  onReplace,
  onMerge,
}) => {
  const { t } = useLanguage();
  const [openMode, setOpenMode] = useState<'replace' | 'merge'>('merge');
  const [nameMode, setNameMode] = useState<'keepCurrent' | 'useCloud' | 'combine'>('keepCurrent');
  const [groupImported, setGroupImported] = useState(true);
  const [preserveLayers, setPreserveLayers] = useState(true);
  const [autoExpandCanvas, setAutoExpandCanvas] = useState(true);

  if (!isOpen || !cloudProjectData) return null;

  const importedShapesCount = Array.isArray(cloudProjectData.shapes) ? cloudProjectData.shapes.length : 0;
  const importedLayersCount = Array.isArray(cloudProjectData.layers) ? cloudProjectData.layers.length : 1;
  const cloudCanvasW = cloudProjectData.canvasSettings?.width || 800;
  const cloudCanvasH = cloudProjectData.canvasSettings?.height || 600;

  const getCombinedName = () => {
    const cur = currentProjectName || t('app.1014') || 'Новий проєкт';
    const cloud = cloudProjectTitle || t('cloud.project.untitled') || 'Хмарний проєкт';
    return `${cur} + ${cloud}`;
  };

  const getResolvedName = () => {
    if (openMode === 'replace') {
      return cloudProjectTitle || t('app.1014') || 'Проєкт';
    }
    if (nameMode === 'keepCurrent') {
      return currentProjectName || t('app.1014') || 'Новий проєкт';
    }
    if (nameMode === 'useCloud') {
      return cloudProjectTitle || t('cloud.project.untitled') || 'Хмарний проєкт';
    }
    return getCombinedName();
  };

  const handleConfirm = () => {
    const resolvedName = getResolvedName();
    if (openMode === 'replace') {
      onReplace(cloudProjectData, resolvedName);
    } else {
      onMerge({
        cloudData: cloudProjectData,
        cloudProjectTitle: cloudProjectTitle || t('cloud.project.untitled') || 'Хмарний проєкт',
        projectNameMode: nameMode,
        resolvedProjectName: resolvedName,
        groupImportedShapes: groupImported,
        preserveLayers: preserveLayers,
        autoExpandCanvas: autoExpandCanvas,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center font-bold text-base">
              ☁️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-snug">
                {t('cloud.open.dialogTitle') || 'Відкриття проєкту з хмари'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {t('cloud.open.dialogSubtitle') || 'У редакторі вже є створений проєкт. Оберіть дію:'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </header>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Comparison Cards Banner */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-secondary)]">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {t('cloud.open.currentWorkspace') || 'Поточний у редакторі'}
              </span>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate" title={currentProjectName}>
                🎨 {currentProjectName}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>{currentShapesCount} {t('cloud.open.shapesCountLabel') || 'фігур'}</span>
                <span>•</span>
                <span>{currentLayersCount} {t('cloud.open.layersCountLabel') || 'шарів'}</span>
              </div>
            </div>

            <div className="space-y-1 border-l border-[var(--border-secondary)] pl-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                {t('cloud.open.incomingProject') || 'Проєкт із хмари'}
              </span>
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate" title={cloudProjectTitle}>
                ☁️ {cloudProjectTitle}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>{importedShapesCount} {t('cloud.open.shapesCountLabel') || 'фігур'}</span>
                <span>•</span>
                <span>{importedLayersCount} {t('cloud.open.layersCountLabel') || 'шарів'}</span>
              </div>
            </div>
          </div>

          {/* Action Choice Mode */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              {t('cloud.open.chooseAction') || 'Варіант завантаження:'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Merge / Insert */}
              <div
                onClick={() => setOpenMode('merge')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  openMode === 'merge'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm'
                    : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] bg-[var(--bg-secondary)]/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    id="mode-merge"
                    name="openMode"
                    checked={openMode === 'merge'}
                    onChange={() => setOpenMode('merge')}
                    className="mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <div>
                    <label htmlFor="mode-merge" className="font-bold text-sm cursor-pointer block text-[var(--text-primary)]">
                      ➕ {t('cloud.open.modeMerge') || 'Вставити в поточний'}
                    </label>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {t('cloud.open.modeMergeDesc') || 'Додає фігури та шари з хмари до поточного малюнка.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Replace */}
              <div
                onClick={() => setOpenMode('replace')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  openMode === 'replace'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm'
                    : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)] bg-[var(--bg-secondary)]/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    id="mode-replace"
                    name="openMode"
                    checked={openMode === 'replace'}
                    onChange={() => setOpenMode('replace')}
                    className="mt-1 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <div>
                    <label htmlFor="mode-replace" className="font-bold text-sm cursor-pointer block text-[var(--text-primary)]">
                      🔄 {t('cloud.open.modeReplace') || 'Замінити поточний'}
                    </label>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {t('cloud.open.modeReplaceDesc') || 'Повністю замінює поточний проєкт на проєкт із хмари.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Merge Options Subpanel */}
          {openMode === 'merge' ? (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-secondary)] space-y-4 animate-fade-in">
              {/* Project Name Preference */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  {t('cloud.open.namePreference') || 'Назва проєкту після вставки:'}
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-[var(--text-primary)]">
                    <input
                      type="radio"
                      name="nameMode"
                      checked={nameMode === 'keepCurrent'}
                      onChange={() => setNameMode('keepCurrent')}
                      className="text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <span>{t('cloud.open.nameKeep') || 'Залишити поточну:'} <strong className="text-[var(--text-primary)]">{currentProjectName}</strong></span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-[var(--text-primary)]">
                    <input
                      type="radio"
                      name="nameMode"
                      checked={nameMode === 'useCloud'}
                      onChange={() => setNameMode('useCloud')}
                      className="text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <span>{t('cloud.open.nameCloud') || 'Взяти з хмари:'} <strong className="text-[var(--text-primary)]">{cloudProjectTitle}</strong></span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer hover:text-[var(--text-primary)]">
                    <input
                      type="radio"
                      name="nameMode"
                      checked={nameMode === 'combine'}
                      onChange={() => setNameMode('combine')}
                      className="text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                    />
                    <span>{t('cloud.open.nameCombine') || 'Об’єднати назви:'} <strong className="text-[var(--text-primary)]">{getCombinedName()}</strong></span>
                  </label>
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="border-t border-[var(--border-secondary)] pt-3 space-y-2.5">
                <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupImported}
                    onChange={(e) => setGroupImported(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {t('cloud.open.groupImported') || 'Згрупувати всі імпортовані фігури'}
                    </span>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {t('cloud.open.groupImportedDesc') || 'Створює спільну групу для швидкого переміщення та масштабування.'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveLayers}
                    onChange={(e) => setPreserveLayers(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {t('cloud.open.preserveLayers') || 'Зберегти шари з хмарного проєкту'}
                    </span>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {t('cloud.open.preserveLayersDesc') || 'Додає шари з хмари до списку шарів (якщо в поточному є 1 порожній шар — він замінюється).'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoExpandCanvas}
                    onChange={(e) => setAutoExpandCanvas(e.target.checked)}
                    className="mt-0.5 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {t('cloud.open.autoExpandCanvas') || 'Розширити полотно, якщо хмарний проєкт більший'}
                    </span>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {t('cloud.open.autoExpandCanvasDesc') || `Розмір у хмарі: ${cloudCanvasW}×${cloudCanvasH} px. За потреби полотно буде збільшено.`}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[var(--destructive-bg)]/10 border border-[var(--destructive-bg)]/30 text-xs text-[var(--destructive-text)] flex items-center gap-2.5 animate-fade-in">
              <span className="text-base">⚠️</span>
              <span>
                {t('cloud.open.replaceWarning') || 'Усі поточні фігури та шари будуть замінені. Рекомендуємо зберегти поточний проєкт перед цією дією.'}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] transition-all"
          >
            {t('action.cancel') || 'Скасувати'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5 ${
              openMode === 'replace'
                ? 'bg-[var(--destructive-bg)] hover:bg-[var(--destructive-bg-hover)] text-white'
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)]'
            }`}
          >
            <span>
              {openMode === 'replace'
                ? t('cloud.open.confirmReplace') || 'Замінити проєкт'
                : t('cloud.open.confirmMerge') || 'Вставити проєкт'}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
};
