import { isAlertSoundEnabled } from '../../hooks/useAlertSoundPreference';
import type { AlertPlayback, VerdictKind } from '../../types/assessment';
import { playWarningSound } from '../warningSound';

/**
 * One-time audible alert for a newly completed assessment.
 *
 * Called exactly once from the event handler that receives a successful
 * assessment (form submission or demo selection), never from a render or an
 * effect, so re-renders, Strict Mode and page refreshes cannot replay it.
 * The returned status travels with the result so the page can offer a manual
 * "Play warning sound" control when playback was blocked or muted.
 */
export async function announceAssessment(kind: VerdictKind): Promise<AlertPlayback> {
  if (kind !== 'high') return 'not-applicable';
  if (!isAlertSoundEnabled()) return 'muted';
  return playWarningSound();
}
