import React from 'react';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';

export const App: React.FC = () => {
  return (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  );
};

export default App;
