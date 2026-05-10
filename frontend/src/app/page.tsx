'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import {
  Cloud,
  TrendingDown,
  TrendingUp,
  Server,
  AlertTriangle,
  DollarSign,
  Activity,
  Zap,
  Cpu,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Filter,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  X,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchOptimizationData } from '@/lib/api';
import type { CloudOptimizerResponse, EC2Instance, Resource, ServiceCost, ZombieResource, UtilizationData } from '@/lib/types';

const fetcher = () => fetchOptimizationData().then((res) => res as Promise<CloudOptimizerResponse>);

// ============================================
// INTERACTIVE DATA TYPES
// ============================================

interface FilterState {
  states: string[];
  types: string[];
  regions: string[];
}

interface ExpandedInstance {
  instanceId: string;
  [key: string]: string | number | object | null;
}

// ============================================
// PREMIUM UI COMPONENTS
// ============================================

// Glowing status dot indicator - bespoke data accent
function StatusDot({ state }: { state: string }) {
  const isRunning = state === 'running';
  return (
    <span className="relative flex items-center">
      <span className={`relative w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-amber-500'}`}>
        <span className={`absolute inset-0 rounded-full animate-pulse ${isRunning ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </span>
      {isRunning && (
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
      )}
    </span>
  );
}

// Custom badge with glow effect
function GlowBadge({
  children,
  variant = 'default',
  glowColor = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'muted';
  glowColor?: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const glowClasses: Record<string, string> = {
    primary: 'shadow-[0_0_12px_rgba(99,102,241,0.3)]',
    success: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
    warning: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    muted: '',
  };

  const baseClasses = {
    default: 'bg-white/5 border-white/10 text-white/70',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    muted: 'bg-white/5 border-white/10 text-zinc-500',
  };

  const showGlow = glowColor !== 'muted';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${baseClasses[variant]} ${showGlow ? glowClasses[glowColor] : ''}`}>
      {children}
    </span>
  );
}

// Premium Metric Card - abolition of rigid boxes, editorial typography
function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'primary',
  trend,
  onClick,
  isActive = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'muted';
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  isActive?: boolean;
}) {
  const colorClasses = {
    primary: 'text-white',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    muted: 'text-zinc-400',
  };

  return (
    <motion.button
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full text-left p-5 rounded-xl transition-all duration-300 group ${
        isActive
          ? 'bg-white/[0.08] border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]'
      }`}
    >
      {/* Subtle glow on hover */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-${color === 'success' ? 'emerald-500/5' : color === 'warning' ? 'amber-500/5' : 'indigo-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative flex items-start justify-between">
        <div className={`p-2.5 rounded-lg bg-white/[0.03] border border-white/5 ${isActive ? 'bg-white/[0.08] border-white/15' : ''}`}>
          <Icon className={`h-4 w-4 ${colorClasses[color]} opacity-80`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] tracking-wide ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-amber-400' : 'text-zinc-500'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          </div>
        )}
      </div>

      <div className="relative mt-4">
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.15em]">{label}</p>
        <p className={`text-4xl font-light mt-2 tracking-tight ${colorClasses[color]}`}>{value}</p>
        {subValue && <p className="text-xs text-zinc-500 mt-2 font-light">{subValue}</p>}
      </div>
    </motion.button>
  );
}

// Premium Recommendation Card
function RecommendationCard({
  recommendation,
  onClick,
  isHighlighted = false,
}: {
  recommendation: Resource;
  onClick?: () => void;
  isHighlighted?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all duration-300 group ${
        isHighlighted
          ? 'bg-amber-500/5 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
          : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isHighlighted ? 'text-amber-400' : 'text-zinc-500'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">{recommendation.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <GlowBadge variant={recommendation.resourceType === 'ec2-instance' ? 'default' : 'muted'}>
              {recommendation.resourceType === 'ec2-instance' ? 'EC2' : 'EBS'}
            </GlowBadge>
            <span className="text-[11px] text-zinc-600 font-mono">
              {recommendation.resourceId.slice(0, 14)}...
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-light text-emerald-400">${recommendation.estimatedSavings.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">per month</p>
        </div>
      </div>
    </motion.button>
  );
}

// Premium Instance Row with expand animation
function InstanceRow({
  instance,
  isExpanded,
  onToggleExpand,
  onClick,
  isHighlighted = false,
}: {
  instance: EC2Instance;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick?: () => void;
  isHighlighted?: boolean;
}) {
  return (
    <div className={`border-b border-white/[0.03] transition-colors duration-200 ${isHighlighted ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'}`}>
      <div className="flex items-center p-3.5 gap-3 group">
        <button onClick={onToggleExpand} className="p-1.5 rounded hover:bg-white/[0.05] transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          )}
        </button>
        <button onClick={onClick} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-xs text-zinc-400 truncate min-w-[140px] tracking-wide">{instance.instanceId}</span>
            <GlowBadge variant="muted" glowColor="muted">{instance.instanceType}</GlowBadge>
            <div className="flex items-center gap-1.5">
              <StatusDot state={instance.state} />
              <span className="text-xs text-zinc-500 capitalize">{instance.state}</span>
            </div>
            <span className="text-sm text-zinc-300 truncate flex-1 font-light">{instance.name || 'unnamed'}</span>
            <span className="text-[11px] text-zinc-600 flex-shrink-0">{instance.region}</span>
          </div>
        </button>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-white/[0.02]"
          >
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-[0.15em]">Launch Time</p>
                <p className="text-zinc-300 mt-2 font-light text-sm">{new Date(instance.launchTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-[0.15em]">Tags</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(instance.tags).length > 0 ? (
                    Object.entries(instance.tags).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded text-[10px] bg-white/[0.05] text-zinc-500 border border-white/5">{k}: {v}</span>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-xs">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-[0.15em]">Resource ID</p>
                <p className="text-zinc-400 font-mono text-xs mt-2 tracking-wide">{instance.instanceId}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-[0.15em]">Region</p>
                <p className="text-zinc-300 mt-2 font-light text-sm">{instance.region}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Premium Filter Bar
function FilterBar({
  filters,
  onFilterChange,
  instanceCount,
}: {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  instanceCount: number;
}) {
  const hasActiveFilters = filters.states.length > 0 || filters.types.length > 0 || filters.regions.length > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
      <Filter className="h-3.5 w-3.5 text-zinc-600" />
      <span className="text-sm text-zinc-500 font-light">
        Showing <span className="text-zinc-300">{instanceCount}</span> {instanceCount === 1 ? 'instance' : 'instances'}
      </span>
      {hasActiveFilters && (
        <button
          onClick={() => onFilterChange({ states: [], types: [], regions: [] })}
          className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}
    </div>
  );
}

// Premium Empty State - bespoke art piece
function EmptyState({
  type,
  onAction,
}: {
  type: 'instances' | 'recommendations';
  onAction?: () => void;
}) {
  if (type === 'instances') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative w-20 h-20 mb-5">
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-2 rounded-full border border-dashed border-white/20 animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Server className="h-6 w-6 text-zinc-700" />
          </div>
        </div>
        <p className="text-lg font-light text-zinc-400">No active instances</p>
        <p className="text-sm text-zinc-600 mt-2 max-w-xs font-light leading-relaxed">
          Your AWS account currently has no running EC2 instances. Launch an instance to begin tracking.
        </p>
      </div>
    );
  }

  // "All Optimized" - animated glowing ring as bespoke art
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative w-20 h-20 mb-5">
        {/* Multi-layered glowing ring */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/5" />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-emerald-500/30"
          animate={{
            boxShadow: ['0 0 0 0 rgba(34,197,94,0)', '0 0 20px 4px rgba(34,197,94,0.3)', '0 0 0 0 rgba(34,197,94,0)'],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-6 h-6 rounded-full bg-emerald-500/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
      <p className="text-lg font-light text-emerald-400/80">All optimized</p>
      <p className="text-sm text-zinc-600 mt-2 max-w-xs font-light leading-relaxed">
        No waste detected. Your cloud resources are running at optimal efficiency.
      </p>
    </div>
  );
}

// Service Leaderboard - Top 10 Cost Drivers
function ServiceLeaderboard({
  services,
  onSelectService,
}: {
  services: ServiceCost[];
  onSelectService: (service: ServiceCost) => void;
}) {
  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 font-light text-sm">No service cost data available</p>
      </div>
    );
  }

  const maxCost = Math.max(...services.map(s => s.cost));

  return (
    <div className="space-y-2">
      {services.map((service, index) => (
        <motion.button
          key={service.serviceName}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectService(service)}
          className="w-full group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-all"
        >
          <span className="text-[10px] text-zinc-600 font-mono w-4">{index + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-300 font-light truncate">{service.serviceName}</span>
              <span className="text-xs text-zinc-400 font-light">${service.cost.toFixed(2)}</span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500/60 to-purple-500/60"
                initial={{ width: 0 }}
                animate={{ width: `${(service.cost / maxCost) * 100}%` }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.5 }}
              />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Zombie Resource Panel
function ZombiePanel({
  zombies,
  onSelectZombie,
}: {
  zombies: ZombieResource[];
  onSelectZombie: (zombie: ZombieResource) => void;
}) {
  if (zombies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500/60" />
        </div>
        <p className="text-sm text-zinc-500 font-light">No zombie resources detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {zombies.map((zombie, index) => (
        <motion.button
          key={zombie.resourceId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectZombie(zombie)}
          className="w-full text-left p-3 rounded-lg bg-amber-500/[0.03] border border-amber-500/10 hover:bg-amber-500/[0.06] transition-all"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500/70 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-300 line-clamp-2">{zombie.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{zombie.resourceType}</span>
                <span className="text-[10px] text-zinc-700 font-mono">{zombie.resourceId.slice(0, 12)}...</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-light text-amber-400">${zombie.estimatedSavings.toFixed(2)}</p>
              <p className="text-[9px] text-zinc-600">/month</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Deep Dive Drawer - Modal for detailed view
function DeepDiveDrawer({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light text-zinc-200">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Deep Dive Content for Services
function ServiceDeepDive({
  service,
  utilization,
  instanceId,
}: {
  service?: ServiceCost;
  utilization?: UtilizationData;
  instanceId?: string;
}) {
  if (!service) return null;

  // Generate CLI command based on service type
  const getServiceCLI = () => {
    const serviceName = service.serviceName.toLowerCase();
    if (serviceName.includes('ec2') || serviceName.includes('compute')) {
      return `aws ec2 describe-instances --region us-east-1 --filters "Name=instance-state-code,Values=16" | jq '.Reservations[].Instances[] | select(.Tags.Name=="${service.serviceName}")'`;
    }
    if (serviceName.includes('rds')) {
      return `aws rds describe-db-instances --region us-east-1 | jq '.DBInstances[] | select(.DBInstanceIdentifier | contains("${service.serviceName}"))'`;
    }
    return `# View ${service.serviceName} cost details\naws ce get-cost-and-usage --time-period Start=${service.period.start},End=${service.period.end} --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE`;
  };

  const getRecommendation = () => {
    const savings = service.cost * 0.15;
    return `Optimize ${service.serviceName} by identifying idle resources. Potential monthly savings: $${savings.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Service Overview */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Current Cost</span>
          <span className="text-2xl font-light text-white">${service.cost.toFixed(2)}</span>
        </div>
        <div className="text-xs text-zinc-500 font-light">
          {service.period.start} - {service.period.end}
        </div>
      </div>

      {/* AI Recommendation */}
      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AI Recommendation</h3>
        <div className="p-4 bg-indigo-500/[0.05] border border-indigo-500/20 rounded-lg">
          <p className="text-sm text-zinc-300 font-light leading-relaxed">{getRecommendation()}</p>
        </div>
      </div>

      {/* CLI Command */}
      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AWS CLI Command</h3>
        <div className="relative">
          <pre className="p-4 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-zinc-400 overflow-x-auto">
            {getServiceCLI()}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(getServiceCLI())}
            className="absolute top-2 right-2 p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Deep Dive Content for Utilization (Right-Sizing)
function UtilizationDeepDive({
  utilization,
  instance,
}: {
  utilization?: UtilizationData;
  instance?: EC2Instance;
}) {
  if (!utilization) return null;

  const action = utilization.avgValue < 20 ? 'downgrade' : utilization.avgValue > 80 ? 'upgrade' : 'maintain';
  const actionColor = action === 'downgrade' ? 'text-amber-400' : action === 'upgrade' ? 'text-emerald-400' : 'text-zinc-400';
  const actionLabel = action === 'downgrade' ? 'Downgrade' : action === 'upgrade' ? 'Upgrade' : 'Maintain';

  const getCLI = () => {
    if (!instance) return '';
    const currentType = instance.instanceType;
    const downgradeMap: Record<string, string> = {
      't3.large': 't3.medium',
      't3.medium': 't3.small',
      't3.small': 't3.micro',
      'm5.xlarge': 'm5.large',
      'c5.xlarge': 'c5.large',
    };
    const newType = downgradeMap[currentType] || currentType;

    return `# Modify instance type for right-sizing\naws ec2 modify-instance-attribute --instance-id ${instance.instanceId} --instance-type "{\"Value\": \"${newType}\"}"`;
  };

  return (
    <div className="space-y-6">
      {/* Utilization Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">7-Day Average</div>
          <div className="text-2xl font-light text-white">{utilization.avgValue}%</div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">7-Day Max</div>
          <div className="text-2xl font-light text-zinc-400">{utilization.maxValue}%</div>
        </div>
      </div>

      {/* Action */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Recommended Action</div>
        <div className={`text-lg font-light ${actionColor}`}>{actionLabel}</div>
        {action === 'downgrade' && (
          <p className="text-xs text-zinc-500 mt-2 font-light">
            CPU utilization has been below 20% for 7 days. Consider downsizing to reduce costs.
          </p>
        )}
        {action === 'upgrade' && (
          <p className="text-xs text-zinc-500 mt-2 font-light">
            CPU utilization has exceeded 80%. Consider upsizing for better performance.
          </p>
        )}
      </div>

      {/* CLI */}
      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AWS CLI Command</h3>
        <div className="relative">
          <pre className="p-4 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-zinc-400 overflow-x-auto">
            {getCLI()}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(getCLI())}
            className="absolute top-2 right-2 p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Copy icon
import { Copy } from 'lucide-react';

// ============================================
// MAIN DASHBOARD
// ============================================

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR('optimization-data', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Interaction State
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);
  const [highlightedResource, setHighlightedResource] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ states: [], types: [], regions: [] });
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Deep Dive Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceCost | null>(null);
  const [selectedUtilization, setSelectedUtilization] = useState<UtilizationData | null>(null);
  const [selectedZombie, setSelectedZombie] = useState<ZombieResource | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(null);

  // Derived filtered data
  const filteredInstances = useMemo(() => {
    if (!data?.data?.ec2Instances) return [];
    let instances = data.data.ec2Instances;

    if (filters.states.length > 0) {
      instances = instances.filter(i => filters.states.includes(i.state));
    }
    if (filters.types.length > 0) {
      instances = instances.filter(i => filters.types.includes(i.instanceType));
    }
    if (filters.regions.length > 0) {
      instances = instances.filter(i => filters.regions.includes(i.region));
    }
    return instances;
  }, [data?.data?.ec2Instances, filters]);

  // Extract unique values for filters
  const availableFilters = useMemo(() => {
    const instances = data?.data?.ec2Instances || [];
    return {
      states: [...new Set(instances.map(i => i.state))],
      types: [...new Set(instances.map(i => i.instanceType))],
      regions: [...new Set(instances.map(i => i.region))],
    };
  }, [data?.data?.ec2Instances]);

  // Handle recommendation click - highlight related instance
  const handleRecommendationClick = (rec: Resource) => {
    if (rec.resourceType === 'ec2-instance') {
      setHighlightedResource(rec.resourceId);
      setExpandedInstance(rec.resourceId);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedResource(null), 3000);
    }
  };

  // Handle instance click - open deep dive with or without utilization data
  const handleInstanceClick = (instance: EC2Instance) => {
    setHighlightedResource(instance.instanceId);
    // Open deep dive for instance details (with or without utilization data)
    const util = data?.data?.utilizationData?.find(u => u.resourceId === instance.instanceId);
    setSelectedInstance(instance);
    setSelectedUtilization(util || null);
    setSelectedService(null);
    setSelectedZombie(null);
    setDrawerTitle(`Instance: ${instance.instanceId}`);
    setDrawerOpen(true);
  };

  // Handle service click - open deep dive
  const handleServiceSelect = (service: ServiceCost) => {
    setSelectedService(service);
    setDrawerTitle(`Cost Analysis: ${service.serviceName}`);
    setDrawerOpen(true);
  };

  // Handle zombie resource click - open deep dive
  const handleZombieSelect = (zombie: ZombieResource) => {
    setSelectedZombie(zombie);
    setDrawerTitle(`Zombie Resource: ${zombie.resourceType}`);
    setDrawerOpen(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedService(null);
    setSelectedUtilization(null);
    setSelectedZombie(null);
    setSelectedInstance(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Deep canvas background with radial gradient */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto space-y-6 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-28 bg-white/[0.05]" />
              <Skeleton className="h-3 w-40 mt-2 bg-white/[0.05]" />
            </div>
            <Skeleton className="h-8 w-24 bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 bg-white/[0.05]" />)}
          </div>
          <Skeleton className="h-56 bg-white/[0.05]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 bg-white/[0.05]" />
            <Skeleton className="h-72 bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-400/70" />
            </div>
            <p className="text-lg font-light text-zinc-300">Failed to load data</p>
            <Button
              variant="ghost"
              className="mt-4 text-zinc-500 hover:text-zinc-300"
              onClick={() => mutate()}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const report = data.data!;
  const spend = parseFloat(report.currentSpend?.amount || '0');
  const savings = report.summary.estimatedMonthlySavings || 0;
  const recCount = report.summary.totalRecommendations || 0;
  const ec2Count = report.summary.scannedResources.ec2Instances || 0;
  const ebsCount = report.summary.scannedResources.ebsVolumes || 0;
  const instances = report.ec2Instances || [];
  const recommendations = report.recommendations || [];

  // Calculate optimization score - meaningful logic
  const optimizationScore = ec2Count > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (recCount * 15))))
    : 100;

  const scoreLabel = optimizationScore >= 90 ? 'Excellent' : optimizationScore >= 70 ? 'Good' : optimizationScore >= 50 ? 'Needs Attention' : 'Critical';

  return (
    <div className="min-h-screen bg-black">
      {/* Deep, immersive canvas - subtle radial gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_rgba(0,0,0,0)_60%)]" />

      {/* Header with glassmorphism */}
      <header className="relative border-b border-white/[0.05] bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <Cloud className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <h1 className="text-lg font-light tracking-tight text-white">NexusCloud</h1>
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em]">AI-Powered Optimization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-600">
                {new Date(report.timestamp).toLocaleTimeString()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
                onClick={() => mutate()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* PRIMARY METRICS - Interactive */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Activity className="h-3.5 w-3.5" />
            <span className="uppercase tracking-[0.15em] font-medium">System Overview</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={DollarSign}
              label="Monthly Spend"
              value={`$${spend.toFixed(2)}`}
              subValue={report.currentSpend?.period?.start ? `${report.currentSpend.period.start} - ${report.currentSpend.period.end}` : undefined}
              color="primary"
              onClick={() => setSelectedMetric(selectedMetric === 'spend' ? null : 'spend')}
              isActive={selectedMetric === 'spend'}
            />
            <MetricCard
              icon={Zap}
              label="Optimization"
              value={`${optimizationScore}%`}
              subValue={scoreLabel}
              color={optimizationScore >= 70 ? 'success' : optimizationScore >= 50 ? 'warning' : 'primary'}
              onClick={() => setSelectedMetric(selectedMetric === 'score' ? null : 'score')}
              isActive={selectedMetric === 'score'}
            />
            <MetricCard
              icon={TrendingDown}
              label="Potential Savings"
              value={`$${savings.toFixed(2)}`}
              subValue="per month"
              color={savings > 0 ? 'success' : 'muted'}
              onClick={() => setSelectedMetric(selectedMetric === 'savings' ? null : 'savings')}
              isActive={selectedMetric === 'savings'}
            />
            <MetricCard
              icon={Activity}
              label="Total Resources"
              value={ec2Count + ebsCount}
              subValue={`${ec2Count} EC2 · ${ebsCount} EBS`}
              color="muted"
              onClick={() => setSelectedMetric(selectedMetric === 'resources' ? null : 'resources')}
              isActive={selectedMetric === 'resources'}
            />
          </div>

          {/* Contextual info based on selection - premium style */}
          <AnimatePresence>
            {selectedMetric === 'savings' && savings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-emerald-500/70 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-light text-zinc-300">Optimization Opportunity</p>
                    <p className="text-zinc-500 mt-1 font-light text-sm leading-relaxed">
                      You could save <span className="text-emerald-400 font-medium">${savings.toFixed(2)}/month</span> by addressing the {recCount} recommendation{recCount !== 1 ? 's' : ''} below.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ENTERPRISE: Top Services & Zombie Hunter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Leaderboard */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <DollarSign className="h-4 w-4 text-indigo-400/70" />
                <span className="text-sm font-light text-zinc-300">Top 10 Cost Drivers</span>
              </div>
            </div>
            <div className="p-4 max-h-[320px] overflow-y-auto">
              <ServiceLeaderboard
                services={(report as any).topServices || []}
                onSelectService={handleServiceSelect}
              />
            </div>
          </div>

          {/* Zombie Resources Panel */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400/70" />
                <span className="text-sm font-light text-zinc-300">Zombie Hunter</span>
                {((report as any).zombieResources?.length || 0) > 0 && (
                  <GlowBadge variant="warning" glowColor="warning">
                    {(report as any).zombieResources.length}
                  </GlowBadge>
                )}
              </div>
            </div>
            <div className="p-4 max-h-[320px] overflow-y-auto">
              <ZombiePanel
                zombies={(report as any).zombieResources || []}
                onSelectZombie={handleZombieSelect}
              />
            </div>
          </div>
        </div>

        {/* SECONDARY GRID - Contextual panels - premium card style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECOMMENDATIONS PANEL */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400/70" />
                  <span className="text-sm font-light text-zinc-300">Claude's Analysis</span>
                  {recommendations.length > 0 && (
                    <GlowBadge variant="warning" glowColor="warning">{recommendations.length}</GlowBadge>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 font-light">
                {recommendations.length > 0
                  ? 'Click a recommendation to locate the affected resource'
                  : 'AI detected no optimization opportunities'}
              </p>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-4">
              {recommendations.length === 0 ? (
                <EmptyState type="recommendations" />
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={rec.resourceId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <RecommendationCard
                          recommendation={rec}
                          onClick={() => handleRecommendationClick(rec)}
                          isHighlighted={highlightedResource === rec.resourceId}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* INSTANCES PANEL */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="h-4 w-4 text-indigo-400/70" />
                  <span className="text-sm font-light text-zinc-300">EC2 Instances</span>
                  <GlowBadge variant="muted" glowColor="muted">{instances.length}</GlowBadge>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 font-light">
                {highlightedResource
                  ? 'Related recommendation highlighted'
                  : 'Click row to expand details · Click recommendation to locate instance'}
              </p>
            </div>
            <div className="p-4">
              {instances.length === 0 ? (
                <EmptyState type="instances" />
              ) : (
                <>
                  <div className="mb-4">
                    <FilterBar
                      filters={filters}
                      onFilterChange={setFilters}
                      instanceCount={filteredInstances.length}
                    />
                  </div>
                  {filters.states.length === 0 && filters.types.length === 0 && filters.regions.length === 0 ? (
                    <div className="max-h-[340px] overflow-y-auto -mx-4 px-4">
                      {instances.map((instance, index) => (
                        <motion.div
                          key={instance.instanceId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                        >
                          <InstanceRow
                            instance={instance}
                            isExpanded={expandedInstance === instance.instanceId}
                            onToggleExpand={() => setExpandedInstance(expandedInstance === instance.instanceId ? null : instance.instanceId)}
                            onClick={() => handleInstanceClick(instance)}
                            isHighlighted={highlightedResource === instance.instanceId}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[340px] overflow-y-auto -mx-4 px-4">
                      {filteredInstances.length === 0 ? (
                        <div className="py-8 text-center text-zinc-600">
                          <p className="font-light">No instances match your filters</p>
                          <button onClick={() => setFilters({ states: [], types: [], regions: [] })} className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 font-light transition-colors">
                            Clear filters
                          </button>
                        </div>
                      ) : (
                        filteredInstances.map((instance) => (
                          <InstanceRow
                            key={instance.instanceId}
                            instance={instance}
                            isExpanded={expandedInstance === instance.instanceId}
                            onToggleExpand={() => setExpandedInstance(expandedInstance === instance.instanceId ? null : instance.instanceId)}
                            onClick={() => handleInstanceClick(instance)}
                            isHighlighted={highlightedResource === instance.instanceId}
                          />
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER CONTEXT - ultra minimal */}
        <footer className="text-center py-6 border-t border-white/[0.03]">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.15em] font-light">
            Data refreshes every 30 seconds · Powered by Claude AI
          </p>
        </footer>

        {/* Deep Dive Drawer */}
        <DeepDiveDrawer
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          title={drawerTitle}
        >
          {selectedService && (
            <ServiceDeepDive
              service={selectedService}
              utilization={selectedUtilization || undefined}
              instanceId={selectedInstance?.instanceId}
            />
          )}
          {selectedUtilization && !selectedService && (
            <UtilizationDeepDive
              utilization={selectedUtilization}
              instance={selectedInstance || undefined}
            />
          )}
          {selectedZombie && !selectedService && !selectedUtilization && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/[0.05] border border-amber-500/20 rounded-lg">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Resource Type</div>
                <div className="text-sm text-zinc-300 font-light capitalize">{selectedZombie.resourceType}</div>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Resource ID</div>
                <div className="text-xs font-mono text-zinc-400">{selectedZombie.resourceId}</div>
              </div>
              <div>
                <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Recommended Action</h3>
                <div className="p-4 bg-amber-500/[0.05] border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-zinc-300 font-light">{selectedZombie.description}</p>
                  <p className="text-xs text-amber-400 mt-3">Potential savings: ${selectedZombie.estimatedSavings.toFixed(2)}/month</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AWS CLI Command</h3>
                <div className="relative">
                  <pre className="p-4 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-zinc-400 overflow-x-auto">
                    {selectedZombie.resourceType === 'eip'
                      ? `# Release Elastic IP\naws ec2 release-address --allocation-id ${selectedZombie.resourceId}`
                      : `# Delete Snapshot\naws ec2 delete-snapshot --snapshot-id ${selectedZombie.resourceId}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DeepDiveDrawer>
      </main>
    </div>
  );
}