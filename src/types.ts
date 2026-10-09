export type Topic = 'equations' | 'logarithms';
export type Role = 'moderator' | 'admin';
export type Session = { csrfToken: string; user: null | { username: string; role: Role } };
export type Source = { id: string; authors: string; year: number; title: string; url: string; application: string; limitation: string };
export type Lesson = {
  id: string; topic: Topic; title: string; summary: string; minutes: number;
  sections: {
    title: string; body: string[]; math?: string;
    example?: { prompt: string; steps: { math: string; reason: string }[]; check?: string };
    comparison?: { left: { title: string; steps: string[] }; right: { title: string; steps: string[] } };
    sourceTags: string[];
  }[];
  checkpoint: { prompt: string; options: string[]; correct: number; explanation: string };
  sourceTags: string[];
};
export type PublicQuestion = { id: string; topic: Topic; difficulty: 1 | 2 | 3; prompt: string; math?: string; options: { id: string; text: string; math?: string }[]; hint: string; sourceTags: string[]; published?: boolean };
export type Question = PublicQuestion & { correctOptionId: string; explanation: string[]; misconception: string; published: boolean };
export type PracticeResult = { correct: boolean; correctOptionId: string; explanation: string[]; misconception: string; sourceTags: string[] };
export type ExamState = {
  id: string; status: 'active' | 'completed'; topic: string; total: number; index: number; secondsPerQuestion: number;
  serverNow: number; deadline: number | null; question: PublicQuestion | null; answered: number;
  result?: { correct: number; total: number; answers: { question: PublicQuestion; selectedOptionId: string | null; correctOptionId: string; correct: boolean; timedOut: boolean }[] };
};
export type Progress = { lessons: string[]; practice: Record<string, boolean>; exams: { correct: number; total: number; date: string }[] };
export type Audit = { id: number; username: string; action: string; questionId: string | null; createdAt: string };
