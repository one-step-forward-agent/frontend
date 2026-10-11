import * as React from "react";

type PageBlob = {
  left: string;
  top: string;
  size: string;
  gradient: string;
  shape: string;
  duration: string;
  delay: string;
};

const PAGE_BLOBS: PageBlob[] = [
  { left: "-10%", top: "-2%",  size: "32rem", gradient: "from-blue-500/22     to-slate-500/10",    shape: "60% 40% 70% 30% / 60% 30% 70% 40%", duration: "24s", delay: "0s"   },
  { left: "55%",  top: "6%",   size: "28rem", gradient: "from-sky-500/18      to-blue-500/10",     shape: "40% 60% 30% 70% / 50% 60% 40% 50%", duration: "28s", delay: "3s"   },
  { left: "60%",  top: "16%",  size: "30rem", gradient: "from-blue-500/20     to-sky-500/10",      shape: "50% 50% 60% 40% / 40% 50% 60% 50%", duration: "30s", delay: "5s"   },
  { left: "-14%", top: "26%",  size: "28rem", gradient: "from-cyan-500/15     to-blue-500/8",      shape: "70% 30% 50% 50% / 50% 40% 60% 50%", duration: "26s", delay: "2s"   },
  { left: "58%",  top: "36%",  size: "30rem", gradient: "from-slate-500/16    to-blue-500/8",      shape: "60% 40% 40% 60% / 50% 50% 40% 60%", duration: "24s", delay: "4s"   },
  { left: "-10%", top: "46%",  size: "32rem", gradient: "from-blue-500/18     to-indigo-500/8",    shape: "40% 60% 50% 50% / 60% 40% 60% 40%", duration: "32s", delay: "6s"   },
  { left: "70%",  top: "56%",  size: "28rem", gradient: "from-sky-500/16      to-cyan-500/8",      shape: "50% 50% 30% 70% / 40% 60% 40% 60%", duration: "28s", delay: "1s"   },
  { left: "-8%",  top: "66%",  size: "30rem", gradient: "from-indigo-500/14   to-blue-500/8",      shape: "60% 40% 50% 50% / 50% 50% 60% 40%", duration: "30s", delay: "3.5s" },
  { left: "40%",  top: "80%",  size: "30rem", gradient: "from-slate-500/14    to-blue-500/8",      shape: "40% 60% 60% 40% / 50% 50% 40% 60%", duration: "32s", delay: "5s"   },
  { left: "-12%", top: "92%",  size: "28rem", gradient: "from-blue-500/16     to-cyan-500/8",      shape: "50% 50% 40% 60% / 60% 40% 50% 50%", duration: "34s", delay: "7s"   },
];

export const PageBackdrop: React.FC = () => (
  <>
    <style>{`
      @keyframes page-blob-drift {
        0%, 100% { transform: translate3d(0, 0, 0)    rotate(0deg)  scale(1);    }
        50%      { transform: translate3d(2%, -2%, 0) rotate(10deg) scale(1.09); }
      }
      @keyframes page-pulse {
        0%, 100% { transform: scale(0.6); opacity: 0; }
        50%      { transform: scale(1.5); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .page-blob, .page-pulse { animation: none; }
      }
    `}</style>

    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {PAGE_BLOBS.map((b, i) => (
        <div
          key={`blob-${i}`}
          className={`absolute bg-gradient-to-br blur-3xl page-blob ${b.gradient}`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            borderRadius: b.shape,
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#000",
        }}
      />
    </div>
  </>
);
