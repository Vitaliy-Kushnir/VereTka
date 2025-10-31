import React, { useMemo } from 'react';
import { NewFileIcon, OpenFileIcon, HistoryIcon, XIcon, ArrowRightIcon, RefreshIcon } from './icons';

interface RecentProject {
    name: string;
    handle: any; // FileSystemFileHandle
    lastOpened: Date;
    thumbnail?: string;
}

interface WelcomeScreenProps {
    onCreateNew: () => void;
    onLoadProject: () => void;
    recentProjects: RecentProject[];
    onOpenRecent: (project: RecentProject) => void;
    onRemoveProject: (project: RecentProject) => void;
    onClearAllProjects: () => void;
    hasActiveProject: boolean;
    onReturnToProject: () => void;
    autosavedProjectData: string | null;
    onRestoreAutosave: () => void;
    onDismissAutosave: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    onCreateNew, onLoadProject, recentProjects, onOpenRecent, onRemoveProject, 
    onClearAllProjects, hasActiveProject, onReturnToProject,
    autosavedProjectData, onRestoreAutosave, onDismissAutosave 
}) => {
    
    const formatRelativeDate = (date: Date) => {
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const diffDays = Math.floor(diffSeconds / 86400);

        if (diffDays === 0) return 'Сьогодні';
        if (diffDays === 1) return 'Вчора';
        if (diffDays < 7) return `${diffDays} дні тому`;
        return date.toLocaleDateString();
    };

    const parsedAutosave = useMemo(() => {
        if (!autosavedProjectData) return null;
        try {
            const data = JSON.parse(autosavedProjectData);
            return {
                name: data.projectName,
                timestamp: data.autosaveTimestamp ? new Date(data.autosaveTimestamp) : null
            };
        } catch {
            return null;
        }
    }, [autosavedProjectData]);

    return (
        <div className="w-full h-full bg-[var(--bg-app)] rounded-lg flex flex-col p-8 sm:p-12 lg:p-16 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
                 {/* Autosave Restore Banner */}
                {parsedAutosave && (
                    <div className="bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 text-sm rounded-lg p-4 mb-12 flex items-center justify-between gap-4 animate-fade-in-down">
                        <div className="flex items-center gap-4">
                            <RefreshIcon size={24} className="flex-shrink-0" />
                            <div>
                                <p className="font-bold text-yellow-100">Знайдено автозбережену версію!</p>
                                <p>
                                    Проєкт "{parsedAutosave.name}" був збережений {parsedAutosave.timestamp?.toLocaleString('uk-UA') ?? 'нещодавно'}.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button 
                                onClick={onRestoreAutosave} 
                                className="px-4 py-1.5 rounded-md font-semibold bg-yellow-600 text-white hover:bg-yellow-500 transition-colors"
                            >
                                Відновити
                            </button>
                            <button 
                                onClick={onDismissAutosave} 
                                className="p-2 rounded-md hover:bg-white/10"
                                title="Відхилити та видалити автозбережену версію"
                            >
                                <XIcon size={16} />
                            </button>
                        </div>
                    </div>
                )}
                {/* Header */}
                <header className="text-center mb-16 animate-fade-in-down">
                    <div className="inline-flex items-center gap-6 mb-6">
                        <div className="h-32 w-32 text-indigo-400 flex-shrink-0">
                            <svg viewBox="342 42 615 610" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                <path d="M0 377 167.354 0 382 0 214.646 377Z" fill="#404040" transform="matrix(-1 -8.74228e-08 -8.74228e-08 1 745 274)"/>
                                <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#404040" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 566.02 303.751)"/>
                                <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#404040" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 518.456 303.751)"/>
                                <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#404040" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 470.892 303.751)"/>
                                <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#404040" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 423.328 303.751)"/>
                                <path d="M0 11.6394C-1.43639e-15 5.21113 5.21115-1.43638e-15 11.6394-2.87276e-15L11.6394 0C18.0677-1.43638e-15 23.2788 5.21113 23.2788 11.6394L23.2787 78.6188C23.2787 85.047 18.0676 90.2582 11.6393 90.2582L11.6394 90.2581C5.21115 90.2581 0 85.0469 0 78.6187Z" fill="#404040" transform="matrix(0.913545 -0.406737 -0.406737 -0.913545 375.764 303.751)"/>
                                <path d="M719.154 224 935 224 745.846 651 530 651Z" fill="#FFC000"/>
                                <path d="M718.88 224 936 224 745.774 651C740.758 520.059 718.505 482.011 660 355.825Z" fill="#0070C0"/>
                                <path d="M736.193 243.192C733.561 249.104 726.635 251.762 720.724 249.13L720.724 249.13C714.812 246.498 712.154 239.572 714.786 233.661L741.966 172.613C744.598 166.702 751.524 164.043 757.435 166.675L757.435 166.675C763.346 169.307 766.005 176.233 763.373 182.145Z" fill="#0070C0"/>
                                <path d="M784.072 243.192C781.44 249.104 774.514 251.762 768.603 249.13L768.603 249.13C762.691 246.498 760.033 239.572 762.665 233.661L789.845 172.613C792.477 166.702 799.403 164.043 805.314 166.675L805.314 166.675C811.226 169.307 813.884 176.233 811.252 182.145Z" fill="#0070C0"/>
                                <path d="M831.951 243.192C829.319 249.104 822.393 251.762 816.482 249.13L816.482 249.13C810.571 246.498 807.912 239.572 810.544 233.661L837.724 172.613C840.356 166.702 847.282 164.043 853.193 166.675L853.193 166.675C859.105 169.307 861.763 176.233 859.131 182.145Z" fill="#0070C0"/>
                                <path d="M879.83 243.192C877.198 249.104 870.273 251.762 864.361 249.13L864.361 249.13C858.45 246.498 855.791 239.572 858.423 233.661L885.603 172.613C888.235 166.702 895.161 164.043 901.073 166.675L901.072 166.675C906.984 169.307 909.642 176.233 907.01 182.145Z" fill="#0070C0"/>
                                <path d="M927.71 243.192C925.078 249.104 918.152 251.762 912.24 249.13L912.24 249.13C906.329 246.498 903.67 239.573 906.302 233.661L933.483 172.613C936.115 166.702 943.04 164.043 948.952 166.675L948.952 166.675C954.863 169.307 957.522 176.233 954.89 182.145Z" fill="#0070C0"/>
                                <path d="M0.955665-6.59781 395.318 50.5239 393.407 63.7195-0.955665 6.59781ZM-4.77833 32.9891C-22.9977 30.3501-35.6281 13.441-32.9891-4.77833-30.3501-22.9977-13.441-35.6281 4.77833-32.9891 22.9977-30.3501 35.6281-13.441 32.9891 4.77833 30.3501 22.9977 13.441 35.6281-4.77833 32.9891ZM399.141 24.1326C417.36 26.7716 429.99 43.6806 427.351 61.9 424.712 80.1194 407.803 92.7497 389.584 90.1107 371.365 87.4717 358.734 70.5627 361.373 52.3434 364.012 34.124 380.921 21.4936 399.141 24.1326Z" fill="#0070C0" transform="matrix(1 0 0 -1 434.5 133.622)"/>
                                <path d="M220.27 30.5573C192.814 23.3587 144.253-8.25427 80.72 2.04285 17.1869 12.34-0.996792 71.4324 0.0414646 89.5092 1.07972 107.586 6.28948 135.309 15.8645 153.298 30.0006 179.858 56.4739 190.887 78.0564 183.531 99.6389 176.175 105.088 139.242 86.2557 123.988 67.423 108.734 38.8872 120.07 32.6043 134.374 26.3214 148.678 31.1916 168.911 48.5587 209.813 62.0437 243.951 85.9893 284.104 71.4443 348.273" stroke="#0070C0" strokeWidth="5.33333" strokeMiterlimit="8" fill="none" transform="matrix(-0.944285 0.329128 0.329128 0.944285 627.56 27.8097)"/>
                            </svg>
                        </div>
                        <div className="text-center">
                            <h1 className="text-7xl md:text-7xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                ВереTkа
                            </h1>
                            <p className="text-xl md:text-2xl text-[var(--text-secondary)] font-medium italic mt-2">
                                Перетворюйте ваші малюнки<br /> на готовий код для Canvas Tkinter
                            </p>
                        </div>
                    </div>
                     <div className="mt-4 max-w-3xl mx-auto">
                         <hr className="my-2 border-[var(--border-secondary)] w-1/2 mx-auto" />
                         <p className="text-md text-[var(--text-tertiary)] mt-2">
                             Простий векторний редактор <br />
                             із функцією швидкої генерації коду Python (Tkinter) на основі ваших малюнків
                         </p>
                     </div>
                </header>

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 animate-fade-in-up">
                    <button 
                        onClick={onCreateNew}
                        className="group flex items-center gap-6 p-6 bg-[var(--bg-primary)] rounded-lg text-left hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl"
                    >
                        <NewFileIcon size={32} className="text-indigo-400 flex-shrink-0" />
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Створити новий проєкт</h2>
                            <p className="text-sm text-[var(--text-tertiary)] mt-1">Почати з чистого полотна та нових ідей.</p>
                        </div>
                    </button>
                    <button 
                        onClick={onLoadProject}
                        className="group flex items-center gap-6 p-6 bg-[var(--bg-primary)] rounded-lg text-left hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl"
                    >
                        <OpenFileIcon size={32} className="text-purple-400 flex-shrink-0" />
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Завантажити проєкт</h2>
                            <p className="text-sm text-[var(--text-tertiary)] mt-1">Відкрити існуючий файл .vec.json.</p>
                        </div>
                    </button>
                </div>

                {/* Return to Project Button */}
                {hasActiveProject && (
                    <div className="mb-12 animate-fade-in-up">
                        <hr className="my-12 border-[var(--border-secondary)] w-1/4 mx-auto" />
                        <div className="flex justify-center">
                            <div className="w-full md:w-[calc(50%-0.75rem)]">
                                <button
                                    onClick={onReturnToProject}
                                    className="w-full group flex items-center gap-3 p-3 bg-[var(--accent-primary)] text-[var(--accent-text)] rounded-lg text-left hover:bg-[var(--accent-primary-hover)] border border-transparent transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <ArrowRightIcon size={32} className="flex-shrink-0 transition-transform group-hover:translate-x-1" />
                                    <div>
                                        <h2 className="text-lg font-semibold">Повернутися до проєкту</h2>
                                        <p className="text-sm text-[var(--accent-text)] opacity-80 mt-1">Продовжити редагування вашого малюнка.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Projects */}
                <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <HistoryIcon size={20} className="text-[var(--text-tertiary)]" />
                            <h2 className="text-xl font-semibold text-[var(--text-secondary)]">Останні проєкти</h2>
                        </div>
                        {recentProjects.length > 0 && (
                            <button 
                                onClick={onClearAllProjects}
                                className="text-xs text-[var(--destructive-text)] hover:underline"
                            >
                                Очистити список
                            </button>
                        )}
                    </div>
                    {recentProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {recentProjects.map((project, index) => (
                                <div 
                                    key={project.name + index}
                                    className="w-full flex flex-col rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all duration-200 ease-in-out text-left group relative"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveProject(project);
                                        }}
                                        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-[var(--bg-secondary)]/50 text-[var(--text-tertiary)] hover:bg-[var(--destructive-bg)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Видалити зі списку"
                                    >
                                        <XIcon size={14} />
                                    </button>
                                    
                                    <button onClick={() => onOpenRecent(project)} className="w-full h-full flex flex-col">
                                        <div className="w-full h-32 bg-[var(--bg-secondary)] flex items-center justify-center rounded-t-lg overflow-hidden">
                                            {project.thumbnail ? (
                                                <img src={project.thumbnail} alt={`Ескіз ${project.name}`} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xs text-[var(--text-tertiary)]">Немає ескізу</span>
                                            )}
                                        </div>
                                        <div className="p-4 flex-grow flex flex-col justify-between">
                                            <p className="font-semibold text-[var(--text-primary)] break-words line-clamp-2" title={project.name.replace(/\.vec\.json$/, '')}>
                                                {project.name.replace(/\.vec\.json$/, '')}
                                            </p>
                                            <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                                Відкрито: {formatRelativeDate(new Date(project.lastOpened))}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-tertiary)] py-10 border-2 border-dashed border-[var(--border-primary)] rounded-lg">
                            <p>Список останніх проєктів порожній.</p>
                            <p className="text-xs mt-1">Почніть роботу, створивши або завантаживши проєкт.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default WelcomeScreen;