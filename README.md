
# Aura - Your University Wellness Companion 🌟

Aura is a comprehensive mental wellness application designed specifically for university students. It combines AI-powered support, lifestyle tracking, and community features to help students maintain their mental health and wellness throughout their academic journey.

## ✨ Features

### 🤖 AI Companion
- **Real-time Support**: Chat with Aura, your empathetic AI companion, for instant guidance and emotional support
- **Video Chat Integration**: Engage in face-to-face conversations with your AI wellness companion
- **Personalized Insights**: Get AI-generated weekly summaries and wellness recommendations

### 📊 Aura Life - Lifestyle Tracking
- **Daily Wellness Tasks**: Complete gamified mental health activities (writing, photo challenges, activities)
- **Health Stats Integration**: Upload screenshots from fitness apps to track steps, calories, and sleep
- **Progress Visualization**: Interactive charts showing your wellness journey over time
- **Aura Score**: Dynamic scoring system based on task completion and health metrics
- **Goal Setting**: Customize daily targets for steps, calories, and sleep duration

### 🎨 Avatar Studio
- **AI-Generated Avatars**: Create personalized 3D-style avatars from your photos using Imagen AI
- **Pixar-Style Design**: Friendly, supportive avatar representations for a welcoming experience

### 👥 Aura Community
- **Peer Support**: Connect with fellow students on their wellness journeys
- **Aura Sharing**: Share and receive "Aura points" to support community members
- **Progress Sharing**: Celebrate achievements and milestones together

### 📈 Your Aura Report
- **Weekly Analytics**: Comprehensive reports showing task consistency, activity levels, and progress
- **AI Insights**: Personalized feedback and recommendations from Aura AI
- **Trend Analysis**: Track improvements and identify areas for growth

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **AI Integration**: Google Gemini API for text generation and image analysis
- **Image Generation**: Google Imagen for avatar creation
- **Build Tool**: Vite for fast development and building
- **Icons**: Lucide React for consistent iconography
- **Routing**: React Router DOM for navigation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Google AI Studio API key (for Gemini integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UB0013/Aura-Lifestyle.git
   cd Aura-Lifestyle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **Getting your API key:**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Sign in with your Google account
   - Create a new API key
   - Copy the key to your `.env.local` file

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000` to see the application running.

## 📱 Usage Guide

### First Time Setup
1. **Explore the Dashboard**: Start on the home page to get an overview of all features
2. **Set Your Goals**: Click "Set Goals" in Aura Life to customize your daily targets
3. **Create Your Avatar**: Visit Avatar Studio to generate your personalized avatar
4. **Complete Your First Tasks**: Generate and complete wellness tasks to start building your Aura Score

### Daily Workflow
1. **Check Your Aura Life**: Review your daily stats and pending wellness tasks
2. **Upload Health Data**: Share screenshots from your fitness apps to track progress
3. **Complete Tasks**: Engage with writing prompts, photo challenges, and activities
4. **Get AI Feedback**: Receive personalized responses from Aura AI on your submissions
5. **Track Progress**: Monitor your Aura Score and weekly trends

### Weekly Review
1. **Visit Your Aura Report**: Get comprehensive analytics of your wellness journey
2. **Generate AI Insights**: Click "Generate Aura's Insights" for personalized feedback
3. **Share with Community**: Connect with peers and share your progress

## 🎯 Key Features Explained

### Aura Score Calculation
Your Aura Score is calculated using a weighted formula:
- **Steps (30%)**: Progress toward daily step goal
- **Calories (25%)**: Active calories burned vs. target
- **Sleep (25%)**: Sleep duration vs. goal
- **Task Completion (20%)**: Percentage of wellness tasks completed
- **Bonus Points**: +5 points per completed task across the week

### Task Types
- **Writing Tasks**: Journaling, reflection, and gratitude exercises
- **Food Image Tasks**: Healthy meal documentation and nutrition awareness
- **Activity Image Tasks**: Exercise, walks, and physical wellness activities

### AI Integration
- **Task Analysis**: AI evaluates task completions for authenticity and provides feedback
- **Image Recognition**: Extracts health stats from fitness app screenshots
- **Personalized Insights**: Generates weekly summaries based on your data patterns

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (Card, Modal, etc.)
│   └── layout/         # Layout components (Header, Sidebar)
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── services/           # API services and external integrations
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🤝 Contributing

We welcome contributions to make Aura even better! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- Google AI for providing the Gemini API and Imagen capabilities
- The React and TypeScript communities for excellent tooling
- University wellness programs that inspired this project
- All contributors and testers who helped shape Aura

---

**Made with ❤️ for university student wellness**
