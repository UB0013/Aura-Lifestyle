import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from './hooks/useAppContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Chatbot from './pages/Chatbot';
import Lifestyle from './pages/Lifestyle';
import AvatarCreator from './pages/AvatarCreator';
import AuraReport from './pages/AuraReport';
import Community from './pages/Community';

export default function App() {
  return (
    <AppContextProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/lifestyle" element={<Lifestyle />} />
            <Route path="/aura-report" element={<AuraReport />} />
            <Route path="/avatar" element={<AvatarCreator />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContextProvider>
  );
}