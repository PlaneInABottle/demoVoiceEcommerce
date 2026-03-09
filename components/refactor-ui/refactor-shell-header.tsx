import { Badge } from '@/components/ui/badge';

type RefactorShellHeaderProps = {
  appName: string;
  roomName: string;
};

export function RefactorShellHeader({ appName, roomName }: RefactorShellHeaderProps) {
  return (
    <header className="flex flex-col gap-5 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(14,19,33,0.94),rgba(7,10,19,0.98))] px-6 py-6 shadow-[0_30px_120px_-52px_rgba(0,0,0,0.95)] sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">Voice commerce demo</Badge>
        <Badge variant="outline">Dark voice workspace</Badge>
      </div>

      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{appName}</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          A quieter, darker shell focused on the live voice conversation and the active agent session.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400 sm:text-sm">
        <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
          Shared transcript + voice session
        </div>
        <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">Room {roomName}</div>
      </div>
    </header>
  );
}
