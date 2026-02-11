import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Tag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pause,
  Circle,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useProjectOverview,
  useWorkload,
  useTrend,
  useBurndown,
  useTagAnalytics,
} from '../hooks/useData';
import useStore from '../store/useStore';
import clsx from 'clsx';

const statusColors = {
  NOT_STARTED: '#556',
  IN_PROGRESS: '#6c8cff',
  BLOCKED: '#ef4444',
  DONE: '#10b981',
};

const statusLabels = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

function StatCard({ label, value, icon: Icon, color, subtext }) {
  return (
    <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-[#8892a4] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-[28px] font-bold text-white">{value}</p>
          {subtext && <p className="text-[11px] text-[#556] mt-1">{subtext}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 bg-[#253050] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percentage}%`, background: color }}
      />
    </div>
  );
}

function StatusDistribution({ data }) {
  const total = Object.values(data || {}).reduce((sum, val) => sum + val, 0);

  return (
    <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-4">
      <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={16} className="text-[#6c8cff]" />
        Status Distribution
      </h3>
      <div className="space-y-3">
        {Object.entries(statusColors).map(([status, color]) => {
          const count = data?.[status] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[#e0e0e0]">{statusLabels[status]}</span>
                <span className="text-[12px] text-[#8892a4]">
                  {count} ({percentage}%)
                </span>
              </div>
              <ProgressBar value={count} max={total} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseProgress({ phases }) {
  return (
    <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-4">
      <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-[#6c8cff]" />
        Phase Progress
      </h3>
      <div className="space-y-4">
        {phases?.map((phase) => {
          const progress = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0;
          return (
            <div key={phase.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-[#e0e0e0] flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded"
                    style={{ background: phase.color }}
                  />
                  {phase.name}
                </span>
                <span className="text-[11px] text-[#8892a4]">
                  {phase.done}/{phase.total}
                </span>
              </div>
              <ProgressBar value={phase.done} max={phase.total} color={phase.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkloadChart({ workload }) {
  const maxTasks = Math.max(...(workload?.assignees?.map(a => a.totalTasks) || [1]));

  return (
    <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-4">
      <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
        <Users size={16} className="text-[#6c8cff]" />
        Team Workload
      </h3>
      <div className="space-y-3">
        {workload?.assignees?.slice(0, 8).map((person) => (
          <div key={person.id} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background: person.color }}
            >
              {person.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[#e0e0e0] truncate">{person.name}</span>
                <div className="flex items-center gap-2 text-[10px]">
                  {person.overdue > 0 && (
                    <span className="text-[#ef4444]">{person.overdue} overdue</span>
                  )}
                  <span className="text-[#8892a4]">{person.totalTasks} tasks</span>
                </div>
              </div>
              <ProgressBar
                value={person.totalTasks}
                max={maxTasks}
                color={person.overdue > 0 ? '#ef4444' : '#6c8cff'}
              />
            </div>
          </div>
        ))}
        {workload?.unassignedTasks > 0 && (
          <div className="pt-2 border-t border-[#1e2640] text-[11px] text-[#8892a4]">
            {workload.unassignedTasks} unassigned tasks
          </div>
        )}
      </div>
    </div>
  );
}

function TrendChart({ trend }) {
  const data = trend?.trend || [];
  const maxValue = Math.max(...data.map(d => d.completed), 1);

  return (
    <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-4">
      <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar size={16} className="text-[#6c8cff]" />
        Completion Trend (30 days)
      </h3>
      <div className="h-32 flex items-end gap-1">
        {data.slice(-30).map((day, idx) => (
          <div
            key={idx}
            className="flex-1 bg-[#6c8cff] rounded-t hover:brightness-125 transition-all min-w-[6px]"
            style={{
              height: `${maxValue > 0 ? (day.completed / maxValue) * 100 : 0}%`,
              minHeight: day.completed > 0 ? '4px' : '0px',
            }}
            title={`${format(new Date(day.date), 'MMM d')}: ${day.completed} completed`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-[#556]">
        <span>{data.length > 0 ? format(new Date(data[0]?.date), 'MMM d') : ''}</span>
        <span>{data.length > 0 ? format(new Date(data[data.length - 1]?.date), 'MMM d') : ''}</span>
      </div>
    </div>
  );
}

function TagStats({ tags }) {
  return (
    <div className="bg-[#1a2035] border border-[#1e2640] rounded-xl p-4">
      <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
        <Tag size={16} className="text-[#6c8cff]" />
        Tags Overview
      </h3>
      <div className="space-y-2">
        {tags?.slice(0, 8).map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between py-1.5 border-b border-[#1e2640] last:border-b-0"
          >
            <span
              className="text-[12px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-[#8892a4]">
              <span>{tag.completed}/{tag.totalTasks} done</span>
              {tag.highPriority > 0 && (
                <span className="text-[#ef4444]">{tag.highPriority} high</span>
              )}
            </div>
          </div>
        ))}
        {(!tags || tags.length === 0) && (
          <p className="text-[12px] text-[#556] text-center py-4">No tags yet</p>
        )}
      </div>
    </div>
  );
}

export default function ReportsView() {
  const { currentProject } = useStore();
  const { data: overview, isLoading: loadingOverview } = useProjectOverview();
  const { data: workload, isLoading: loadingWorkload } = useWorkload();
  const { data: trend, isLoading: loadingTrend } = useTrend(30);
  const { data: tagAnalytics, isLoading: loadingTags } = useTagAnalytics();

  const isLoading = loadingOverview || loadingWorkload || loadingTrend || loadingTags;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-[#8892a4]">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#6c8cff] flex items-center justify-center">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Reports & Analytics</h1>
          <p className="text-[12px] text-[#8892a4]">
            {currentProject?.name} overview
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Tasks"
          value={overview?.totalTasks || 0}
          icon={Circle}
          color="#6c8cff"
        />
        <StatCard
          label="Completed"
          value={overview?.completedTasks || 0}
          icon={CheckCircle2}
          color="#10b981"
          subtext={`${overview?.completionRate || 0}% completion rate`}
        />
        <StatCard
          label="Overdue"
          value={overview?.overdueTasks || 0}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <StatCard
          label="Due This Week"
          value={overview?.dueThisWeek || 0}
          icon={Calendar}
          color="#f59e0b"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatusDistribution data={overview?.tasksByStatus} />
        <PhaseProgress phases={overview?.tasksByPhase} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <WorkloadChart workload={workload} />
        <TrendChart trend={trend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TagStats tags={tagAnalytics} />
      </div>
    </div>
  );
}
