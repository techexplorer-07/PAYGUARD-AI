import { AssessmentExplorer } from '../../components/investigator/AssessmentExplorer';
import { DataSourceNotice, RecordsGate } from '../../components/investigator/DataSourceNotice';
import { PageHeader } from '../../components/investigator/InvestigatorPrimitives';
import { useInvestigatorData } from '../../hooks/useInvestigatorData';
import { emptyFilters } from '../../utils/investigator/records';

export function AlertQueuePage() {
  const { records } = useInvestigatorData();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Priority alert queue"
        description="Assessments that need attention, highest risk first. Defaults to every classification except Low; change or reset the filters to see all."
      />
      <DataSourceNotice />
      <RecordsGate />
      {records.length > 0 && (
        <AssessmentExplorer
          title="Alerts"
          description="High, medium, uncertain and insufficient-data assessments by default."
          defaults={{ ...emptyFilters, risk: 'attention' }}
          defaultSort="risk"
        />
      )}
    </div>
  );
}

export function AssessmentsPage() {
  const { records } = useInvestigatorData();
  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Every loaded assessment, latest first." />
      <DataSourceNotice />
      <RecordsGate />
      {records.length > 0 && (
        <AssessmentExplorer
          title="All assessments"
          description="Search by assessment ID, transaction ID or recipient UPI ID."
          defaults={emptyFilters}
          defaultSort="latest"
        />
      )}
    </div>
  );
}
