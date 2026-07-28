'use client';

import { useEffect, useRef, useState } from 'react';
import { useVillageUi } from '@/features/village/village-ui-context';
import { cn } from '@/lib/utils';

// One looped song (public/music.mp3), lowpass-muffled indoors, with a synth-melody fallback.
const STEP = 0.42;
const REST = 0;
const LEAD = [
  72,
  74,
  76,
  REST,
  79,
  76,
  74,
  72,
  69,
  REST,
  72,
  74,
  72,
  REST,
  67,
  REST,
  72,
  74,
  76,
  79,
  81,
  REST,
  79,
  76,
  74,
  76,
  72,
  REST,
  69,
  67,
  69,
  REST,
];
const BASS = [48, 52, 45, 50, 48, 43, 45, 47];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function scheduleLoop(ctx: AudioContext, out: GainNode, t0: number): number {
  LEAD.forEach((note, i) => {
    if (note === REST) return;
    const t = t0 + i * STEP;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = hz(note);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + STEP * 1.4);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + STEP * 1.5);
  });
  BASS.forEach((note, i) => {
    const t = t0 + i * STEP * 4;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz(note);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + STEP * 3.8);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + STEP * 4);
  });
  return LEAD.length * STEP;
}

type Chain = { audio: HTMLAudioElement; filter: BiquadFilterNode; gain: GainNode };

export function VillageMusic() {
  const { focusId } = useVillageUi();
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const ctxRef = useRef<AudioContext | null>(null);
  const chainRef = useRef<Chain | null>(null);
  const synthOutRef = useRef<GainNode | null>(null);
  const synthCleanupRef = useRef<(() => void) | null>(null);
  const indoors = Boolean(focusId);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;

    const startSynth = () => {
      if (cancelled || synthCleanupRef.current) return;
      const ctx = ctxRef.current ?? new AudioContext();
      ctxRef.current = ctx;
      void ctx.resume();
      const out = ctx.createGain();
      out.gain.value = 0.4;
      out.connect(ctx.destination);
      synthOutRef.current = out;
      let next = ctx.currentTime + 0.1;
      next += scheduleLoop(ctx, out, next);
      const timer = setInterval(() => {
        if (next - ctx.currentTime < 1.5) next += scheduleLoop(ctx, out, next);
      }, 500);
      synthCleanupRef.current = () => {
        clearInterval(timer);
        out.disconnect();
        synthCleanupRef.current = null;
      };
    };

    const ensureChain = (): Chain => {
      if (chainRef.current) return chainRef.current;
      const ctx = ctxRef.current ?? new AudioContext();
      ctxRef.current = ctx;
      const audio = new Audio('/music.mp3');
      audio.loop = true;
      const source = ctx.createMediaElementSource(audio);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const gain = ctx.createGain();
      gain.gain.value = 0.3;
      source.connect(filter).connect(gain).connect(ctx.destination);
      chainRef.current = { audio, filter, gain };
      return chainRef.current;
    };

    const chain = ensureChain();
    void ctxRef.current?.resume();
    chain.audio.play().catch(startSynth);

    return () => {
      cancelled = true;
      chainRef.current?.audio.pause();
      synthCleanupRef.current?.();
    };
  }, [playing]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const chain = chainRef.current;
    if (chain) {
      chain.filter.frequency.setTargetAtTime(indoors ? 700 : 20000, ctx.currentTime, 0.15);
      chain.gain.gain.setTargetAtTime(volume * (indoors ? 0.9 : 1), ctx.currentTime, 0.15);
    }
    synthOutRef.current?.gain.setTargetAtTime(volume * 1.3, ctx.currentTime, 0.15);
  }, [indoors, playing, volume]);

  useEffect(
    () => () => {
      synthCleanupRef.current?.();
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== 'closed') void ctx.close();
    },
    [],
  );

  return (
    <div
      className={cn(
        'absolute bottom-5 z-50 flex items-center gap-1.5',
        // Clear the PR sidebar and help button that own the left column indoors —
        // but only on desktop, where the sidebar is a static column. On mobile the
        // sidebar is a hidden drawer, so sit at the normal left edge.
        indoors ? 'left-16 sm:left-[calc(min(360px,40vw)+4rem)]' : 'left-16',
      )}
    >
      <button
        type="button"
        onClick={() => setPlaying(p => !p)}
        aria-label={playing ? 'Mute the village music' : 'Play the village music'}
        aria-pressed={playing}
        className="panel font-pixel flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[15px] font-bold transition-transform hover:-translate-y-0.5"
      >
        {playing ? '♪' : <span className="opacity-45">♪</span>}
      </button>
      {playing ? (
        <div className="panel flex h-9 items-center rounded-sm px-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            aria-label="Music volume"
            className="h-1 w-16 cursor-pointer accent-[#8a4a2b]"
          />
        </div>
      ) : null}
    </div>
  );
}
