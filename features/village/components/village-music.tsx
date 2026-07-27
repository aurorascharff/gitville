'use client';

import { useEffect, useRef, useState } from 'react';

// Drop any track you own into public/music.mp3 and the village plays it.
// Without one, a small generated melody fills in: soft triangle lead with a
// touch of echo, so there are no bundled audio assets and no licensing.
const STEP = 0.42;
const REST = 0;
const LEAD = [72, 74, 76, REST, 79, 76, 74, 72, 69, REST, 72, 74, 72, REST, 67, REST, 72, 74, 76, 79, 81, REST, 79, 76, 74, 76, 72, REST, 69, 67, 69, REST];
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

export function VillageMusic() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let cleanupSynth: (() => void) | null = null;

    const audio = audioRef.current ?? new Audio('/music.mp3');
    audioRef.current = audio;
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(() => {
      // No real track available: fall back to the generated melody.
      if (cancelled) return;
      const ctx = ctxRef.current ?? new AudioContext();
      ctxRef.current = ctx;
      void ctx.resume();
      const out = ctx.createGain();
      out.gain.value = 0.5;
      out.connect(ctx.destination);
      const delay = ctx.createDelay();
      delay.delayTime.value = STEP * 2;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.22;
      out.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(ctx.destination);

      let next = ctx.currentTime + 0.1;
      next += scheduleLoop(ctx, out, next);
      const timer = setInterval(() => {
        if (next - ctx.currentTime < 1.5) next += scheduleLoop(ctx, out, next);
      }, 500);
      timerRef.current = timer;
      cleanupSynth = () => {
        clearInterval(timer);
        out.disconnect();
        delay.disconnect();
      };
    });

    return () => {
      cancelled = true;
      audio.pause();
      cleanupSynth?.();
    };
  }, [playing]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void ctxRef.current?.close();
    },
    [],
  );

  return (
    <button
      type="button"
      onClick={() => setPlaying(p => !p)}
      aria-label={playing ? 'Mute the village music' : 'Play the village music'}
      aria-pressed={playing}
      className="panel font-pixel absolute bottom-5 left-16 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-[15px] font-bold transition-transform hover:-translate-y-0.5"
    >
      {playing ? '♪' : <span className="opacity-45">♪</span>}
    </button>
  );
}
