import React, { useState, useEffect } from 'react';
import { Footprints, Flame, CheckCircle, BrainCircuit, Wand2, Upload, Edit, Image as ImageIcon, Camera, Activity, BedDouble, Calendar, Target } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import Accordion from '../components/ui/Accordion';
import { generateLifestyleTasks, analyzeTextCompletion, analyzeImageCompletion, extractStatsFromImage } from '../services/geminiService';
import type { DailyTask, TaskType, Targets } from '../types';
import { useAppContext } from '../hooks/useAppContext';

// Helper function to convert a File blob to a base64 string
const blobToBase64 = (blob: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string)); // Return with data URI scheme
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Adding UTC time to avoid timezone shifts
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const LifestylePage: React.FC = () => {
  const { weeklyData, setWeeklyData, targets, setTargets } = useAppContext();
  
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [goalInputs, setGoalInputs] = useState<Targets>(targets);

  useEffect(() => {
    setGoalInputs(targets);
  }, [targets]);
  
  // State for the verification modal
  const [taskToVerify, setTaskToVerify] = useState<{ task: DailyTask, date: string } | null>(null);
  const [verificationInputText, setVerificationInputText] = useState('');
  const [verificationInputFile, setVerificationInputFile] = useState<File | null>(null);
  const [verificationImagePreview, setVerificationImagePreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // State for the stats update modal
  const [statsModalDate, setStatsModalDate] = useState<string | null>(null);
  const [statsFile, setStatsFile] = useState<File | null>(null);
  const [statsImagePreview, setStatsImagePreview] = useState<string | null>(null);
  const [isExtractingStats, setIsExtractingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const handleTaskClick = (clickedTask: DailyTask, date: string) => {
    if (clickedTask.completed) return;
    setTaskToVerify({ task: clickedTask, date });
    setVerificationInputText('');
    setVerificationInputFile(null);
    setVerificationImagePreview(null);
    setVerificationError(null);
  };

  const handleVerificationModalClose = () => {
    setTaskToVerify(null);
  }
  
  const handleVerificationImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setVerificationInputFile(file);
        setVerificationImagePreview(URL.createObjectURL(file));
        setVerificationError(null);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!taskToVerify) return;

    setIsVerifying(true);
    setVerificationError(null);

    const { task: targetTask, date: taskDate } = taskToVerify;

    try {
        let isTaskCompleted = false;
        let feedbackMessage = '';
        let userInputData: string | undefined = undefined;

        if (targetTask.type === 'writing') {
            if (!verificationInputText.trim()) {
                setVerificationError("Please write something to submit.");
                setIsVerifying(false);
                return;
            }
            feedbackMessage = await analyzeTextCompletion(verificationInputText, targetTask.text);
            userInputData = verificationInputText;
            isTaskCompleted = true;
        } else if (targetTask.type === 'food_image' || targetTask.type === 'activity_image') {
            if (!verificationInputFile) {
                setVerificationError("Please upload an image to submit.");
                setIsVerifying(false);
                return;
            }
            const fullBase64 = await blobToBase64(verificationInputFile);
            const base64Data = fullBase64.split(',')[1];
            const { isComplete, feedback } = await analyzeImageCompletion(base64Data, verificationInputFile.type, targetTask.text);
            
            if (isComplete) {
                isTaskCompleted = true;
                feedbackMessage = feedback;
                userInputData = fullBase64;
            } else {
                setVerificationError(feedback);
                setIsVerifying(false);
                return;
            }
        }

        if (isTaskCompleted) {
            setWeeklyData(prev => {
                const newWeeklyData = { ...prev };
                const dayData = { ...newWeeklyData[taskDate] };
                dayData.tasks = dayData.tasks.map(task => 
                    task.id === targetTask.id 
                        ? { ...task, completed: true, feedback: feedbackMessage, userInput: userInputData } 
                        : task
                );
                newWeeklyData[taskDate] = dayData;
                return newWeeklyData;
            });
            handleVerificationModalClose();
        }
    } catch (e: any) {
        setVerificationError(e.message || "An unknown error occurred during analysis.");
    } finally {
        setIsVerifying(false);
    }
  };

  const handleStatsModalOpen = (date: string) => {
      setStatsModalDate(date);
      setStatsFile(null);
      setStatsImagePreview(null);
      setStatsError(null);
  };

  const handleStatsModalClose = () => {
    setStatsModalDate(null);
  };

  const handleStatsImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setStatsFile(file);
        setStatsImagePreview(URL.createObjectURL(file));
        setStatsError(null);
    }
  };

  const handleExtractStats = async () => {
      if (!statsFile || !statsModalDate) {
          setStatsError("Please select an image first.");
          return;
      }
      setIsExtractingStats(true);
      setStatsError(null);

      try {
          const fullBase64 = await blobToBase64(statsFile);
          const base64Data = fullBase64.split(',')[1];
          const result = await extractStatsFromImage(base64Data, statsFile.type);
          
          setWeeklyData(prev => {
              const newWeeklyData = { ...prev };
              const dayData = { ...newWeeklyData[statsModalDate!] };
              dayData.stats = result;
              newWeeklyData[statsModalDate!] = dayData;
              return newWeeklyData;
          });
          
          handleStatsModalClose();
      } catch (error: any) {
          setStatsError(error.message || "Failed to extract stats.");
      } finally {
          setIsExtractingStats(false);
      }
  };

  const handleGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoalInputs(prev => ({...prev, [name]: parseFloat(value) || 0}));
  };

  const handleSaveGoals = () => {
      setTargets(goalInputs);
      setIsGoalsModalOpen(false);
  };

  const handleGenerateTasks = async (date: string) => {
    // Special case for Wednesday, October 22, 2025
    if (date === '2025-10-22') {
        const specialTasks: DailyTask[] = [
            { id: Date.now(), text: "Submit a photo of the hackathon you attended with your team.", completed: false, type: 'activity_image' },
            { id: Date.now() + 1, text: "Take a walk and send a picture of your surroundings.", completed: false, type: 'activity_image' },
            { id: Date.now() + 2, text: "You need good sleep today for everything you accomplished. Upload a picture of your bed before you sleep.", completed: false, type: 'activity_image' },
        ];
        
        setWeeklyData(prev => {
            const newWeeklyData = { ...prev };
            const dayData = { ...newWeeklyData[date] };
            dayData.tasks = specialTasks; // Replace any existing tasks with these special ones
            newWeeklyData[date] = dayData;
            return newWeeklyData;
        });
        return; // Exit function after setting special tasks
    }
    
    // Default behavior for all other days
    setIsGeneratingTasks(true);
    setTasksError(null);
    try {
      const existingTaskTexts = weeklyData[date].tasks.map(t => t.text);
      const newGeneratedTasks = await generateLifestyleTasks(existingTaskTexts);

      const newTasks: DailyTask[] = newGeneratedTasks.map((task, index) => ({
        id: Date.now() + index,
        text: task.task,
        completed: false,
        type: task.type,
      }));

      setWeeklyData(prev => {
        const newWeeklyData = { ...prev };
        const dayData = { ...newWeeklyData[date] };
        dayData.tasks = [...dayData.tasks, ...newTasks];
        newWeeklyData[date] = dayData;
        return newWeeklyData;
      });

    } catch (error) {
      console.error("Failed to generate tasks", error);
      setTasksError("Aura had trouble generating tasks. Please try again.");
    } finally {
      setIsGeneratingTasks(false);
    }
  };
  
  const getTaskIcon = (type: TaskType) => {
    switch (type) {
        case 'writing': return <Edit className="w-6 h-6 mr-4 text-gray-400" />;
        case 'food_image': return <ImageIcon className="w-6 h-6 mr-4 text-gray-400" />;
        case 'activity_image': return <Camera className="w-6 h-6 mr-4 text-gray-400" />;
        default: return <CheckCircle className="w-6 h-6 mr-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
       <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <Calendar size={40} className="text-indigo-400" />
                  <div>
                      <h1 className="text-3xl font-bold text-white">Your Aura Life</h1>
                      <p className="text-gray-300 mt-1">Your personal space to plan and track your wellness journey.</p>
                  </div>
              </div>
               <button onClick={() => setIsGoalsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
                 <Target size={18} />
                 <span>Set Goals</span>
               </button>
          </div>
        </Card>

        {Object.entries(weeklyData).map(([date, dayData]) => {
            const pendingTasks = dayData.tasks.filter(t => !t.completed);
            const completedTasks = dayData.tasks.filter(t => t.completed);

            return (
                <Card key={date}>
                    <Accordion title={formatDate(date)} defaultOpen={date === '2025-10-20'}>
                        <div className="space-y-6 pt-4">
                            {/* Stats Section */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                <h3 className="text-xl font-semibold text-white">Daily Stats</h3>
                                <button onClick={() => handleStatsModalOpen(date)} className="mt-2 sm:mt-0 bg-gray-700 hover:bg-gray-600 text-indigo-300 font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors text-sm"><Activity size={18} /><span>Update Stats</span></button>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="flex items-center space-x-3 p-3 bg-gray-900/50 rounded-lg"><Footprints size={32} className="text-cyan-300" /><div><p className="text-gray-400 text-xs">Steps</p><p className="text-xl font-bold">{dayData.stats.steps.toLocaleString()}</p></div></div>
                                <div className="flex items-center space-x-3 p-3 bg-gray-900/50 rounded-lg"><Flame size={32} className="text-red-300" /><div><p className="text-gray-400 text-xs">Calories</p><p className="text-xl font-bold">{dayData.stats.calories.toLocaleString()}</p></div></div>
                                <div className="flex items-center space-x-3 p-3 bg-gray-900/50 rounded-lg"><BedDouble size={32} className="text-purple-300" /><div><p className="text-gray-400 text-xs">Sleep Duration</p><p className="text-xl font-bold">{dayData.stats.sleepDuration.toFixed(1)} hrs</p></div></div>
                            </div>

                            {/* Tasks Section */}
                            <h3 className="text-xl font-semibold text-white pt-4 border-t border-gray-700">Wellness Tasks</h3>
                             {dayData.tasks.length > 0 ? (
                                <>
                                  <div className="space-y-3">{pendingTasks.map(task => (<div key={task.id} onClick={() => handleTaskClick(task, date)} className="flex items-center p-3 rounded-lg cursor-pointer transition-all bg-gray-700 hover:bg-gray-600">{getTaskIcon(task.type)}<span className="text-gray-200">{task.text}</span></div>))}</div>
                                  {completedTasks.length > 0 && (<div className="mt-4 pt-4 border-t border-gray-700/50"><h4 className="text-md font-semibold text-gray-300 mb-2">Completed</h4>{completedTasks.map(task => (<div key={task.id} className="p-3 rounded-lg bg-green-900/50 mb-2 text-left"><div className="flex items-center"><CheckCircle className="w-6 h-6 mr-4 text-green-400 flex-shrink-0" /><span className="line-through text-gray-400">{task.text}</span></div></div>))}</div>)}
                                </>
                             ) : (
                                <div className="text-center py-4 bg-gray-900/50 rounded-lg">
                                    <p className="text-gray-400">No tasks for this day yet.</p>
                                </div>
                             )}

                            {/* Generate Tasks Button - Only show for current/future days */}
                            {(() => {
                                const isPastDay = date === '2025-10-20' || date === '2025-10-21'; // Monday and Tuesday
                                
                                if (!isPastDay) {
                                    return (
                                        <div className="pt-4 border-t border-gray-700">
                                            <button 
                                              onClick={() => handleGenerateTasks(date)} 
                                              disabled={isGeneratingTasks}
                                              className="w-full bg-gray-700 hover:bg-gray-600 text-indigo-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                                            >
                                              {isGeneratingTasks ? <Spinner /> : <Wand2 size={20} />}
                                              <span>{isGeneratingTasks ? "Generating..." : "Generate 3 Wellness Tasks"}</span>
                                            </button>
                                            {tasksError && <p className="text-red-400 text-sm mt-2 text-center">{tasksError}</p>}
                                        </div>
                                    );
                                }
                                return null; // Don't show anything for past days
                            })()}
                        </div>
                    </Accordion>
                </Card>
            )
        })}

      {/* Set Goals Modal */}
      <Modal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} title="Set Your Daily Goals">
        <div className="space-y-4">
            <p className="text-gray-400 text-sm">These daily targets will be used to calculate your Aura Score.</p>
            <div><label htmlFor="steps" className="block text-sm font-medium text-gray-300">Daily Steps Goal</label><input type="number" name="steps" id="steps" value={goalInputs.steps} onChange={handleGoalInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2" /></div>
            <div><label htmlFor="calories" className="block text-sm font-medium text-gray-300">Daily Calories Goal</label><input type="number" name="calories" id="calories" value={goalInputs.calories} onChange={handleGoalInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2" /></div>
            <div><label htmlFor="sleepDuration" className="block text-sm font-medium text-gray-300">Daily Sleep Goal (in hours)</label><input type="number" name="sleepDuration" id="sleepDuration" value={goalInputs.sleepDuration} onChange={handleGoalInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2" /></div>
            <button onClick={handleSaveGoals} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Goals</button>
        </div>
      </Modal>
      
      {/* Stats Update Modal */}
       <Modal isOpen={!!statsModalDate} onClose={handleStatsModalClose} title={`Update Stats for ${statsModalDate ? formatDate(statsModalDate) : ''}`}>
         <div className="space-y-4">
            <p className="text-sm text-gray-400">Upload a screenshot from your health or fitness app.</p>
            <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex justify-center items-center bg-gray-900/50 relative">
                {statsImagePreview ? (<img src={statsImagePreview} alt="Stats upload preview" className="object-contain max-w-full max-h-full rounded-lg" />) : (<div className="text-center text-gray-400"><Upload size={32} className="mx-auto mb-2" /><p>Upload screenshot</p></div>)}
                <input type="file" accept="image/*" onChange={handleStatsImageInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            {statsError && <p className="text-red-400 text-sm">{statsError}</p>}
            <button onClick={handleExtractStats} disabled={isExtractingStats || !statsFile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500">
                {isExtractingStats ? <Spinner /> : 'Extract Stats'}
            </button>
         </div>
       </Modal>


      {/* Task Verification Modal */}
      <Modal isOpen={!!taskToVerify} onClose={handleVerificationModalClose} title="Complete Your Task">
        {taskToVerify && (
          <div className="space-y-4">
            <p className="text-lg text-indigo-300 font-semibold">{taskToVerify.task.text}</p>
            {taskToVerify.task.type === 'writing' && (
              <div><label className="block text-sm font-medium text-gray-300 mb-2">Your thoughts:</label><textarea rows={6} value={verificationInputText} onChange={(e) => setVerificationInputText(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-white p-2" placeholder="Write your response here..." /></div>
            )}
            {(taskToVerify.task.type === 'food_image' || taskToVerify.task.type === 'activity_image') && (
              <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex justify-center items-center bg-gray-900/50 relative">
                  {verificationImagePreview ? (<img src={verificationImagePreview} alt="Upload preview" className="object-contain max-w-full max-h-full rounded-lg" />) : (<div className="text-center text-gray-400"><Upload size={32} className="mx-auto mb-2" /><p>{taskToVerify.task.type === 'food_image' ? 'Upload a photo of your meal' : 'Upload a photo of your activity'}</p></div>)}
                  <input type="file" accept="image/*" onChange={handleVerificationImageInputChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            )}
            {verificationError && <p className="text-red-400 text-sm">{verificationError}</p>}
            <button onClick={handleVerificationSubmit} disabled={isVerifying} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:bg-gray-500">
                {isVerifying ? <Spinner /> : 'Submit for Feedback'}
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default LifestylePage;