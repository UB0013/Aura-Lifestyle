import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, DayData, Targets } from '../types';

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  weeklyData: Record<string, DayData>;
  setWeeklyData: React.Dispatch<React.SetStateAction<Record<string, DayData>>>;
  targets: Targets;
  setTargets: React.Dispatch<React.SetStateAction<Targets>>;
  auraScore: number;
  auraShared: number;
  auraReceived: number;
  shareAura: (amount: number) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initializeWeekData = (): Record<string, DayData> => {
    const week: Record<string, DayData> = {};
    const startDate = new Date('2025-10-20T00:00:00'); // Start on Monday, Oct 20, 2025

    for (let i = 0; i < 4; i++) { // Loop for 4 days
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        week[dateString] = {
            tasks: [],
            stats: { steps: 0, calories: 0, sleepDuration: 0 }
        };
    }
    return week;
};

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    name: 'Alex',
    avatarUrl: 'https://picsum.photos/seed/user/100/100',
  });
  
  const [avatarUrl, setAvatarUrlState] = useState<string>(user.avatarUrl);
  const [weeklyData, setWeeklyData] = useState<Record<string, DayData>>(initializeWeekData());
  const [targets, setTargets] = useState<Targets>({ steps: 8000, calories: 400, sleepDuration: 8 });
  const [auraScore, setAuraScore] = useState(0);
  const [auraShared, setAuraShared] = useState(0);
  const [auraReceived, setAuraReceived] = useState(15); // Hardcode some received aura for Alex

  const shareAura = (amount: number): boolean => {
      if (auraScore >= amount) {
          setAuraShared(prev => prev + amount);
          return true;
      }
      return false;
  };

  useEffect(() => {
    const calculateAuraScore = () => {
        const dailyScores = Object.values(weeklyData).map(dayData => {
            const { stats, tasks } = dayData;
            
            const stepsScore = Math.min(stats.steps / targets.steps, 1) * 100;
            const caloriesScore = Math.min(stats.calories / targets.calories, 1) * 100;
            const sleepScoreValue = Math.min(stats.sleepDuration / targets.sleepDuration, 1) * 100;
            
            const tasksCompletedCount = tasks.filter(t => t.completed).length;
            const tasksTotal = tasks.length;
            const taskScore = tasksTotal > 0 ? (tasksCompletedCount / tasksTotal) * 100 : 100;

            const dailyScore = (stepsScore * 0.30) + (caloriesScore * 0.25) + (sleepScoreValue * 0.25) + (taskScore * 0.20);
            return isNaN(dailyScore) ? 0 : dailyScore;
        });

        const baseScore = dailyScores.length > 0
            ? Math.round(dailyScores.reduce((acc, score) => acc + score, 0) / dailyScores.length)
            : 0;
        
        // Add a 5 point bonus for each completed task across the week.
        const totalTasksCompleted = Object.values(weeklyData).reduce((total, dayData) => {
            return total + dayData.tasks.filter(t => t.completed).length;
        }, 0);
        
        const taskCompletionBonus = totalTasksCompleted * 5;

        // The final score is the base score plus the bonus, then adjusted for sharing.
        const scoreWithBonus = baseScore + taskCompletionBonus;

        setAuraScore(scoreWithBonus - auraShared + auraReceived);
    };
    
    calculateAuraScore();
  }, [weeklyData, targets, auraShared, auraReceived]);


  const setAvatarUrl = (url: string) => {
    setAvatarUrlState(url);
    setUser(prevUser => ({ ...prevUser, avatarUrl: url }));
  };

  return (
    <AppContext.Provider value={{ user, setUser, avatarUrl, setAvatarUrl, weeklyData, setWeeklyData, targets, setTargets, auraScore, auraShared, auraReceived, shareAura }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};