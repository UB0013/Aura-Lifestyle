import React from 'react';

export interface User {
  name: string;
  avatarUrl: string;
}

export interface Service {
  title: string;
  description: string;
  link: string;
  icon: React.ElementType;
}

export type TaskType = 'writing' | 'food_image' | 'activity_image';

export interface DailyTask {
    id: number;
    text: string;
    completed: boolean;
    type: TaskType;
    userInput?: string; // For writing content or image URL
    feedback?: string; // For AI feedback
}

export interface UserStats {
  steps: number;
  calories: number;
  sleepDuration: number; // Changed from sleepScore to sleepDuration (in hours)
}

export interface DayData {
  tasks: DailyTask[];
  stats: UserStats;
}

export interface DailyStats {
  day: string;
  steps: number;
  calories: number;
  sleepDuration: number; // Changed from sleepScore to sleepDuration (in hours)
  tasksCompleted: number;
  tasksTotal: number;
  auraScore?: number;
}

export interface Targets {
  steps: number;
  calories: number;
  sleepDuration: number; // Changed from sleepScore to sleepDuration (in hours)
}

export interface CommunityMember {
  id: number;
  name: string;
  avatarUrl: string;
  status: string;
  auraScore: number;
}