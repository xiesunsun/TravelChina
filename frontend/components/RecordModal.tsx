import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, ArrowRight, Check, RefreshCw, Calendar, MapPin, Plus, Trash2, PenTool, Cloud } from 'lucide-react';
import { TravelRecord } from '../types';
import { WEATHER_OPTIONS, COLORS } from '../constants';
import { generateQuestion } from '../services/aiService';
import { uploadImage, uploadImages } from '../services/apiService';

interface RecordModalProps {
  isOpen: boolean;
  initialLocation?: string;
  existingRecords?: TravelRecord[];
  isFirstVisit?: boolean; // Controls whether to show Wizard or Form by default
  onClose: () => void;

  onSave: (record: TravelRecord) => void;
  onDelete?: (id: string) => void;
}

type Step = 'location' | 'date' | 'weather' | 'photo' | 'description' | 'review';
type ViewMode = 'list' | 'wizard' | 'form';

const RecordModal: React.FC<RecordModalProps> = ({ isOpen, initialLocation, existingRecords = [], isFirstVisit = true, onClose, onSave, onDelete }) => {
  // Data State
  const [formData, setFormData] = useState<Partial<TravelRecord>>({
    weather: 'sunny'
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  console.log('RecordModal Render. imageFiles:', imageFiles);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>(isFirstVisit ? 'wizard' : 'form');
  const [step, setStep] = useState<Step>('location');

  // CRITICAL FIX: If wizard mode, start with loadingQuestion=true and inputVisible=false
  // This ensures the first frame renders the AI "thinking" state, not the input.
  const [question, setQuestion] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(isFirstVisit);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      if (existingRecords.length > 0 && !isFirstVisit) {
        // Default to list view if records exist and not forced to wizard
        setViewMode('list');
      } else {
        // New entry
        resetForm();
        setViewMode('wizard');
        if (isFirstVisit) {
          setStep('location');
          loadQuestion('location', { region: initialLocation });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      region: initialLocation || '',
      weather: 'sunny',
      date: new Date().toISOString().split('T')[0]
    });
    setImageFiles([]);
    setExistingImages([]);
  };

  const handleEditRecord = (record: TravelRecord) => {
    setFormData({
      ...record,
      region: record.region || record.province || initialLocation
    });
    setExistingImages(record.images || (record.imageUrl ? [record.imageUrl] : []));
    setImageFiles([]);
    setViewMode('form');
  };

  // Effect to handle the delayed appearance of inputs after AI finishes speaking
  useEffect(() => {
    if (viewMode !== 'wizard' || step === 'review') return;

    if (!loadingQuestion && !isTransitioning) {
      // AI finished speaking, wait a bit (simulate gentle pause) then show input
      const timer = setTimeout(() => {
        setInputVisible(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // If loading or transitioning, hide input immediately
      setInputVisible(false);
    }
  }, [loadingQuestion, isTransitioning, viewMode, step]);

  const loadQuestion = async (nextStep: Step, context: any) => {
    if (nextStep === 'review') return;

    setLoadingQuestion(true);
    setInputVisible(false); // Hide input immediately when we start thinking

    // Slight delay for pacing (simulate thinking time)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    const aiPromise = generateQuestion(nextStep, context);

    const [_, text] = await Promise.all([minDelay, aiPromise]);
    setQuestion(text);
    setLoadingQuestion(false);
  };

  const handleNext = async () => {
    setIsTransitioning(true);
    setInputVisible(false); // Fade out input immediately

    let nextStep: Step = 'review';
    let context = { ...formData, region: initialLocation, city: formData.city, date: formData.date };

    switch (step) {
      case 'location':
        if (!formData.city) return;
        nextStep = 'date';
        break;
      case 'date':
        if (!formData.date) return;
        nextStep = 'weather';
        break;
      case 'weather':
        nextStep = 'photo';
        break;
      case 'photo':
        nextStep = 'description';
        break;
      case 'description':
        nextStep = 'review';
        break;
    }

    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
      if (nextStep !== 'review') {
        loadQuestion(nextStep, context);
      }
    }, 500);
  };

  const handleFinalSave = async () => {
    if (!formData.city || !formData.date) return;

    setIsSaving(true);
    try {
      let uploadedUrls: string[] = [];

      if (imageFiles.length > 0) {
        uploadedUrls = await uploadImages(imageFiles);
      }

      // Combine existing images (that weren't deleted) with new uploads
      const finalImages = [...existingImages, ...uploadedUrls];

      const newRecord: TravelRecord = {
        id: formData.id || Date.now().toString(), // Keep ID if editing
        city: formData.city,
        region: formData.region || initialLocation,
        date: formData.date,
        description: formData.description || '',
        weather: formData.weather || 'sunny',
        timestamp: Date.now(),
        imageUrl: finalImages[0], // Keep for backward compatibility
        images: finalImages
      };

      onSave(newRecord);
    } catch (error) {
      console.error("Failed to save record:", error);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // --- Render Functions ---

  const renderWizardInput = () => {
    switch (step) {
      case 'location':
        return (
          <div className="w-full">
            <input
              autoFocus
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && formData.city && handleNext()}
              placeholder="请输入城市或景点..."
              className="w-full text-center text-3xl font-serif border-b-2 border-ink/20 focus:border-cinnabar bg-transparent outline-none py-4 text-ink placeholder-ashes/30 transition-colors"
            />
          </div>
        );
      case 'date':
        return (
          <div className="w-full flex justify-center">
            <input
              type="date"
              autoFocus
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && formData.date && handleNext()}
              className="text-center text-2xl font-serif border-b-2 border-ink/20 focus:border-cinnabar bg-transparent outline-none py-4 text-ink"
            />
          </div>
        );
      case 'weather':
        return (
          <div className="grid grid-cols-4 gap-4 w-full">
            {WEATHER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setFormData({ ...formData, weather: opt.value as any });
                  setTimeout(handleNext, 300);
                }}

                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-300 ${formData.weather === opt.value
                  ? 'border-cinnabar bg-cinnabar/5 scale-105 shadow-sm'
                  : 'border-transparent hover:bg-ink/5'
                  }`}
              >
                <span className="text-4xl mb-2 filter drop-shadow-sm">{opt.icon}</span>
                <span className="font-serif text-ink">{opt.label}</span>
              </button>
            ))
            }
          </div >
        );
      case 'photo':
        return (
          <div className="w-full">
            <input
              id="wizard-photo-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const newFiles = Array.from(files);
                  setImageFiles(prev => [...prev, ...newFiles]);
                  e.target.value = ''; // Allow re-selecting the same file
                }
              }}
            />

            {imageFiles.length > 0 ? (
              <div className="w-full h-64 border-2 border-ink/10 border-dashed rounded-lg bg-paper/50 relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4 bg-paper/80 overflow-y-auto">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative aspect-square group/img">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover rounded-sm shadow-sm" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setImageFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Add More Button in Grid */}
                  <label
                    htmlFor="wizard-photo-upload"
                    className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-indigo/20 rounded-sm hover:border-cinnabar hover:text-cinnabar text-indigo/40 transition-colors cursor-pointer"
                  >
                    <Plus size={24} />
                    <span className="text-xs font-serif mt-1">添加</span>
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="wizard-photo-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-ink/10 border-dashed rounded-lg cursor-pointer bg-paper/50 hover:bg-ink/5 transition-all group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-ashes/60 group-hover:text-cinnabar transition-colors">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-serif text-lg tracking-widest mb-2">点击上传光影</p>
                  <p className="font-serif text-xs text-ashes/40">支持多张照片</p>
                </div>
              </label>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={handleNext}
                className="text-ashes text-sm font-serif hover:text-ink underline decoration-dashed underline-offset-4 transition-colors"
              >
                {imageFiles.length > 0 ? "选好了，继续" : "暂无照片，跳过"}
              </button>
            </div>
          </div>
        );
      case 'description':
        return (
          <div className="w-full">
            <textarea
              autoFocus
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleNext();
                }
              }}
              placeholder="写下此刻的思绪..."
              rows={4}
              className="w-full bg-transparent border-b-2 border-ink/20 focus:border-cinnabar outline-none py-2 text-lg text-ink placeholder-ashes/30 resize-none font-serif leading-relaxed text-center"
            />
            <div className="text-center mt-2">
              <span className="text-xs text-ashes/40 font-serif">按 Enter 继续</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderWizardReview = () => (
    <div className="w-full animate-fade-in-up flex flex-col items-center">
      <div className="w-full bg-paper p-6 shadow-xl border border-indigo/10 relative overflow-hidden mb-6 max-w-sm">
        <div className="absolute top-4 right-4 w-16 h-16 border-2 border-cinnabar rounded opacity-20 rotate-12 flex items-center justify-center pointer-events-none">
          <span className="text-cinnabar font-calligraphy text-2xl">存卷</span>
        </div>

        <h3 className="text-3xl font-calligraphy text-center text-ink mb-2">{formData.city}</h3>
        <p className="text-center text-xs font-serif text-ashes mb-6 tracking-widest">
          {formData.date} · {WEATHER_OPTIONS.find(o => o.value === formData.weather)?.label}
        </p>

        {imageFiles.length > 0 && (
          <div className="w-full h-48 bg-gray-100 mb-4 overflow-hidden relative">
            <img src={URL.createObjectURL(imageFiles[0])} className="w-full h-full object-cover filter sepia-[0.2]" alt="Review" />
            {imageFiles.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 text-xs rounded-full font-serif">
                +{imageFiles.length - 1} 张
              </div>
            )}
          </div>
        )}

        <p className="font-serif text-sm leading-7 text-ink/80 text-justify">
          {formData.description || "（未填写随笔）"}
        </p>
      </div>

      <button
        onClick={handleFinalSave}
        disabled={isSaving}
        className="bg-cinnabar text-paper px-12 py-3 rounded-full shadow-lg font-serif tracking-[0.2em] text-lg hover:bg-[#A62630] transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
        {isSaving ? "正在封存..." : "盖印确认"}
      </button>

      <button
        onClick={() => {
          setViewMode('form'); // Allow switching to form to edit
        }}
        className="mt-6 text-ashes text-sm font-serif hover:text-ink flex items-center gap-1 border-b border-dashed border-ashes/50 pb-0.5"
      >
        <PenTool size={14} /> 修改内容
      </button>
    </div>
  );

  const renderFormMode = () => (
    <div className="w-full max-w-lg bg-paper/80 p-8 rounded-sm shadow-2xl backdrop-blur-md animate-fade-in-up relative border border-indigo/5">

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8 border-b border-indigo/10 pb-4">
        {existingRecords.length > 0 && (
          <button
            onClick={() => setViewMode('list')}
            className="text-ashes hover:text-ink transition-colors flex items-center gap-1 text-sm font-serif"
          >
            <ArrowRight className="rotate-180" size={16} /> 返回列表
          </button>
        )}
        <h2 className="text-3xl font-calligraphy text-center text-ink flex-1">
          执笔绘行 · {initialLocation}
        </h2>
        {/* Placeholder for balance if back button exists */}
        {existingRecords.length > 0 && <div className="w-16"></div>}
      </div>

      <div className="space-y-6">
        {/* Location */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo/5 flex items-center justify-center text-indigo">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-ashes font-serif block mb-1">涉足之地</label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-transparent border-b border-indigo/20 focus:border-cinnabar outline-none py-1 font-serif text-lg"
              placeholder="城市名称"
            />
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo/5 flex items-center justify-center text-indigo">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-ashes font-serif block mb-1">游历之时</label>
            <input
              type="date"
              value={formData.date || ''}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-transparent border-b border-indigo/20 focus:border-cinnabar outline-none py-1 font-serif text-lg"
            />
          </div>
        </div>

        {/* Weather */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo/5 flex items-center justify-center text-indigo shrink-0">
            <Cloud size={20} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-ashes font-serif block mb-2">天色</label>
            <div className="flex gap-2 flex-wrap">
              {WEATHER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, weather: opt.value as any })}
                  className={`px-3 py-1.5 rounded text-sm font-serif border transition-colors ${formData.weather === opt.value
                    ? 'bg-cinnabar text-paper border-cinnabar'
                    : 'border-indigo/20 text-ink hover:border-indigo/50'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-2">
          <textarea
            rows={3}
            placeholder="记下一段山水情缘..."
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-paper/50 border border-indigo/10 rounded p-3 font-serif text-sm leading-relaxed focus:border-cinnabar outline-none resize-none"
          />
        </div>

        {/* Photo */}
        <div className="space-y-2">
          <label className="text-xs text-ashes font-serif block">光影记录</label>
          <div className="grid grid-cols-4 gap-2">
            {/* Existing Images */}
            {existingImages.map((url, idx) => (
              <div key={`exist - ${idx} `} className="relative aspect-square group">
                <img src={url} className="w-full h-full object-cover rounded-sm border border-indigo/10" />
                <button
                  onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* New Files */}
            {imageFiles.map((file, idx) => (
              <div key={`new- ${idx} `} className="relative aspect-square group">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-sm border border-indigo/10" />
                <button
                  onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Add Button */}
            <label className="aspect-square flex items-center justify-center border-2 border-dashed border-indigo/20 rounded-sm cursor-pointer hover:border-cinnabar hover:text-cinnabar text-indigo/40 transition-colors">
              <Plus size={24} />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const newFiles = Array.from(files);
                    setImageFiles(prev => [...prev, ...newFiles]);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleFinalSave}
          disabled={!formData.city || !formData.date || isSaving}
          className={`w-full py-3 rounded-sm font-serif tracking-widest text-lg transition-all flex items-center justify-center gap-2 ${!formData.city || !formData.date || isSaving
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-cinnabar text-paper shadow-lg hover:bg-[#A62630]'
            }`}
        >
          {isSaving && <RefreshCw className="animate-spin" size={18} />}
          {isSaving ? "正在封存..." : "盖印存卷"}
        </button>
      </div>
    </div>
  );


  const renderListMode = () => (
    <div className="w-full max-w-lg bg-paper/90 p-8 rounded-sm shadow-2xl backdrop-blur-md animate-fade-in-up relative border border-indigo/5 max-h-[80vh] overflow-y-auto">
      <h2 className="text-3xl font-calligraphy text-center text-ink mb-2">
        {initialLocation} · 游记
      </h2>
      <p className="text-center text-xs text-ashes font-serif tracking-widest mb-8">
        共 {existingRecords.length} 次涉足
      </p>

      <div className="space-y-4 mb-8">
        {existingRecords.map((record) => (
          <div
            key={record.id}
            onClick={() => handleEditRecord(record)}
            className="group flex gap-4 p-4 bg-white/50 hover:bg-white border border-transparent hover:border-indigo/10 rounded-sm transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="w-20 h-20 bg-gray-100 shrink-0 overflow-hidden rounded-sm">
              {record.images && record.images.length > 0 ? (
                <img src={record.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ashes/30">
                  <ImageIcon size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-lg text-ink font-bold">{record.city}</h3>
                  <span className="text-xs font-serif text-ashes bg-indigo/5 px-2 py-0.5 rounded-full">
                    {record.date}
                  </span>
                </div>
                <p className="text-sm text-ink/60 font-serif line-clamp-2 mt-1">
                  {record.description || "暂无随笔..."}
                </p>
              </div>
            </div>
            <div className="flex items-center text-indigo/20 group-hover:text-cinnabar transition-colors gap-2">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('确定要删除这条记录吗？')) {
                      onDelete(record.id);
                    }
                  }}
                  className="p-2 hover:bg-red-50 rounded-full text-ashes hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <ArrowRight size={20} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          resetForm();
          setViewMode('wizard');
          setStep('location');
          loadQuestion('location', { region: initialLocation });
        }}
        className="w-full py-4 border-2 border-dashed border-indigo/20 rounded-sm text-indigo/60 font-serif hover:border-cinnabar hover:text-cinnabar hover:bg-cinnabar/5 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} /> 开启新的旅程
      </button>
    </div>
  );

  // --- Main Render ---

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F3E9DF]/95 backdrop-blur-md transition-opacity duration-300 animate-fade-in-up">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo/5 to-transparent pointer-events-none"></div>

      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-ashes hover:text-cinnabar transition-colors z-10"
      >
        <X size={32} strokeWidth={1.5} />
      </button>

      {viewMode === 'list' && renderListMode()}
      {viewMode === 'form' && renderFormMode()}
      {viewMode === 'wizard' && (
        <div className="w-full max-w-2xl px-6 flex flex-col items-center justify-center min-h-[60vh]">

          {step !== 'review' && (
            <>
              {/* The "AI Friend" Voice */}
              {/* The "AI Friend" Voice */}
              <div className={`mb-12 text-center transition-all duration-500 transform ${isTransitioning ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                {/* Updated Avatar for Friend Persona - Red Square Style "伴" */}
                <div className="inline-block mb-6 relative">
                  <div className="w-14 h-14 bg-cinnabar rounded-sm flex items-center justify-center shadow-lg mx-auto border-2 border-paper ring-1 ring-indigo/10 transform rotate-3 transition-transform hover:rotate-0">
                    <span className="text-paper font-serif text-2xl font-bold">伴</span>
                  </div>
                </div>

                {loadingQuestion ? (
                  <div className="flex justify-center space-x-2 h-8 items-center opacity-50">
                    <div className="w-1.5 h-1.5 bg-indigo/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <h2 className="text-2xl md:text-3xl font-serif text-ink leading-relaxed tracking-wide max-w-xl mx-auto drop-shadow-sm animate-fade-in-up">
                    “ {question} ”
                  </h2>
                )}
              </div>

              {/* Input Area - Controlled by inputVisible */}
              <div
                className={`w-full max-w-md transition-all duration-700 transform ${inputVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
              >
                {renderWizardInput()}
              </div>

              {/* Next Button / Enter Hint */}
              {step !== 'photo' && step !== 'weather' && step !== 'location' && step !== 'date' && (
                <div className={`mt-12 transition-opacity duration-700 ${inputVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={handleNext}
                    className="w-12 h-12 rounded-full border border-ink/10 flex items-center justify-center text-ink hover:border-cinnabar hover:text-cinnabar hover:bg-cinnabar/5 transition-all"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}

              {/* Arrow for text inputs */}
              {(step === 'location' || step === 'date') && (
                <div className={`mt-12 transition-opacity duration-700 ${inputVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={handleNext}
                    disabled={!formData[step]}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${formData[step]
                      ? 'bg-ink text-paper shadow-lg hover:bg-cinnabar cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'review' && renderWizardReview()}

          {/* Progress Dots (Only in Wizard) */}
          <div className="fixed bottom-12 flex gap-3">
            {['location', 'date', 'weather', 'photo', 'description', 'review'].map((s) => {
              const stepIdx = ['location', 'date', 'weather', 'photo', 'description', 'review'].indexOf(step);
              const currentIdx = ['location', 'date', 'weather', 'photo', 'description', 'review'].indexOf(s as Step);
              const isActive = s === step;
              const isPast = currentIdx < stepIdx;

              return (

                <div
                  key={s}
                  className={`h-1 rounded-full transition-all duration-500 ${isActive ? 'w-6 bg-cinnabar' : isPast ? 'w-1 bg-ink/40' : 'w-1 bg-ink/10'
                    }`}
                />
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};

export default RecordModal;
