import React, { useState, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon, GridIcon, PlayIcon, PauseIcon, SparklesIcon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './icons';
import { SHAPE_INFOS, SHAPES, type ShapeInfo } from './VeretkaLoader';

interface LoaderShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabMode = 'featured' | 'grid' | 'matrix';

const COLOR_PRESETS = [
  { id: 'indigo-cyan', label: 'Indigo / Cyan', start: '#818cf8', end: '#38bdf8' },
  { id: 'emerald-teal', label: 'Emerald / Teal', start: '#34d399', end: '#14b8a6' },
  { id: 'rose-amber', label: 'Rose / Amber', start: '#f43f5e', end: '#fbbf24' },
  { id: 'violet-pink', label: 'Violet / Pink', start: '#a855f7', end: '#ec4899' },
  { id: 'neon-green', label: 'Neon Green', start: '#22c55e', end: '#86efac' },
  { id: 'gold-sunset', label: 'Gold Sunset', start: '#f59e0b', end: '#ef4444' },
];

export const LoaderShowcaseModal: React.FC<LoaderShowcaseModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabMode>('featured');
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(0);
  const [duration, setDuration] = useState<number>(4); // seconds per cycle
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [showVertices, setShowVertices] = useState<boolean>(false);
  const [showGlow, setShowGlow] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentShapeInfo = SHAPE_INFOS[selectedShapeIndex] || SHAPE_INFOS[0];

  const getLocalizedName = (info: ShapeInfo) => {
    return language === 'uk' ? info.nameUk : info.nameEn;
  };

  const filteredShapes = useMemo(() => {
    if (!searchQuery.trim()) return SHAPE_INFOS;
    const q = searchQuery.toLowerCase();
    return SHAPE_INFOS.filter(
      s => s.nameUk.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q) || `#${s.id}`.includes(q)
    );
  }, [searchQuery]);

  // Generate continuous SVG animation values from current shape to sequence of shapes
  const featuredAnimationData = useMemo(() => {
    const sequence: string[] = [];
    const times: string[] = [];
    const splines: string[] = [];

    const numTransitions = 16;
    const totalSegments = numTransitions + 1;
    const timePerCycle = 1 / totalSegments;
    const holdRatio = 0.2;
    const morphRatio = 0.8;

    let currentTime = 0;
    let currIdx = selectedShapeIndex;
    let currPoints = SHAPES[currIdx];

    sequence.push(currPoints);
    times.push(currentTime.toFixed(4));

    for (let i = 0; i < numTransitions; i++) {
      let nextIdx: number;
      if (isPaused) {
        nextIdx = currIdx;
      } else {
        do {
          nextIdx = Math.floor(Math.random() * SHAPES.length);
        } while (nextIdx === currIdx && SHAPES.length > 1);
      }

      const nextPoints = SHAPES[nextIdx];

      // Hold
      currentTime += timePerCycle * holdRatio;
      sequence.push(currPoints);
      times.push(currentTime.toFixed(4));
      splines.push("0.25 0.1 0.25 1");

      // Morph
      currentTime += timePerCycle * morphRatio;
      sequence.push(nextPoints);
      times.push(currentTime.toFixed(4));
      splines.push("0.4 0 0.2 1");

      currIdx = nextIdx;
      currPoints = nextPoints;
    }

    // Return to start
    currentTime += timePerCycle * holdRatio;
    sequence.push(currPoints);
    times.push(currentTime.toFixed(4));
    splines.push("0.25 0.1 0.25 1");

    currentTime += timePerCycle * morphRatio;
    sequence.push(SHAPES[selectedShapeIndex]);
    times.push("1.0000");
    splines.push("0.4 0 0.2 1");

    return {
      values: sequence.join(';'),
      keyTimes: times.join(';'),
      keySplines: splines.join(';')
    };
  }, [selectedShapeIndex, isPaused]);

  if (!isOpen) return null;

  // Extract vertices points for showing dots overlay
  const parsedVertices = currentShapeInfo.pointsString.split(' ').map(pt => {
    const [x, y] = pt.split(',').map(Number);
    return { x, y };
  });

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[var(--bg-primary)] rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-[var(--border-primary)] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <SparklesIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                {t('loaderShowcase.title') || 'Галерея фігур завантаження (Морфінг)'}
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  #004
                </span>
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {t('loaderShowcase.subtitle') || 'Усі 34 геометричні фігури з безперервною SVG-анімацією морфінгу'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            aria-label={t('action.close')}
          >
            <XIcon size={20} />
          </button>
        </header>

        {/* Toolbar & Tab Switcher */}
        <div className="px-5 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-primary)] flex flex-wrap items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-secondary)] text-xs font-medium">
            <button
              onClick={() => setActiveTab('featured')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'featured'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <SparklesIcon size={14} />
              <span>{t('loaderShowcase.viewFeatured') || 'Інспектор морфінгу'}</span>
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'grid'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GridIcon size={14} />
              <span>{t('loaderShowcase.viewGrid') || 'Сітка 34 фігур'}</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <RefreshCwIcon size={14} />
              <span>{t('loaderShowcase.viewMatrix') || 'Матриця морфінгу'}</span>
            </button>
          </div>

          {/* Preset Customization */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Color Presets */}
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] px-2 py-1 rounded-lg border border-[var(--border-secondary)]">
              <span className="text-[var(--text-tertiary)] mr-1 font-medium">{t('loaderShowcase.color') || 'Колір'}:</span>
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedColor(preset)}
                  title={preset.label}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    selectedColor.id === preset.id ? 'scale-110 border-white ring-2 ring-indigo-500/50' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${preset.start}, ${preset.end})` }}
                />
              ))}
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border-secondary)]">
              <span className="text-[var(--text-tertiary)] font-medium">{t('loaderShowcase.speed') || 'Швидкість'}:</span>
              {[2, 4, 8, 12].map(sec => (
                <button
                  key={sec}
                  onClick={() => setDuration(sec)}
                  className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                    duration === sec
                      ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'featured' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-center">
              {/* Left Column: Big Interactive Morphing Stage */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl border border-slate-800 p-8 min-h-[380px] relative overflow-hidden group shadow-inner">
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#818cf8 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Main SVG Loader Stage */}
                <div className="relative w-64 h-64 flex items-center justify-center my-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="showcase-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedColor.start} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={selectedColor.end} stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="showcase-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedColor.start} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={selectedColor.end} stopOpacity="0.6" />
                      </linearGradient>
                    </defs>

                    {/* Glow Outline */}
                    {showGlow && (
                      <polygon
                        fill="none"
                        stroke="url(#showcase-glow)"
                        strokeWidth={strokeWidth * 2.5}
                        strokeLinejoin="round"
                        className="blur-md"
                      >
                        <animate
                          attributeName="points"
                          dur={`${duration * 2}s`}
                          repeatCount="indefinite"
                          calcMode="spline"
                          values={featuredAnimationData.values}
                          keyTimes={featuredAnimationData.keyTimes}
                          keySplines={featuredAnimationData.keySplines}
                        />
                      </polygon>
                    )}

                    {/* Main Morphing Contour */}
                    <polygon
                      fill="none"
                      stroke="url(#showcase-gradient)"
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                    >
                      <animate
                        attributeName="points"
                        dur={`${duration * 2}s`}
                        repeatCount="indefinite"
                        calcMode="spline"
                        values={featuredAnimationData.values}
                        keyTimes={featuredAnimationData.keyTimes}
                        keySplines={featuredAnimationData.keySplines}
                      />
                    </polygon>

                    {/* Vertices Dots Overlay */}
                    {showVertices &&
                      parsedVertices.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r="1.8"
                          fill="#f43f5e"
                          stroke="#ffffff"
                          strokeWidth="0.5"
                          className="animate-pulse"
                        />
                      ))}
                  </svg>
                </div>

                {/* Shape Identifier Badge */}
                <div className="mt-4 flex flex-col items-center gap-1 z-10">
                  <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    #{currentShapeInfo.id.toString().padStart(2, '0')} • {getLocalizedName(currentShapeInfo)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    36 точок точного геометрічного алгоритму
                  </span>
                </div>

                {/* Stage Floating Controls */}
                <div className="flex items-center gap-2 mt-6 z-10 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-xl backdrop-blur-md">
                  <button
                    onClick={() =>
                      setSelectedShapeIndex(prev => (prev > 0 ? prev - 1 : SHAPE_INFOS.length - 1))
                    }
                    className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    title={t('loaderShowcase.prev') || 'Попередня фігура'}
                  >
                    <ChevronLeftIcon size={18} />
                  </button>

                  <button
                    onClick={() => setIsPaused(p => !p)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    {isPaused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
                    <span>{isPaused ? (t('loaderShowcase.play') || 'Відтворити') : (t('loaderShowcase.pause') || 'Пауза')}</span>
                  </button>

                  <button
                    onClick={() => {
                      let r: number;
                      do {
                        r = Math.floor(Math.random() * SHAPE_INFOS.length);
                      } while (r === selectedShapeIndex);
                      setSelectedShapeIndex(r);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1 transition-colors"
                    title={t('loaderShowcase.random') || 'Випадкова фігура'}
                  >
                    <RefreshCwIcon size={14} />
                    <span>{t('loaderShowcase.random') || 'Випадкова'}</span>
                  </button>

                  <button
                    onClick={() =>
                      setSelectedShapeIndex(prev => (prev < SHAPE_INFOS.length - 1 ? prev + 1 : 0))
                    }
                    className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    title={t('loaderShowcase.next') || 'Наступна фігура'}
                  >
                    <ChevronRightIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Right Column: Shape Customization & Details */}
              <div className="lg:col-span-4 flex flex-col gap-4 bg-[var(--bg-secondary)]/40 p-5 rounded-2xl border border-[var(--border-secondary)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-secondary)] pb-2">
                  Параметри відображення
                </h3>

                {/* Stroke Width Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] font-medium">
                    <span>{t('loaderShowcase.strokeWidth') || 'Товщина контуру'}:</span>
                    <span className="font-mono text-indigo-400 font-bold">{strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={strokeWidth}
                    onChange={e => setStrokeWidth(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-[var(--bg-tertiary)] rounded-lg h-2"
                  />
                </div>

                {/* Checkbox Toggles */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-secondary)]">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-secondary)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors text-xs font-medium text-[var(--text-primary)]">
                    <span>Показати 36 контрольних точок</span>
                    <input
                      type="checkbox"
                      checked={showVertices}
                      onChange={e => setShowVertices(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-secondary)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors text-xs font-medium text-[var(--text-primary)]">
                    <span>Неонове сяйво (Glow effect)</span>
                    <input
                      type="checkbox"
                      checked={showGlow}
                      onChange={e => setShowGlow(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>

                {/* Select Shape Dropdown */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-secondary)]">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Стартова фігура ({selectedShapeIndex + 1} з {SHAPE_INFOS.length}):
                  </label>
                  <select
                    value={selectedShapeIndex}
                    onChange={e => setSelectedShapeIndex(Number(e.target.value))}
                    className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-medium rounded-lg p-2.5 border border-[var(--border-secondary)] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {SHAPE_INFOS.map((info, idx) => (
                      <option key={info.id} value={idx}>
                        #{info.id.toString().padStart(2, '0')} — {getLocalizedName(info)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Stats Box */}
                <div className="mt-auto p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                  <div className="font-semibold text-indigo-200 flex items-center gap-1.5">
                    <SparklesIcon size={14} />
                    <span>Алгоритм точкового морфінгу</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-indigo-300/80">
                    Кожна з 34 фігур розраховується в реальному часі векторним семплінгом уздовж периметру. Режим Spline забезпечує унікальну плавність трансформацій.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="🔍 Пошук фігури за назвою чи номером (#01 - #34)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs rounded-xl px-4 py-2.5 border border-[var(--border-secondary)] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)]"
                  >
                    Очистити
                  </button>
                )}
              </div>

              {/* Grid of 34 Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredShapes.map(info => {
                  const idx = info.id - 1;
                  const isSelected = selectedShapeIndex === idx;

                  return (
                    <div
                      key={info.id}
                      onClick={() => {
                        setSelectedShapeIndex(idx);
                        setActiveTab('featured');
                      }}
                      className={`group relative bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center gap-2 ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/5'
                          : 'border-[var(--border-secondary)] hover:border-indigo-500/50'
                      }`}
                    >
                      {/* Badge Number */}
                      <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-[var(--text-tertiary)] group-hover:text-indigo-400">
                        #{info.id.toString().padStart(2, '0')}
                      </span>

                      {isSelected && (
                        <span className="absolute top-2 right-2 text-indigo-400">
                          <CheckIcon size={14} />
                        </span>
                      )}

                      {/* SVG Mini Preview */}
                      <div className="w-16 h-16 my-2 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient
                              id={`grid-grad-${info.id}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor={selectedColor.start} />
                              <stop offset="100%" stopColor={selectedColor.end} />
                            </linearGradient>
                          </defs>
                          <polygon
                            points={info.pointsString}
                            fill="none"
                            stroke={`url(#grid-grad-${info.id})`}
                            strokeWidth="3.5"
                            strokeLinejoin="round"
                            className="group-hover:scale-105 transition-transform origin-center"
                          />
                        </svg>
                      </div>

                      {/* Title */}
                      <span className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-indigo-400 transition-colors">
                        {getLocalizedName(info)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-tertiary)] text-center">
                12 паралельних екземплярів анімації завантаження з різними початковими фігурами та швидкістю
              </p>

              {/* Matrix Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const startIdx = (i * 3) % SHAPE_INFOS.length;
                  const info = SHAPE_INFOS[startIdx];
                  const speed = 2 + (i % 4) * 1.5;

                  return (
                    <div
                      key={i}
                      className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center gap-3 relative overflow-hidden shadow-inner group hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="w-20 h-20">
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient
                              id={`matrix-grad-${i}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor={selectedColor.start} />
                              <stop offset="100%" stopColor={selectedColor.end} />
                            </linearGradient>
                          </defs>
                          <polygon
                            fill="none"
                            stroke={`url(#matrix-grad-${i})`}
                            strokeWidth="3"
                            strokeLinejoin="round"
                          >
                            <animate
                              attributeName="points"
                              dur={`${speed * 2}s`}
                              repeatCount="indefinite"
                              calcMode="spline"
                              values={`${SHAPES[startIdx]};${SHAPES[(startIdx + 5) % SHAPES.length]};${SHAPES[(startIdx + 11) % SHAPES.length]};${SHAPES[startIdx]}`}
                              keyTimes="0; 0.33; 0.66; 1"
                              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
                            />
                          </polygon>
                        </svg>
                      </div>

                      <div className="text-center">
                        <span className="text-[11px] font-mono font-bold text-indigo-400 block">
                          #{info.id.toString().padStart(2, '0')} {getLocalizedName(info)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          speed: {speed.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex justify-between items-center text-xs">
          <span className="text-[var(--text-tertiary)] font-mono">
            Веретка Loader • 34 Shapes • Morphing Engine
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
          >
            {t('action.close') || 'Закрити'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LoaderShowcaseModal;
