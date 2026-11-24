import { useLocation } from 'react-router';
import { AssessmentReport } from '../../components/customer/assessment/AssessmentReport';
import { AssessmentStatePanel } from '../../components/customer/assessment/AssessmentStatePanel';
import { buildAssessmentView } from '../../utils/assessment/buildAssessmentView';
import { readResultLocationState } from '../../utils/assessment/locationState';

/**
 * Results for a real assessment submitted from /analyse. The backend response
 * arrives in router state (never fetched or fabricated here) and is validated
 * before rendering. This page never plays sound by itself.
 */
export function AssessmentResult() {
  const location = useLocation();
  const result = readResultLocationState(location.state);

  if (result.status !== 'ok') return <AssessmentStatePanel kind={result.status} />;

  const view = buildAssessmentView(result.assessment, result.submitted, 'live');
  return <AssessmentReport view={view} alertPlayback={result.alertPlayback} />;
}
