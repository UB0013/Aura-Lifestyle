import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { TaskType, DailyStats, UserStats } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this context, we assume API_KEY is always available.
  console.warn("API_KEY is not set. Gemini API calls will fail.");
}

const getAiClient = () => new GoogleGenAI({ apiKey: API_KEY });

// This is a simplified simulation. A true 3D animated avatar is beyond current model capabilities.
// This function will generate a stylized 2D avatar image based on the uploaded photo.
export const generateAvatarFromImage = async (imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    // Step 1: Describe the uploaded image
    const descriptionResponse: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType, data: imageBase64 } },
                { text: "Describe the person in this image in detail for an artist to create a stylized, friendly, and supportive avatar. Focus on hair color and style, face shape, gender expression, and key features. Keep it concise." }
            ]
        },
    });
    const description = descriptionResponse.text;

    // Step 2: Generate a new avatar image based on the description
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A friendly and supportive 3D-style animated avatar for a mental health app. ${description}. Cheerful expression, simple gradient background, Pixar style.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1'
        }
    });
    
    if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
      return imageResponse.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("Avatar generation failed.");
    }
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw error;
  }
};

export const generateLifestyleTasks = async (existingTasks: string[]): Promise<{ task: string; type: TaskType; }[]> => {
    try {
        const ai = getAiClient();
        const prompt = `You are Aura, a supportive AI wellness companion. Create a list of exactly 3 simple, distinct, and actionable wellness tasks for a university student.
        The student has already been assigned these tasks today: "${existingTasks.join(', ')}".
        Suggest different and complementary tasks.

        For each task, provide a "task" description and a "type". The type MUST be one of:
        - 'writing' (for journaling/reflection)
        - 'food_image' (for meals)
        - 'activity_image' (for exercise, walks, or physical activities)

        Ensure a variety of types in your response.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            task: {
                                type: Type.STRING,
                                description: "A single, actionable wellness task."
                            },
                            type: {
                                type: Type.STRING,
                                description: "The type of task. Must be 'writing', 'food_image', or 'activity_image'."
                            }
                        },
                        required: ["task", "type"]
                    }
                }
            }
        });
        
        const textResponse = response.text.trim();
        const parsedData = JSON.parse(textResponse);

        const isTaskType = (type: string): type is TaskType => ['writing', 'food_image', 'activity_image'].includes(type);

        // Validate and format the response
        if (Array.isArray(parsedData) && parsedData.length > 0) {
            return parsedData.map(item => ({
                task: item.task,
                type: isTaskType(item.type) ? item.type : 'writing' // Fallback to 'writing' if type is invalid
            }));
        } else {
            throw new Error("AI did not return a valid array of tasks.");
        }
    } catch (error) {
        console.error("Error generating lifestyle tasks:", error);
        // Fallback in case of any error
        return [
            { task: "Take a 10-minute walk outside and take a picture of something you find interesting.", type: 'activity_image' },
            { task: "Write down three things you are grateful for today.", type: 'writing' },
            { task: "Prepare and eat a healthy snack, and share a photo of it.", type: 'food_image' },
        ];
    }
};

export const analyzeTextCompletion = async (userInput: string, taskDescription: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `You are Aura, a supportive AI wellness companion. A user was given the wellness task: "${taskDescription}".
        
        They submitted the following text as their completion:
        ---
        ${userInput}
        ---
        
        Please provide a short, positive, and encouraging feedback message acknowledging their effort. Do not ask questions. Just provide a single paragraph of feedback.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing text completion:", error);
        throw new Error("Aura had trouble analyzing your response. Please try again.");
    }
}

export const analyzeImageCompletion = async (imageBase64: string, mimeType: string, taskDescription: string): Promise<{ feedback: string; isComplete: boolean; }> => {
    try {
        const ai = getAiClient();
        const prompt = `You are Aura, a supportive but discerning AI wellness companion. A user was given the wellness task: "${taskDescription}". They uploaded an image as proof of completion.

Your job is to:
1.  **Evaluate**: Determine if the image is a genuine and relevant submission for the task.
    *   For a 'food' task, it must be an image of food/drink.
    *   For an 'activity' task (like a walk or exercise), it must show a relevant scene (e.g., outdoors, a park, gym equipment, sportswear, a person exercising).
    *   A completely random image (like a book, a keyboard, a blank wall, a screenshot of a desktop) is NOT a valid completion.
2.  **Respond**: Provide a JSON response with two keys: "isComplete" (boolean) and "feedback" (string).

**Scenarios:**
*   **If the image IS a valid completion:**
    *   Set "isComplete" to true.
    *   Write a short, positive, and encouraging "feedback" message. Comment on what you see that is relevant to the task.
*   **If the image is NOT a valid completion:**
    *   Set "isComplete" to false.
    *   Write a gentle but clear "feedback" message explaining why the image doesn't seem to match the task and encourage the user to try again with a different photo. For example: "This looks like a picture of [what you see]. To complete the task '${taskDescription}', could you please upload a relevant photo? I'm looking forward to seeing it!"

Be supportive but firm about the task requirements.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: imageBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isComplete: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ["isComplete", "feedback"]
                }
            }
        });
        
        const result = JSON.parse(response.text.trim());
        if (typeof result.isComplete === 'boolean' && typeof result.feedback === 'string') {
            return result;
        } else {
            throw new Error("Invalid response format from AI.");
        }
    } catch (error) {
        console.error("Error analyzing image completion:", error);
        // Fallback to a generic error, but fail the completion to be safe.
        return {
            isComplete: false,
            feedback: "Aura had trouble analyzing your image. Please check your connection and try again."
        };
    }
}

export const extractStatsFromImage = async (imageBase64: string, mimeType: string): Promise<{ steps: number; calories: number; sleepDuration: number; }> => {
    try {
        const ai = getAiClient();
        const prompt = `Analyze the provided image, which is likely a screenshot from a health or fitness tracking app. Your task is to extract three specific numerical values:
        1.  Total steps taken.
        2.  Active calories burned (look for terms like 'Active Calories', 'kcal', or just 'calories').
        3.  Sleep duration in hours (look for 'Time Asleep', 'Duration', or similar; it can be a decimal like 7.5 or in 'Xh Ym' format).

        Carefully read all text and numbers in the image to find these values. If sleep is in hours and minutes, convert it to a decimal number of hours (e.g., 7h 30m becomes 7.5).

        Respond with a JSON object containing three keys: "steps", "calories", and "sleepDuration".
        - If a value is found, provide it as a number.
        - If a specific value cannot be found in the image, use 0 as its value.
        - Do not include commas or formatting in the numbers.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: imageBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        steps: { type: Type.NUMBER },
                        calories: { type: Type.NUMBER },
                        sleepDuration: { type: Type.NUMBER }
                    },
                    required: ["steps", "calories", "sleepDuration"]
                }
            }
        });
        
        const result = JSON.parse(response.text.trim());
        if (typeof result.steps === 'number' && typeof result.calories === 'number' && typeof result.sleepDuration === 'number') {
            return result;
        } else {
            throw new Error("Invalid response format from AI for stats extraction.");
        }

    } catch (error) {
        console.error("Error extracting stats from image:", error);
        throw new Error("Aura had trouble reading the stats from your image. Please ensure it's a clear screenshot and try again.");
    }
};

export const generateAuraReportSummary = async (weeklyData: DailyStats[], dailyTasks: { completed: number, total: number }, currentStats: UserStats): Promise<{ summary: string; score: number; }> => {
    try {
        const ai = getAiClient();
        const prompt = `You are Aura, an AI wellness companion. Analyze the user's past week of data and provide a short, positive, and encouraging summary, along with a calculated "Aura Score" out of 100.

**Data Provided:**
- **Weekly History:** ${JSON.stringify(weeklyData)}
- **Today's Task Completion:** ${dailyTasks.completed} out of ${dailyTasks.total} tasks.
- **Today's Stats:** ${currentStats.steps} steps, ${currentStats.calories} calories, ${currentStats.sleepDuration} hours of sleep.

**Your Tasks:**
1.  **Calculate the Aura Score:** Create a score from 0-100. Base it on:
    *   **Task Consistency (60% weight):** The average task completion rate over the week.
    *   **Activity Level (40% weight):** Average steps, calories, and sleep. Consider goals of 8,000 steps, 300 calories, and 8 hours of sleep per day as a good baseline.
    *   Combine these factors into a single score.
2.  **Write the Summary:**
    *   Keep it to 2-3 encouraging sentences.
    *   Start by highlighting a key achievement (e.g., "You've been amazing with your tasks this week!" or "Great job staying active!").
    *   Mention one area for gentle focus, framed positively (e.g., "Let's see if we can build on that walking streak this coming week.").
    *   Do not be negative or overly critical. The tone is supportive.

**Response Format:**
Respond with a JSON object with two keys: "summary" (string) and "score" (number). The score must be a whole number between 0 and 100.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        score: { type: Type.NUMBER }
                    },
                    required: ["summary", "score"]
                }
            }
        });

        const result = JSON.parse(response.text.trim());
        if (typeof result.summary === 'string' && typeof result.score === 'number') {
            return result;
        } else {
            throw new Error("Invalid response format from AI for Aura report.");
        }

    } catch (error) {
        console.error("Error generating Aura report:", error);
        return {
            summary: "I'm having a little trouble analyzing your week, but I can see you're putting in the effort and that's what truly matters. Keep going!",
            score: 75 // Return a default positive score
        };
    }
};