import useStore from '../store/useStore';
import { usePhases, useTasks } from '../hooks/useData';

const phaseWeeks = [
  { start: 0, end: 2 },
  { start: 2, end: 4 },
  { start: 4, end: 10 },
  { start: 10, end: 12 },
  { start: 12, end: 15 },
  { start: 15, end: 17 },
  { start: 20, end: 24 },
];

export default function TimelineView() {
  const { currentPhaseFilter, setPhaseFilter } = useStore();
  const { data: phases = [], isLoading: phasesLoading } = usePhases();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({});

  const totalWeeks = 24;

  if (phasesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8892a4]">
        Loading...
      </div>
    );
  }

  // Calculate stats per phase
  const phasesWithStats = phases.map((phase, idx) => {
    const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
    const doneTasks = phaseTasks.filter(t => t.status === 'DONE').length;
    const total = phaseTasks.length;
    const progress = total > 0 ? Math.round((doneTasks / total) * 100) : 0;
    return {
      ...phase,
      done: doneTasks,
      total,
      progress,
    };
  });

  const phasesToShow =
    currentPhaseFilter === 'all'
      ? phasesWithStats
      : phasesWithStats.filter((p) => p.id === currentPhaseFilter);

  return (
    <div className="p-4 sm:p-6 overflow-y-auto flex-1">
      {/* Mobile: Vertical Timeline */}
      <div className="lg:hidden space-y-4">
        {phasesToShow.map((phase, idx) => {
          const originalIdx = phases.findIndex((p) => p.id === phase.id);

          return (
            <button
              key={phase.id}
              onClick={() => setPhaseFilter(phase.id)}
              className="w-full bg-[#111827] border border-[#1e2640] rounded-xl p-4 text-left hover:border-[#6c8cff] transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{phase.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-white truncate">
                    {phase.name}
                  </h4>
                  <p className="text-[11px] text-[#556]">{phase.duration}</p>
                </div>
                <span className="text-[13px] font-semibold" style={{ color: phase.color }}>
                  {phase.progress}%
                </span>
              </div>
              <div className="h-2 bg-[#253050] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${phase.progress}%`,
                    background: phase.color,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#556] mt-2">
                <span>{phase.done} done</span>
                <span>{phase.total} total</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop: Horizontal Gantt */}
      <div className="hidden lg:block">
        <div className="py-2.5 min-w-[900px]">
          {/* Week labels */}
          <div className="flex pl-[220px] mb-3">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <span key={i} className="flex-1 text-center text-[10px] text-[#556] font-medium">
                W{i + 1}
              </span>
            ))}
          </div>

          {/* Phase bars */}
          {phasesToShow.map((phase) => {
            const originalIdx = phases.findIndex((p) => p.id === phase.id);
            const pw = phaseWeeks[originalIdx] || { start: 0, end: 2 };
            const left = (pw.start / totalWeeks) * 100;
            const width = ((pw.end - pw.start) / totalWeeks) * 100;

            return (
              <div key={phase.id} className="flex items-stretch mb-2">
                {/* Label */}
                <div className="w-[220px] shrink-0 pr-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-lg">{phase.icon}</span>
                    <h4 className="text-[13px] font-semibold text-white">
                      {phase.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-[#556] mt-0.5">
                    {phase.duration} · {phase.done}/{phase.total} done
                  </p>
                </div>

                {/* Bar area */}
                <div className="flex-1 relative py-2.5">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: totalWeeks }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 border-r border-[rgba(30,38,64,0.5)]"
                      />
                    ))}
                  </div>

                  {/* Bar */}
                  <button
                    onClick={() => setPhaseFilter(phase.id)}
                    className="h-9 rounded-lg relative flex items-center px-4 text-[11px] font-semibold text-white cursor-pointer transition-all hover:brightness-125 hover:scale-y-110"
                    style={{
                      marginLeft: `${left}%`,
                      width: `${width}%`,
                      background: `${phase.color}40`,
                      border: `1px solid ${phase.color}60`,
                    }}
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-lg"
                      style={{
                        width: `${phase.progress}%`,
                        background: `${phase.color}60`,
                      }}
                    />
                    <span className="relative z-10">{phase.progress}%</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Current week indicator */}
          <div className="pt-6 pl-[220px] text-[11px] text-[#f59e0b] flex items-center gap-2">
            <span className="text-lg">▲</span>
            {phases.length > 0 && (
              <span>Currently in {phases[0]?.duration} ({phases[0]?.name})</span>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {phasesToShow.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#8892a4] text-[14px]">No phases found</p>
        </div>
      )}
    </div>
  );
}
