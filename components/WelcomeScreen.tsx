import React from 'react';
import { NewFileIcon, OpenFileIcon, HistoryIcon, XIcon } from './icons';

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
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateNew, onLoadProject, recentProjects, onOpenRecent, onRemoveProject, onClearAllProjects }) => {
    
    const formatRelativeDate = (date: Date) => {
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const diffDays = Math.floor(diffSeconds / 86400);

        if (diffDays === 0) return 'Сьогодні';
        if (diffDays === 1) return 'Вчора';
        if (diffDays < 7) return `${diffDays} дні тому`;
        return date.toLocaleDateString();
    };

    return (
        <div className="w-full h-full bg-[var(--bg-app)] rounded-lg flex flex-col p-8 sm:p-12 lg:p-16 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
                {/* Header */}
                <header className="text-center mb-12 animate-fade-in-down">
                    <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        ВереTkа
                    </h1>
                     <div className="mt-4 max-w-3xl mx-auto">
                         <p className="text-xl md:text-2xl text-[var(--text-secondary)] font-medium italic">
                             Перетворюйте ваші малюнки на готовий код для Canvas Tkinter
                         </p>
                         <hr className="my-4 border-[var(--border-secondary)] w-1/2 mx-auto" />
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