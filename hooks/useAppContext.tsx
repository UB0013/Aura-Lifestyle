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
        
        // Add sample data for Monday and Tuesday
        let sampleStats = { steps: 0, calories: 0, sleepDuration: 0 };
        let sampleTasks: any[] = [];
        
        if (i === 0) { // Monday
            sampleStats = { steps: 6500, calories: 280, sleepDuration: 7.2 };
            sampleTasks = [
                { id: 1001, text: "Take a 15-minute walk around campus and capture a photo of something that makes you smile.", completed: true, type: 'activity_image', feedback: "What a lovely photo! I can see you found something beautiful during your walk. Taking time to notice the positive things around us is such a wonderful practice for mental wellness.", userInput: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." },
                { id: 1002, text: "Write down three things you're grateful for today and why they matter to you.", completed: true, type: 'writing', feedback: "Thank you for sharing such heartfelt gratitude! It's beautiful to see how you appreciate both the big and small things in your life. Practicing gratitude like this can really boost your mood and perspective.", userInput: "1. My morning coffee - it gives me energy and comfort to start the day right. 2. My study group - they help me understand difficult concepts and make learning fun. 3. Video call with my family - even though we're far apart, technology lets us stay connected." },
                { id: 1003, text: "Prepare a healthy snack and share a photo of your colorful creation.", completed: false, type: 'food_image' }
            ];
        } else if (i === 1) { // Tuesday
            sampleStats = { steps: 9200, calories: 420, sleepDuration: 8.5 };
            sampleTasks = [
                { id: 2001, text: "Do 10 minutes of stretching or yoga and take a photo of your setup.", completed: true, type: 'activity_image', feedback: "Excellent work on prioritizing your physical wellness! I can see you created a peaceful space for your stretching routine. Regular movement like this is so important for both your body and mind.", userInput: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." },
                { id: 2002, text: "Reflect on one challenge you faced today and how you overcame it.", completed: false, type: 'writing' },
                { id: 2003, text: "Take a photo of a nutritious meal you enjoyed today.", completed: true, type: 'food_image', feedback: "That looks absolutely delicious and nutritious! I love seeing how you're nourishing your body with such colorful, healthy foods. Good nutrition is such an important foundation for feeling your best.", userInput: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." }
            ];
        }
        
        week[dateString] = {
            tasks: sampleTasks,
            stats: sampleStats
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