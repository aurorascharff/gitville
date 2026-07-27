'use client';

import { catchError, type ErrorInfo } from 'next/error';

function ErrorFallback(props: { title?: string }, { retry }: ErrorInfo) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center">
      <div className="panel pointer-events-auto flex items-center gap-3 rounded-sm px-4 py-2.5">
        <span aria-hidden className="font-pixel text-[16px] font-bold text-[#8a4a2b]">
          !
        </span>
        <p className="font-pixel text-[13px] font-bold">{props.title ?? 'Something went wrong'}</p>
        <button
          onClick={() => retry()}
          className="font-pixel cursor-pointer rounded-sm border-2 border-[#4a3826] px-2 py-0.5 text-[12px] font-bold text-[#6b5b43] transition-colors hover:bg-[#e0d3b8] hover:text-[#3a2f22]"
        >
          try again
        </button>
        <button
          onClick={() => window.history.back()}
          className="font-pixel cursor-pointer rounded-sm border-2 border-[#4a3826] px-2 py-0.5 text-[12px] font-bold text-[#6b5b43] transition-colors hover:bg-[#e0d3b8] hover:text-[#3a2f22]"
        >
          go back
        </button>
      </div>
    </div>
  );
}

// Handles notFound()/redirect() throws and re-fetches on retry.
export default catchError(ErrorFallback);
