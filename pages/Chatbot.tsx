import React, { useEffect, useRef, useState } from 'react';
// FIX: Aliased Blob to GenAIBlob to avoid conflict with the browser's native Blob type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from '@google/genai';
import { Phone, PhoneOff, AlertTriangle, LifeBuoy, Mail, Send } from 'lucide-react';
import Card from '../components/ui/Card';
import Accordion from '../components/ui/Accordion';

// Audio/Image Encoding & Decoding Helpers
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// FIX: Correctly typed the return value as GenAIBlob.
function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const ChatbotPage: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [transcript, setTranscript] = useState<{ speaker: 'User' | 'Aura'; text: string }[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (container) {
      // We only auto-scroll if the user is already near the bottom of the chat.
      // This prevents the view from jumping if they have scrolled up to read past messages.
      const scrollThreshold = 150; // A generous threshold in pixels
      const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < scrollThreshold;

      if (isNearBottom) {
        // This targets the container specifically, preventing the whole page from scrolling.
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [transcript]);

  const cleanup = () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamSourceRef.current?.disconnect();
      scriptProcessorRef.current?.disconnect();
      inputAudioContextRef.current?.close().catch(console.error);
      outputAudioContextRef.current?.close().catch(console.error);
      
      if(videoRef.current) videoRef.current.srcObject = null;
      streamRef.current = null;
      sessionPromiseRef.current = null;
      scriptProcessorRef.current = null;
      mediaStreamSourceRef.current = null;
  };

  const toggleSession = async () => {
    if (isSessionActive) {
      setStatus('Disconnecting...');
      if (sessionPromiseRef.current) {
         sessionPromiseRef.current.then(session => session.close());
      }
      cleanup();
      setIsSessionActive(false);
      setStatus('Disconnected');
      setTranscript([]);
      return;
    }

    setIsSessionActive(true);
    setTranscript([]);
    setStatus('Requesting permissions...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('Initializing...');
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      const systemInstruction = `You are Aura, a friendly and supportive university wellness companion. You are on a video call with a student. You can see their video feed and hear their voice. Be empathetic and respond to both their words and their visual expressions.

      IMPORTANT: When a student asks for help, seems distressed, or mentions needing resources, you MUST provide them with the relevant information from the 'RESOURCES' section below. Be proactive in offering this help. Format it clearly in your response.

      --- RESOURCES ---

      **Emergency & Crisis Resources**
      - Life-Threatening Emergency: Call 911
      - 988 Suicide & Crisis Lifeline: Call or text 988
      - Crisis After Hours: Call 940-565-2741, then choose Option 1

      **On-Campus Resources (University of North Texas)**
      - **Counseling & Crisis Services**
        - Make an Appointment: Call 940-565-2741 or email counselingandtestingservices@unt.edu (Mon–Fri, 8 AM–5 PM)
        - Walk-In Crisis: Visit Chestnut Hall, Suite 311 (Mon–Fri, 8 AM–5 PM)
      - **UNT Care Team:** For concerns about a student's well-being. Website: studentaffairs.unt.edu/dean-of-students/programs-and-services/care-team/

      **Community Mental Health Resources**
      - Dallas Suicide and Crisis Center: 214-828-1000
      - Denton County MHMR Center: 940-381-5000 (Crisis Hotline: 800-762-0157)

      **Upcoming Events (Examples to suggest)**
      - Natural Healing: Nature's Wisdom – Chestnut Hall
      - Adjusting to College – Chestnut Hall
      - Connecting Through Music – Chestnut Hall
      ---`;


      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setStatus('Connected. Speak or type now.');
            // Audio streaming setup
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
            
            // Video frame streaming setup
            const FRAME_RATE = 2; // 2 frames per second
            const JPEG_QUALITY = 0.7;

            frameIntervalRef.current = window.setInterval(() => {
                if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 3) {
                    const canvas = canvasRef.current;
                    const video = videoRef.current;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                        canvas.toBlob(
                            async (blob) => {
                                if (blob) {
                                    const base64Data = await blobToBase64(blob);
                                    sessionPromiseRef.current?.then((session) => {
                                        session.sendRealtimeInput({
                                            media: { data: base64Data, mimeType: 'image/jpeg' }
                                        });
                                    });
                                }
                            },
                            'image/jpeg',
                            JPEG_QUALITY
                        );
                    }
                }
            }, 1000 / FRAME_RATE);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscript(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.speaker === 'User') {
                        const newLast = { ...last, text: last.text + text };
                        return [...prev.slice(0, -1), newLast];
                    } else {
                        return [...prev, { speaker: 'User', text }];
                    }
                });
            } else if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                setTranscript(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.speaker === 'Aura') {
                        const newLast = { ...last, text: last.text + text };
                        return [...prev.slice(0, -1), newLast];
                    } else {
                        return [...prev, { speaker: 'Aura', text }];
                    }
                });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                const audioContext = outputAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
                for (const source of sourcesRef.current.values()) {
                    source.stop();
                    sourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error', e);
            setStatus(`Error: ${e.message}`);
            cleanup();
            setIsSessionActive(false);
          },
          onclose: () => {
            console.log('Session closed');
            cleanup();
            if(isSessionActive) {
                setStatus('Disconnected');
                setIsSessionActive(false);
            }
          },
        },
      });
    } catch (err) {
      console.error("Error starting session:", err);
      setStatus('Error: Failed to start session.');
      setIsSessionActive(false);
      cleanup();
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && sessionPromiseRef.current) {
      const messageToSend = textInput.trim();
      sessionPromiseRef.current.then((session) => {
        session.sendRealtimeInput({ text: messageToSend });
      });
      setTranscript(prev => [...prev, { speaker: 'User', text: messageToSend }]);
      setTextInput('');
    }
  };

  useEffect(() => {
    return () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
        cleanup();
    };
  }, []);
  
  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <Card className="flex-grow flex flex-col">
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {!isSessionActive && (
              <div className="absolute inset-0 bg-black/50 flex justify-center items-center">
                <p className="text-gray-300">Your video feed will appear here</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
              Status: {status}
            </div>
          </div>
          <div ref={transcriptContainerRef} className="flex-1 mt-4 p-4 bg-gray-900 rounded-lg overflow-y-auto h-48 border border-gray-700">
            {transcript.map((line, index) => (
                <p key={index} className="mb-2">
                    <span className={line.speaker === 'Aura' ? 'text-indigo-300 font-bold' : 'text-gray-200 font-bold'}>{line.speaker}: </span>
                    <span className={line.speaker === 'Aura' ? 'text-indigo-300' : 'text-gray-200'}>{line.text}</span>
                </p>
            ))}
            {isSessionActive && transcript.length === 0 && <div className="animate-pulse text-gray-400">Aura is listening...</div>}
          </div>

          <form onSubmit={handleSendText} className="mt-4 flex space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isSessionActive ? "Type your message..." : "Start a session to chat"}
              disabled={!isSessionActive}
              className="flex-1 bg-gray-700 text-white placeholder-gray-400 p-2 rounded-lg border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isSessionActive || !textInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>

          <div className="mt-4 flex justify-center">
            <button
              onClick={toggleSession}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold text-white transition-all duration-300 ${
                isSessionActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSessionActive ? <PhoneOff size={20} /> : <Phone size={20} />}
              <span>{isSessionActive ? 'End Session' : 'Start Session'}</span>
            </button>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card className="h-full">
          <h2 className="text-2xl font-bold text-white mb-4">Support Resources</h2>
          <p className="text-gray-400 mb-6">If you need immediate assistance, please use the resources below.</p>
          <div className="space-y-4">
             <Accordion title="Make an Appointment" defaultOpen={true}>
                <div className="space-y-2 text-sm">
                    <p>Call or email Monday to Friday, 8 AM to 5 PM</p>
                    <a href="tel:940-565-2741" className="flex items-center space-x-2 text-indigo-400 hover:underline">
                        <Phone size={16} />
                        <span>940-565-2741</span>
                    </a>
                    <a href="mailto:counselingandtestingservices@unt.edu" className="flex items-center space-x-2 text-indigo-400 hover:underline">
                        <Mail size={16} />
                        <span>counselingandtestingservices@unt.edu</span>
                    </a>
                </div>
             </Accordion>
             <Accordion title="Walk-In Crisis">
                <div className="space-y-2 text-sm">
                    <p>Visit our office Monday to Friday, 8 AM to 5 PM</p>
                    <p className="font-semibold text-gray-200">Chestnut Hall, Suite 311</p>
                </div>
             </Accordion>
             <Accordion title="Crisis After Hours">
                 <div className="space-y-2 text-sm">
                    <p className="text-amber-300 flex items-center"><AlertTriangle size={16} className="mr-2"/>Call the crisis hotline after 5 PM</p>
                    <a href="tel:940-565-2741" className="flex items-center space-x-2 text-indigo-400 hover:underline">
                        <LifeBuoy size={16} />
                        <span>940-565-2741, then choose option 1</span>
                    </a>
                 </div>
             </Accordion>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotPage;