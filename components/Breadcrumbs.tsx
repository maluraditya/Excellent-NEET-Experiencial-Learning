import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Screen, Subject } from '../types';
import { TOPICS } from '../data';

interface BreadcrumbsProps {
    screen: Screen;
    topicId: string | null;
    onNavigate: () => void;
    activeSubject: Subject;
    onNavigateSubject: (subject: Subject) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ screen, topicId, onNavigate, activeSubject, onNavigateSubject }) => {
    const currentTopic = topicId ? TOPICS.find((t) => t.id === topicId) : null;
    const subject = currentTopic ? currentTopic.subject : activeSubject;

    return (
        <nav className="flex items-center text-sm text-slate-500 my-4 px-6 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-top-2 duration-500">
            <button
                onClick={onNavigate}
                className="flex items-center gap-1 hover:text-brand-primary transition-colors font-medium"
            >
                <Home size={14} />
                <span>Dashboard</span>
            </button>

            <ChevronRight size={14} className="mx-2 text-slate-300" />

            <button
                onClick={() => onNavigateSubject(subject)}
                className={`font-medium hover:text-brand-primary transition-colors ${!currentTopic ? 'font-bold text-brand-primary' : ''}`}
            >
                {subject}
            </button>

            {screen === 'TOPIC_VIEW' && currentTopic && (
                <>
                    <ChevronRight size={14} className="mx-2 text-slate-300" />
                    <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                        {currentTopic.title}
                    </span>
                </>
            )}
        </nav>
    );
};

export default Breadcrumbs;
