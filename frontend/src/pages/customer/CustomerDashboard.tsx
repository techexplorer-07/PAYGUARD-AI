import { PrimaryAnalysisAction } from '../../components/customer/PrimaryAnalysisAction';
import { ProtectionStatus } from '../../components/customer/ProtectionStatus';
import { RecentEvaluations } from '../../components/customer/RecentEvaluations';
import { RiskSummary } from '../../components/customer/RiskSummary';
import { SafetyGuidance } from '../../components/customer/SafetyGuidance';
import {
  demoCustomer,
  demoEvaluations,
  demoRiskSummary,
  safetyTips,
} from '../../data/customerDemoData';
import { getGreeting } from '../../utils/format';

const RECENT_LIMIT = 3;

export function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
          {getGreeting()}, {demoCustomer.displayName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted sm:text-base">Your payment safety, all in one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <PrimaryAnalysisAction className="lg:col-span-2" />
        <ProtectionStatus />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-3">
        <RecentEvaluations
          className="lg:col-span-2"
          records={demoEvaluations.slice(0, RECENT_LIMIT)}
        />
        <RiskSummary counts={demoRiskSummary} />
      </div>

      <SafetyGuidance tips={safetyTips} />
    </div>
  );
}
