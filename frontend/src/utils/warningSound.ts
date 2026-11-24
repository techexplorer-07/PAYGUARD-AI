/**
 * PAYGUARD high-risk warning sound, synthesised locally with the Web Audio API.
 *
 * Two short electronic pulses (~1.1 s total): a filtered square tone that dips
 * slightly in pitch, with a soft sine an octave below for body. Peak gain is
 * kept modest so the alert is noticeable without being harsh. No audio files
 * or external URLs are used.
 */

export type WarningSoundResult = 'played' | 'blocked' | 'unsupported';

const PULSE_SECONDS = 0.38;
const GAP_SECONDS = 0.24;
const PULSE_COUNT = 2;
const PEAK_GAIN = 0.16;
/** How long to wait for a suspended AudioContext to start before treating playback as blocked. */
const RESUME_TIMEOUT_MS = 300;

type AudioContextConstructor = typeof AudioContext;

let playing = false;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const legacy = (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return window.AudioContext ?? legacy ?? null;
}

export function isWarningSoundSupported(): boolean {
  return getAudioContextConstructor() !== null;
}

function schedulePulse(context: AudioContext, destination: AudioNode, start: number) {
  const end = start + PULSE_SECONDS;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(PEAK_GAIN, start + 0.015);
  envelope.gain.setValueAtTime(PEAK_GAIN, end - 0.09);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  envelope.connect(destination);

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, start);
  filter.Q.setValueAtTime(0.7, start);
  filter.connect(envelope);

  const tone = context.createOscillator();
  tone.type = 'square';
  tone.frequency.setValueAtTime(880, start);
  tone.frequency.exponentialRampToValueAtTime(740, end);
  tone.connect(filter);

  const body = context.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(440, start);
  body.frequency.exponentialRampToValueAtTime(370, end);
  const bodyGain = context.createGain();
  bodyGain.gain.setValueAtTime(0.6, start);
  body.connect(bodyGain);
  bodyGain.connect(envelope);

  tone.start(start);
  body.start(start);
  tone.stop(end + 0.02);
  body.stop(end + 0.02);
}

/**
 * Plays the two-pulse warning once. Resolves as soon as playback has been
 * scheduled (or refused), so callers never wait for the sound to finish.
 * Concurrent calls while a warning is already sounding are ignored.
 */
export async function playWarningSound(): Promise<WarningSoundResult> {
  const Context = getAudioContextConstructor();
  if (!Context) return 'unsupported';
  if (playing) return 'played';

  let context: AudioContext;
  try {
    context = new Context();
  } catch {
    return 'unsupported';
  }

  if (context.state !== 'running') {
    try {
      await Promise.race([
        context.resume(),
        new Promise((resolve) => setTimeout(resolve, RESUME_TIMEOUT_MS)),
      ]);
    } catch {
      // Treated as blocked below.
    }
  }

  if (context.state !== 'running') {
    void context.close().catch(() => undefined);
    return 'blocked';
  }

  playing = true;
  const startAt = context.currentTime + 0.03;
  for (let index = 0; index < PULSE_COUNT; index += 1) {
    schedulePulse(context, context.destination, startAt + index * (PULSE_SECONDS + GAP_SECONDS));
  }

  const totalMs = (PULSE_COUNT * PULSE_SECONDS + (PULSE_COUNT - 1) * GAP_SECONDS) * 1000 + 250;
  setTimeout(() => {
    playing = false;
    void context.close().catch(() => undefined);
  }, totalMs);

  return 'played';
}
