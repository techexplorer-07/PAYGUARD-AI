import type React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { CustomerLayout } from './layouts/CustomerLayout';
import { MainLayout } from './layouts/MainLayout';
import { AnalysePayment } from './pages/customer/AnalysePayment';
import { AssessmentResult } from './pages/customer/AssessmentResult';
import { CustomerActivity } from './pages/customer/CustomerActivity';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerNotFound } from './pages/customer/CustomerNotFound';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { EvaluationDetail } from './pages/customer/EvaluationDetail';
import { LandingPage } from './pages/LandingPage';

type InvestigatorModule = typeof import('./pages/investigator');
const investigator = (pick: (module: InvestigatorModule) => React.ComponentType) => async () => ({
  Component: pick(await import('./pages/investigator')),
});

/** Shown while a lazily loaded route module downloads on first page load. */
function RouteLoading() {
  return (
    <p role="status" className="p-8 text-center text-sm text-ink-muted">
      Loading…
    </p>
  );
}

const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    hydrateFallbackElement: <RouteLoading />,
    children: [
      { index: true, element: <CustomerDashboard /> },
      { path: 'analyse', element: <AnalysePayment /> },
      { path: 'analyse/result', element: <AssessmentResult /> },
      { path: 'analyse/demo', lazy: async () => ({ Component: (await import('./pages/customer/DemoAssessments')).DemoAssessments }) },
      {
        path: 'analyse/demo/:scenarioId',
        lazy: async () => ({ Component: (await import('./pages/customer/DemoAssessmentResult')).DemoAssessmentResult }),
      },
      { path: 'activity', element: <CustomerActivity /> },
      { path: 'activity/:evaluationId', element: <EvaluationDetail /> },
      { path: 'profile', element: <CustomerProfilePage /> },
      { path: '*', element: <CustomerNotFound /> },
    ],
  },
  {
    // Fraud Intelligence Centre (Module 4). Prototype: no authentication or role-based access control exists.
    path: '/investigator',
    lazy: investigator((m) => m.InvestigatorLayout),
    hydrateFallbackElement: <RouteLoading />,
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', lazy: investigator((m) => m.InvestigatorOverview) },
      { path: 'alerts', lazy: investigator((m) => m.AlertQueuePage) },
      { path: 'assessments', lazy: investigator((m) => m.AssessmentsPage) },
      { path: 'assessments/:evaluationId', lazy: investigator((m) => m.InvestigationDetailPage) },
      { path: 'recipients', lazy: investigator((m) => m.RecipientIntelligencePage) },
      { path: 'recipients/:recipientId', lazy: investigator((m) => m.RecipientDetailPage) },
      { path: 'graph', lazy: investigator((m) => m.EvidenceGraphPage) },
      { path: 'history', lazy: investigator((m) => m.InvestigationHistoryPage) },
      { path: '*', element: <Navigate to="overview" replace /> },
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
