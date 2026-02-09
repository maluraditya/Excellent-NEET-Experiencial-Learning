
import React, { useState } from 'react';
import { BookOpen, Activity, Zap, PlayCircle, Loader2, Box, Magnet, FlaskConical, Layers, Cuboid, Grid, Percent, AlertTriangle, Atom, Microscope, Wind } from 'lucide-react';
import { TOPICS } from '../data';
import { Subject } from '../types';

interface DashboardProps {
  onSelectTopic: (topicId: string) => void;
  activeSubject: Subject;
  setActiveSubject: (subject: Subject) => void;
  images: Record<string, string>;
  setImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectTopic, activeSubject, setActiveSubject, images, setImages }) => {
  // Using cover images from data.ts, no dynamic generation needed
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});
  const filteredTopics = TOPICS.filter(t => t.subject === activeSubject);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'activity': return <Activity size={80} className="text-brand-primary/20" />;
      case 'zap': return <Zap size={80} className="text-brand-secondary/80" />;
      case 'box': return <Box size={80} className="text-brand-primary/20" />;
      case 'magnet': return <Magnet size={80} className="text-brand-secondary/80" />;
      case 'flask': return <FlaskConical size={80} className="text-brand-primary/20" />;
      case 'layers': return <Layers size={80} className="text-brand-secondary/80" />;
      case 'cuboid': return <Cuboid size={80} className="text-brand-primary/20" />;
      case 'grid': return <Grid size={80} className="text-brand-secondary/80" />;
      case 'percent': return <Percent size={80} className="text-brand-primary/20" />;
      case 'alert': return <AlertTriangle size={80} className="text-brand-secondary/80" />;
      default: return <Activity size={80} className="text-brand-primary/20" />;
    }
  };

  const SubjectTab = ({ subject, icon: Icon, color }: { subject: Subject, icon: any, color: string }) => (
    <button
      onClick={() => setActiveSubject(subject)}
      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${activeSubject === subject
        ? `bg-white border-${color} shadow-xl scale-105`
        : 'bg-white/50 border-transparent hover:border-slate-300 opacity-60 hover:opacity-100'
        }`}
    >
      <div className={`p-4 rounded-xl ${activeSubject === subject ? `bg-${color}/10 text-${color}` : 'bg-slate-100 text-slate-400'}`}>
        <Icon size={32} />
      </div>
      <span className={`font-display font-bold text-sm uppercase tracking-widest ${activeSubject === subject ? 'text-slate-900' : 'text-slate-500'}`}>
        {subject}
      </span>
      {activeSubject === subject && (
        <div className={`h-1.5 w-8 rounded-full bg-${color}`}></div>
      )}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="text-center mb-12 space-y-4">
        <h2 className="text-5xl font-display font-bold text-brand-primary">
          Experience Science in 3D
        </h2>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-sans">
          Select a subject to begin your immersive learning journey through high-fidelity simulations.
        </p>
      </div>

      {/* Subject Category Layer */}
      <div className="flex flex-wrap justify-center gap-6 mb-16">
        <button
          onClick={() => setActiveSubject('Physics')}
          className={`group flex flex-col items-center gap-3 px-8 py-6 rounded-3xl border-2 transition-all duration-300 ${activeSubject === 'Physics'
            ? 'bg-white border-blue-500 shadow-xl scale-105'
            : 'bg-white/50 border-transparent hover:border-slate-200 opacity-70'
            }`}
        >
          <div className={`p-4 rounded-2xl transition-colors ${activeSubject === 'Physics' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
            <Wind size={32} />
          </div>
          <span className="font-display font-bold text-slate-800">Physics</span>
        </button>

        <button
          onClick={() => setActiveSubject('Chemistry')}
          className={`group flex flex-col items-center gap-3 px-8 py-6 rounded-3xl border-2 transition-all duration-300 ${activeSubject === 'Chemistry'
            ? 'bg-white border-brand-primary shadow-xl scale-105'
            : 'bg-white/50 border-transparent hover:border-slate-200 opacity-70'
            }`}
        >
          <div className={`p-4 rounded-2xl transition-colors ${activeSubject === 'Chemistry' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-brand-primary'}`}>
            <FlaskConical size={32} />
          </div>
          <span className="font-display font-bold text-slate-800">Chemistry</span>
        </button>

        <button
          onClick={() => setActiveSubject('Biology')}
          className={`group flex flex-col items-center gap-3 px-8 py-6 rounded-3xl border-2 transition-all duration-300 ${activeSubject === 'Biology'
            ? 'bg-white border-green-500 shadow-xl scale-105'
            : 'bg-white/50 border-transparent hover:border-slate-200 opacity-70'
            }`}
        >
          <div className={`p-4 rounded-2xl transition-colors ${activeSubject === 'Biology' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-green-100 group-hover:text-green-500'}`}>
            <Microscope size={32} />
          </div>
          <span className="font-display font-bold text-slate-800">Biology</span>
        </button>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 flex flex-col h-[520px]"
            >
              <div className="h-56 w-full bg-slate-100 relative overflow-hidden">
                {topic.coverImage || images[topic.id] ? (
                  <img
                    src={topic.coverImage || images[topic.id]}
                    alt={topic.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-brand-primary/5 to-brand-secondary/10">
                    {loadingState[topic.id] ? (
                      <div className="flex flex-col items-center text-brand-primary/50 animate-pulse">
                        <Loader2 size={48} className="animate-spin mb-2" />
                        <span className="text-xs font-medium tracking-widest uppercase">Generating AI Illustration...</span>
                      </div>
                    ) : (
                      getIcon(topic.thumbnailIcon)
                    )}
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                  {topic.branch}
                </div>
                <div className="absolute bottom-4 left-4 bg-brand-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-brand-primary uppercase tracking-wider shadow-lg border border-slate-200">
                  {topic.unit}
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between relative bg-white">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 font-display mb-4 leading-tight group-hover:text-brand-primary transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-slate-500 font-sans leading-relaxed line-clamp-3 text-sm">
                    {topic.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <PlayCircle size={16} className="text-brand-secondary" />
                    {topic.youtubeVideoIds.length} Video Lessons
                  </div>
                  <button className="bg-brand-primary text-white px-4 py-2 rounded-full font-medium shadow-md text-sm group-hover:bg-brand-secondary group-hover:text-brand-dark transition-colors flex items-center gap-2">
                    Open <BookOpen size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Atom size={40} className="text-slate-300 animate-spin-slow" />
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-400 mb-2">Coming Soon!</h3>
          <p className="text-slate-500">We are currently developing high-fidelity {activeSubject} simulations.</p>
          <button
            onClick={() => setActiveSubject('Chemistry')}
            className="mt-6 text-brand-primary font-bold hover:underline"
          >
            Explore Chemistry Simulations
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
