import { useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAlertSoundPreference } from '../../../hooks/useAlertSoundPreference';
import type { AlertPlayback } from '../../../types/assessment';
import { isWarningSoundSupported, playWarningSound } from '../../../utils/warningSound';
import type { WarningSoundResult } from '../../../utils/warningSound';

const smallButtonClass =
  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/** Compact on/off switch for high-risk alert sounds, with an optional test action. */
export function AlertSoundToggle({ showTest = false }: { showTest?: boolean }) {
  const [enabled, setEnabled] = useAlertSoundPreference();
  const [testResult, setTestResult] = useState<WarningSoundResult | null>(null);
  const supported = isWarningSoundSupported();

  const test = async () => setTestResult(await playWarningSound());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
        className={`${smallButtonClass} ${
          enabled ? 'border-line bg-surface text-ink hover:bg-muted' : 'border-line bg-muted text-ink-muted hover:text-ink'
        }`}
      >
        {enabled ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
        Alert sound: {enabled ? 'On' : 'Off'}
      </button>
      {showTest && (
        <button
          type="button"
          onClick={test}
          disabled={!supported}
          className={`${smallButtonClass} border-line bg-surface text-primary hover:bg-muted`}
        >
          <Play className="size-4" aria-hidden="true" />
          Test sound
        </button>
      )}
      <span role="status" className="text-xs text-ink-muted">
        {!supported
          ? 'This browser cannot play alert sounds.'
          : testResult === 'blocked'
            ? 'Your browser blocked the sound. Check that this site may play audio.'
            : ''}
      </span>
    </div>
  );
}

const playbackMessage: Record<AlertPlayback | 'not-attempted', string> = {
  played: 'A warning sound was played.',
  blocked: 'Your browser blocked the warning sound.',
  muted: 'Alert sound is turned off.',
  unsupported: 'This browser cannot play the warning sound.',
  'not-applicable': '',
  'not-attempted': '',
};

/**
 * Manual playback control shown inside the high-risk alert. It never plays
 * automatically; the automatic attempt happens once, when the assessment completes.
 */
export function AudibleWarningControl({ initialPlayback }: { initialPlayback: AlertPlayback | null }) {
  const [playback, setPlayback] = useState<AlertPlayback | 'not-attempted'>(initialPlayback ?? 'not-attempted');
  if (playback === 'unsupported') {
    return <p className="text-sm text-ink-muted">{playbackMessage.unsupported}</p>;
  }

  const play = async () => setPlayback(await playWarningSound());
  const replay = playback === 'played';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button
        type="button"
        onClick={play}
        className={`${smallButtonClass} border-danger/30 bg-surface text-danger hover:bg-danger/5`}
      >
        {replay ? <RotateCcw className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        {replay ? 'Replay warning sound' : 'Play warning sound'}
      </button>
      <span role="status" className="text-sm text-ink-muted">
        {playbackMessage[playback]}
      </span>
    </div>
  );
}
