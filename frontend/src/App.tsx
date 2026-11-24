import { createBrowserRouter, RouterProvider } from 'react-router';
import { CustomerLayout } from './layouts/CustomerLayout';
import { MainLayout } from './layouts/MainLayout';
import { AnalysePayment } from './pages/customer/AnalysePayment';
import { AnalysisSubmitted } from './pages/customer/AnalysisSubmitted';
import { CustomerActivity } from './pages/customer/CustomerActivity';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerNotFound } from './pages/customer/CustomerNotFound';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { EvaluationDetail } from './pages/customer/EvaluationDetail';
import { LandingPage } from './pages/LandingPage';

const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerDashboard /> },
      { path: 'analyse', element: <AnalysePayment /> },
      { path: 'analyse/result', element: <AnalysisSubmitted /> },
      { path: 'activity', element: <CustomerActivity /> },
      { path: 'activity/:evaluationId', element: <EvaluationDetail /> },
      { path: 'profile', element: <CustomerProfilePage /> },
      { path: '*', element: <CustomerNotFound /> },
    ],
  },
  {
    // Existing project landing page and backend health diagnostics, preserved unchanged.
    path: '/system',
    element: (
      <MainLayout>
        <LandingPage />
      </MainLayout>
    ),
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

export default App;
