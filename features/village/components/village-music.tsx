'use client';

import { useEffect, useRef, useState } from 'react';

// A tiny generated chiptune, Stardew-adjacent: pentatonic lead over a soft
// triangle bass, synthesized with WebAudio so there are no audio assets.
const STEP = 0.32;
const LEAD = [72, 76, 79, 81, 79, 76, 74, 72, 69, 72, 74, 76, 74, 72, 69, 67, 72, 76, 79, 84, 81, 79, 76, 74, 76, 74, 72, 69, 67, 69, 72, 72];
const BASS = [48, 52, 45, 50, 48, 52, 43, 47];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function scheduleLoop(ctx: AudioContext, out: GainNode, t0: number): number {
  LEAD.forEach((note, i) => {
    const t = t0 + i * STEP;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = hz(note);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + STEP * 0.92);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + STEP);
  });
  BASS.forEach((note, i) => {
    const t = t0 + i * STEP * 4;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = hz(note);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + STEP * 3.6);
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

  useEffect(() => {
    if (!playing) return;
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();
    const out = ctx.createGain();
    out.gain.value = 0.5;
    out.connect(ctx.destination);

    let next = ctx.currentTime + 0.1;
    next += scheduleLoop(ctx, out, next);
    const timer = setInterval(() => {
      // Keep one loop scheduled ahead of the clock.
      if (next - ctx.currentTime < 1) next += scheduleLoop(ctx, out, next);
    }, 500);
    timerRef.current = timer;

    return () => {
      clearInterval(timer);
      out.disconnect();
    };
  }, [playing]);

  useEffect(() => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void ctxRef.current?.close();
    }, []);

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
