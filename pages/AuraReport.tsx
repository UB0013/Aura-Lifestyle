import React, { useState, useEffect } from 'react';
import { Award, CheckSquare, Footprints, Flame, BrainCircuit, Wand2 } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { generateAuraReportSummary } from '../services/geminiService';
import type { DailyStats } from '../types';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import CircularProgress from '../components/ui/CircularProgress';
import LineChart from '../components/ui/LineChart';

const AuraReportPage: React.FC = () => {
    const { weeklyData, targets, auraScore } = useAppContext();
    
    const [isCalculating, setIsCalculating] = useState(true);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const [summary, setSummary] = useState<string | null>(null);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const [chartData, setChartData] = useState<DailyStats[]>([]);
    
    const [visibleLines, setVisibleLines] = useState({
        steps: true,
        calories: true,
        auraScore: true,
    });

    const handleLegendClick = (key: 'steps' | 'calories' | 'auraScore') => {
        setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        const calculateStats = () => {
            setIsCalculating(true);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            const processedWeeklyData: DailyStats[] = Object.entries(weeklyData).map(([dateString, dayData]) => {
                const tasksCompleted = dayData.tasks.filter(t => t.completed).length;
                const tasksTotal = dayData.tasks.length;
                const { stats } = dayData;

                const stepsScore = Math.min(stats.steps / targets.steps, 1) * 100;
                const caloriesScore = Math.min(stats.calories / targets.calories, 1) * 100;
                const sleepScoreValue = Math.min(stats.sleepDuration / targets.sleepDuration, 1) * 100;
                const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 100;

                const dailyAuraScore = Math.round(
                    (stepsScore * 0.30) + (caloriesScore * 0.25) + (sleepScoreValue * 0.25) + (taskScore * 0.20)
                );
                
                return {
                    day: dayNames[new Date(dateString).getUTCDay()],
                    steps: stats.steps,
                    calories: stats.calories,
                    sleepDuration: stats.sleepDuration,
                    tasksCompleted: tasksCompleted,
                    tasksTotal: tasksTotal,
                    auraScore: dailyAuraScore,
                };
            });
            setChartData(processedWeeklyData);
            setIsCalculating(false);
        };

        calculateStats();
    }, [weeklyData, targets]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setSummaryError(null);
        setSummary(null);

        const todayIndex = chartData.length > 0 ? chartData.length - 1 : 0;
        const pastData = chartData.slice(0, todayIndex);
        const todayData = chartData.length > 0 ? chartData[todayIndex] : null;

        try {
            if (todayData) {
                const report = await generateAuraReportSummary(
                    pastData, 
                    { completed: todayData.tasksCompleted, total: todayData.tasksTotal },
                    { steps: todayData.steps, calories: todayData.calories, sleepDuration: todayData.sleepDuration }
                );
                setSummary(report.summary);
            } else {
                setSummary("Not enough data to generate a summary. Complete some tasks and try again!");
            }
        } catch (err: any) {
            setSummaryError(err.message || 'Failed to generate Aura report summary.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };


    const taskCompletionRate = chartData.length > 0 && chartData.reduce((acc, curr) => acc + curr.tasksTotal, 0) > 0
        ? (chartData.reduce((acc, curr) => acc + curr.tasksCompleted, 0) / chartData.reduce((acc, curr) => acc + curr.tasksTotal, 0)) * 100
        : 0;
    const avgSteps = chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr.steps, 0) / chartData.length : 0;
    const avgCalories = chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr.calories, 0) / chartData.length : 0;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center space-x-4">
                    <Award size={40} className="text-indigo-400" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Your Aura Report</h1>
                        <p className="text-gray-300 mt-1">A weekly summary of your wellness journey.</p>
                    </div>
                </div>
            </Card>

            {isCalculating ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <Spinner />
                        <p className="mt-4 text-indigo-300">Calculating your weekly stats...</p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center p-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Your Aura Score</h2>
                        <CircularProgress progress={auraScore} size={150} strokeWidth={12} />
                    </Card>
                     <Card className="lg:col-span-2 flex flex-col justify-center">
                         <div className="flex items-start space-x-4">
                            <BrainCircuit size={32} className="text-indigo-400 flex-shrink-0 mt-1" />
                            <div>
                               <h2 className="text-xl font-semibold text-white">Aura's Insights</h2>
                               {isGeneratingSummary ? (
                                    <div className="flex items-center space-x-2 mt-2 text-gray-400">
                                        <Spinner /><span>Aura is analyzing your week...</span>
                                    </div>
                               ) : summaryError ? (
                                    <p className="text-red-400 mt-2">{summaryError}</p>
                               ) : summary ? (
                                    <p className="text-gray-300 mt-2 italic">"{summary}"</p>
                               ) : (
                                    <p className="text-gray-400 mt-2">Click below to get a personalized summary of your week from Aura.</p>
                               )}
                            </div>
                        </div>
                        <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="w-full sm:w-auto mt-4 ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-gray-500">
                            <Wand2 size={18} />
                            <span>{summary ? "Regenerate" : "Generate Aura's Insights"}</span>
                        </button>
                    </Card>
                    <Card className="text-center p-4">
                         <CheckSquare size={32} className="mx-auto text-green-400 mb-2"/>
                         <p className="text-3xl font-bold">{Math.round(taskCompletionRate)}%</p>
                         <p className="text-gray-400">Task Consistency</p>
                    </Card>
                    <Card className="text-center p-4">
                         <Footprints size={32} className="mx-auto text-cyan-400 mb-2"/>
                         <p className="text-3xl font-bold">{Math.round(avgSteps).toLocaleString()}</p>
                         <p className="text-gray-400">Avg. Daily Steps</p>
                    </Card>
                     <Card className="text-center p-4">
                         <Flame size={32} className="mx-auto text-red-400 mb-2"/>
                         <p className="text-3xl font-bold">{Math.round(avgCalories).toLocaleString()}</p>
                         <p className="text-gray-400">Avg. Daily Calories</p>
                    </Card>
                     <Card className="lg:col-span-3">
                         <h2 className="text-xl font-semibold text-white mb-4 text-center">Your Week at a Glance</h2>
                         <LineChart 
                            data={chartData} 
                            visibleLines={visibleLines}
                            onLegendClick={handleLegendClick}
                          />
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AuraReportPage;