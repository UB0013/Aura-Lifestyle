import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart2, UserCircle, ArrowRight, Award, Users } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import Card from '../components/ui/Card';
import Accordion from '../components/ui/Accordion';
import CircularProgress from '../components/ui/CircularProgress';

const services = [
  { 
    title: "Aura Life",
    description: "Track your wellness journey, get personalized routines, and complete gamified mental health tasks.",
    link: "/lifestyle",
    icon: BarChart2
  },
  { 
    title: "AI Companion",
    description: "Engage in a real-time video chat with Aura, your empathetic AI, for support and guidance.",
    link: "/chatbot",
    icon: MessageSquare 
  },
  { 
    title: "Avatar Studio",
    description: "Create a unique animated avatar from your photo to represent you throughout the app.",
    link: "/avatar",
    icon: UserCircle
  },
  { 
    title: "Aura Community",
    description: "Connect with peers, share your progress, and support others on their wellness journey.",
    link: "/community",
    icon: Users
  },
];

const HomePage: React.FC = () => {
  const { user, auraScore } = useAppContext();

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="flex items-center space-x-6">
          <img src={user.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-indigo-500 object-cover" />
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {user.name}!</h1>
            <p className="text-indigo-200 mt-2">We're here to support you on your wellness journey.</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-gray-800/80 p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Award className="w-7 h-7 mr-3 text-indigo-400" />
              Your Aura Score
            </h2>
             <CircularProgress progress={auraScore} size={120} strokeWidth={10} />
            <p className="text-gray-300 mt-4 text-sm">A reflection of your wellness consistency.</p>
             <Link to="/aura-report" className="mt-4 inline-flex items-center text-indigo-400 hover:text-indigo-300 font-semibold">
              View Full Report <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
        </Card>
        
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map(service => (
              <Card key={service.title} className="hover:border-indigo-500 transition-all duration-300 flex flex-col">
                <div className="flex-grow">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-indigo-600 p-3 rounded-full">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{service.title}</h2>
                  </div>
                  <p className="text-gray-300">{service.description}</p>
                </div>
                <Link to={service.link} className="mt-6 inline-flex items-center text-indigo-400 hover:text-indigo-300 font-semibold">
                  Explore Now <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Card>
            ))}
        </div>
      </div>

       <Card>
          <h2 className="text-2xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            <Accordion title="What is Aura?">
              <p>Aura is a comprehensive mental wellness application designed for university students. It provides an AI-powered companion for real-time support, a lifestyle dashboard to track your well-being, and personalized features to make your journey engaging.</p>
            </Accordion>
            <Accordion title="Is my data private?">
              <p>Yes, your privacy is our top priority. All conversations and personal data are handled with strict confidentiality. Please review our privacy policy for more details.</p>
            </Accordion>
            <Accordion title="How does the AI Companion work?">
              <p>Our AI companion, Aura, uses advanced technology to understand your conversation and visual cues from your webcam to provide empathetic and relevant support. It's designed to be a listening ear and a guide to helpful resources.</p>
            </Accordion>
          </div>
        </Card>
    </div>
  );
};

export default HomePage;