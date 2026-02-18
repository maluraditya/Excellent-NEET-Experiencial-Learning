import { Topic, Subject, Grade } from '../types';
import { TOPICS as TOPICS_12TH } from './grades/12th';
import { TOPICS_11TH } from './grades/11th';

export const ALL_TOPICS = [...TOPICS_12TH, ...TOPICS_11TH];

export const getTopics = (grade: Grade, subject?: Subject): Topic[] => {
    let topics = grade === '11th' ? TOPICS_11TH : TOPICS_12TH;
    if (subject) {
        topics = topics.filter(t => t.subject === subject);
    }
    return topics;
};

export const getTopicById = (id: string): Topic | undefined => {
    return ALL_TOPICS.find(t => t.id === id);
};
