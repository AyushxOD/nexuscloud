'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  Database,
  Boxes,
  Network,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchOptimizationData } from '@/lib/api';
import type { CloudOptimizerResponse, EC2Instance, Resource, ServiceCost, ZombieResource, UtilizationData, ServiceDetail } from '@/lib/types';

const fetcher = () => fetchOptimizationData().then((res) => res as Promise<CloudOptimizerResponse>);

interface FilterState {
  states: string[];
  types: string[];
  regions: string[];
}

// ============================================
// ANIMATED BACKGROUND COMPONENTS
// ============================================

function AnimatedGradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Large orb 1 */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, transparent 70%)', top: '-10%', left: '-10%' }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Large orb 2 */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)', top: '40%', right: '-5%' }}
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      {/* Small accent orb */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.6) 0%, transparent 70%)', bottom: '10%', left: '20%' }}
        animate={{
          x: [0, 50, 0],
          y: [0, -40, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================
// PREMIUM UI COMPONENTS
// ============================================

function StatusDot({ state }: { state: string }) {
  const isRunning = state === 'running';
  return (
    <span className="relative flex items-center">
      <motion.span
        className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-amber-400'}`}
        animate={{ scale: isRunning ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {isRunning && (
        <motion.span
          className="absolute inset-0 rounded-full bg-emerald-400/40"
          animate={{ scale: [1, 2], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </span>
  );
}

function GlowBadge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'muted' }) {
  const variants = {
    default: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]',
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    muted: 'bg-white/5 border-white/10 text-zinc-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Premium Bento Grid Card
function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  onClick,
  isActive,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  isActive?: boolean;
  delay?: number;
}) {
  const colors = {
    primary: 'from-indigo-500/20 to-purple-500/10',
    success: 'from-emerald-500/20 to-teal-500/10',
    warning: 'from-amber-500/20 to-orange-500/10',
    muted: 'from-zinc-500/10 to-zinc-600/5',
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full text-left p-5 rounded-2xl transition-all duration-300 group overflow-hidden ${
        isActive
          ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-400/40 shadow-[0_0_40px_rgba(99,102,241,0.25)]'
          : 'bg-gradient-to-br border border-white/5 hover:border-white/15 shadow-lg'
      }`}
      style={{ background: isActive ? undefined : `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${isActive ? 'from-indigo-500/10 to-purple-500/5' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-500'} ${colors.primary.split(' ')[0]}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-500/30' : 'bg-white/[0.06]'}`}
            whileHover={{ scale: 1.05 }}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-300' : 'text-zinc-400'}`} />
          </motion.div>
          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : trend === 'down' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-500/20 text-zinc-400'}`}
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            </motion.div>
          )}
        </div>
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.15em] mb-2">{label}</p>
        <motion.p
          className="text-4xl font-light text-white tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {value}
        </motion.p>
        {subValue && <p className="text-xs text-zinc-500 mt-2 font-light">{subValue}</p>}
      </div>
    </motion.button>
  );
}

// Service Leaderboard - Horizontal bars with animations
function ServiceLeaderboard({
  services,
  serviceDetails,
  onSelectService,
}: {
  services: ServiceCost[];
  serviceDetails: ServiceDetail[];
  onSelectService: (service: ServiceCost) => void;
}) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 flex items-center justify-center mb-4">
          <Database className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm font-light">No service cost data</p>
      </div>
    );
  }

  const maxCost = Math.max(...services.map(s => s.cost), 0.01);

  return (
    <div className="space-y-1">
      {services.slice(0, 8).map((service, index) => {
        const matchingDetail = serviceDetails.find(sd => {
          const sdLower = sd.serviceName.toLowerCase();
          const svcLower = service.serviceName.toLowerCase();
          return sdLower.includes('s3') && svcLower.includes('s3') ||
                 sdLower.includes('dynamodb') && svcLower.includes('dynamodb') ||
                 sdLower.includes('rds') && (svcLower.includes('rds') || svcLower.includes('database')) ||
                 sdLower.includes('ec2') && (svcLower.includes('ec2') || svcLower.includes('compute'));
        });

        return (
          <motion.button
            key={service.serviceName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
            onClick={() => onSelectService(service)}
            className="w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
          >
            <span className="text-[10px] text-zinc-600 font-mono w-5">{index + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-300 font-light truncate">{service.serviceName}</span>
                <span className="text-sm text-zinc-400 font-light">${service.cost < 0.01 ? '<0.01' : service.cost.toFixed(2)}</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((service.cost / maxCost) * 100, 100)}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              {matchingDetail && matchingDetail.resources.length > 0 && (
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  {matchingDetail.resources.length} active resource{matchingDetail.resources.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// Zombie Hunter Panel
function ZombiePanel({
  zombies,
  onSelectZombie,
}: {
  zombies: ZombieResource[];
  onSelectZombie: (zombie: ZombieResource) => void;
}) {
  if (zombies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-4 border border-emerald-500/20"
        >
          <CheckCircle2 className="h-6 w-6 text-emerald-500/60" />
        </motion.div>
        <p className="text-zinc-400 text-sm font-light">All clean! No zombies detected</p>
        <p className="text-zinc-600 text-xs mt-1">Your resources are optimized</p>
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
          whileHover={{ x: 4 }}
          onClick={() => onSelectZombie(zombie)}
          className="w-full text-left p-3.5 rounded-xl bg-gradient-to-r from-amber-500/[0.08] to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 font-light line-clamp-2">{zombie.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{zombie.resourceType}</span>
                <span className="text-[10px] text-zinc-700 font-mono">{zombie.resourceId.slice(0, 10)}...</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-light text-amber-400">${zombie.estimatedSavings.toFixed(2)}</p>
              <p className="text-[9px] text-zinc-600">/mo</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Instance Row
function InstanceRow({
  instance,
  isExpanded,
  onToggleExpand,
  onClick,
  isHighlighted,
}: {
  instance: EC2Instance;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick?: () => void;
  isHighlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-white/[0.03] transition-colors duration-200 ${isHighlighted ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'}`}
    >
      <div className="flex items-center p-3.5 gap-3 group cursor-pointer" onClick={onClick}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </motion.div>
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusDot state={instance.state} />
          <span className="font-mono text-xs text-zinc-400 truncate min-w-[130px]">{instance.instanceId}</span>
          <GlowBadge variant="muted">{instance.instanceType}</GlowBadge>
          <span className="text-xs text-zinc-500 capitalize">{instance.state}</span>
          <span className="text-sm text-zinc-300 truncate flex-1 font-light">{instance.name || 'unnamed'}</span>
          <span className="text-[11px] text-zinc-600 flex-shrink-0">{instance.region}</span>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent"
          >
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] mb-2">Launch Time</p>
                <p className="text-zinc-300 font-light">{new Date(instance.launchTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
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
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] mb-2">Resource ID</p>
                <p className="text-zinc-400 font-mono text-xs">{instance.instanceId}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] mb-2">Region</p>
                <p className="text-zinc-300 font-light">{instance.region}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Deep Dive Drawer
function DeepDiveDrawer({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0a0a0b] border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-light text-white">{title}</h2>
                  <p className="text-xs text-zinc-600 mt-1">Detailed analysis & recommendations</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors"
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

// Instance Deep Dive Content
function InstanceDeepDive({ instance, utilization }: { instance: EC2Instance; utilization?: UtilizationData | null }) {
  const getRecommendation = () => {
    if (!utilization) return 'No CloudWatch data available. Metrics may take 5 minutes to start collecting for new instances.';
    if (utilization.avgValue < 20) return `CPU utilization averaged ${utilization.avgValue}% over 7 days. Consider downsizing to reduce costs.`;
    if (utilization.avgValue > 80) return `CPU peaked at ${utilization.maxValue}%. Consider upsizing for better performance.`;
    return 'CPU utilization is optimal. No action required.';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Instance ID</div>
          <div className="text-xs font-mono text-zinc-300">{instance.instanceId}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Type</div>
          <div className="text-sm text-zinc-300 font-light">{instance.instanceType}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">State</div>
          <div className="flex items-center gap-2">
            <StatusDot state={instance.state} />
            <span className="text-sm text-zinc-300 capitalize">{instance.state}</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Region</div>
          <div className="text-sm text-zinc-300 font-light">{instance.region}</div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Name</div>
        <div className="text-sm text-zinc-300 font-light">{instance.name || 'unnamed'}</div>
      </div>

      {instance.tags && Object.keys(instance.tags).length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Tags</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(instance.tags).map(([k, v]) => (
              <span key={k} className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.05] text-zinc-400 border border-white/5">{k}: {v}</span>
            ))}
          </div>
        </div>
      )}

      {utilization && (
        <div>
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">CloudWatch (7-Day)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
              <div className="text-[10px] text-indigo-400 uppercase tracking-wider mb-2">Average</div>
              <div className="text-3xl font-light text-white">{utilization.avgValue}%</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Maximum</div>
              <div className="text-3xl font-light text-zinc-400">{utilization.maxValue}%</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AI Analysis</h3>
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
          <p className="text-sm text-zinc-300 font-light leading-relaxed">{getRecommendation()}</p>
        </div>
      </div>

      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AWS CLI</h3>
        <div className="relative rounded-xl bg-black/40 border border-white/10 overflow-hidden">
          <pre className="p-4 text-xs font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap">
{`# Instance Details
aws ec2 describe-instances --instance-ids ${instance.instanceId}

# CloudWatch Metrics
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUUtilization \\
  --Dimensions Name=InstanceId,Value=${instance.instanceId} \\
  --StartTime $(date -u -d '7 days ago' +%Y-%m-%d) \\
  --EndTime $(date -u +%Y-%m-%d) \\
  --Period 86400 --statistics Average,Maximum`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Service Deep Dive Content
function ServiceDeepDive({ service, serviceResources }: { service?: ServiceCost; serviceResources?: ServiceDetail[] }) {
  if (!service) return null;

  const matchingResources = serviceResources?.find(sr => {
    const srLower = sr.serviceName.toLowerCase();
    const serviceLower = service.serviceName.toLowerCase();
    return srLower.includes('s3') && serviceLower.includes('s3') ||
           srLower.includes('dynamodb') && serviceLower.includes('dynamodb') ||
           srLower.includes('rds') && (serviceLower.includes('rds') || serviceLower.includes('database')) ||
           srLower.includes('ec2') && (serviceLower.includes('ec2') || serviceLower.includes('compute'));
  });

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-indigo-400 uppercase tracking-wider">Current Cost</span>
          <span className="text-3xl font-light text-white">${service.cost < 0.01 ? '<0.01' : service.cost.toFixed(2)}</span>
        </div>
        <div className="text-xs text-zinc-500 font-light">{service.period.start} - {service.period.end}</div>
      </div>

      {matchingResources && matchingResources.resources.length > 0 && (
        <div>
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Active {matchingResources.serviceName} Resources</h3>
          <div className="space-y-2">
            {matchingResources.resources.map((resource, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Boxes className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-300 font-light">{resource.name}</div>
                    {resource.createdAt && (
                      <div className="text-[10px] text-zinc-600 mt-1">Created: {new Date(resource.createdAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">AI Insight</h3>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
          <p className="text-sm text-zinc-300 font-light leading-relaxed">
            {service.cost === 0
              ? 'This service shows $0 cost. This typically indicates: (1) Within AWS Free Tier, (2) Cost Explorer has 24-hour sync delay, or (3) No usage in current billing period.'
              : `Analyze ${service.serviceName} for optimization opportunities. Current spend: $${service.cost.toFixed(2)}/month.`}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Query Commands</h3>
        <div className="relative rounded-xl bg-black/40 border border-white/10 overflow-hidden">
          <pre className="p-4 text-xs font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap">
{service.serviceName.toLowerCase().includes('s3') ? `aws s3 ls
aws s3api list-buckets --query 'Buckets[].Name'`
: service.serviceName.toLowerCase().includes('dynamodb') ? `aws dynamodb list-tables
aws dynamodb describe-table --table-name <name>`
: service.serviceName.toLowerCase().includes('rds') ? `aws rds describe-db-instances
aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier'`
: `aws ce get-cost-and-usage --time-period Start=${service.period.start},End=${service.period.end} --granularity MONTHLY --metrics UnblendedCost`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Zombie Deep Dive Content
function ZombieDeepDive({ zombie }: { zombie: ZombieResource }) {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
        <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-2">Resource Type</div>
        <div className="text-lg text-zinc-200 capitalize font-light">{zombie.resourceType}</div>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Resource ID</div>
        <div className="text-xs font-mono text-zinc-400 break-all">{zombie.resourceId}</div>
      </div>

      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Recommended Action</h3>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
          <p className="text-sm text-zinc-300 font-light mb-3">{zombie.description}</p>
          <p className="text-lg font-light text-amber-400">Save ${zombie.estimatedSavings.toFixed(2)}/month</p>
        </div>
      </div>

      <div>
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Remediation</h3>
        <div className="relative rounded-xl bg-black/40 border border-white/10 overflow-hidden">
          <pre className="p-4 text-xs font-mono text-zinc-400 overflow-x-auto whitespace-pre-wrap">
{zombie.resourceType === 'eip' ? `# Release Elastic IP
aws ec2 release-address --allocation-id ${zombie.resourceId}`
: `# Delete Snapshot
aws ec2 delete-snapshot --snapshot-id ${zombie.resourceId}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: 'instances' | 'recommendations' }) {
  if (type === 'instances') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-2xl border border-white/10" />
          <div className="absolute inset-2 rounded-xl border border-dashed border-white/20 animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Server className="h-6 w-6 text-zinc-700" />
          </div>
        </div>
        <p className="text-lg font-light text-zinc-400">No active instances</p>
        <p className="text-sm text-zinc-600 mt-2 max-w-xs text-center font-light">Launch an EC2 instance to start tracking</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        animate={{ boxShadow: ['0 0 0 0 rgba(34,197,94,0)', '0 0 30px 6px rgba(34,197,94,0.3)', '0 0 0 0 rgba(34,197,94,0)'] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5"
      >
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
      </motion.div>
      <p className="text-lg font-light text-emerald-400/80">All optimized</p>
      <p className="text-sm text-zinc-600 mt-2 max-w-xs text-center font-light">No waste detected. Your cloud is efficient.</p>
    </div>
  );
}

import { Copy } from 'lucide-react';

// ============================================
// MAIN DASHBOARD
// ============================================

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR('optimization-data', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);
  const [highlightedResource, setHighlightedResource] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ states: [], types: [], regions: [] });
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceCost | null>(null);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<ServiceDetail[]>([]);
  const [selectedUtilization, setSelectedUtilization] = useState<UtilizationData | null>(null);
  const [selectedZombie, setSelectedZombie] = useState<ZombieResource | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(null);

  const filteredInstances = useMemo(() => {
    if (!data?.data?.ec2Instances) return [];
    let instances = data.data.ec2Instances;
    if (filters.states.length > 0) instances = instances.filter(i => filters.states.includes(i.state));
    if (filters.types.length > 0) instances = instances.filter(i => filters.types.includes(i.instanceType));
    if (filters.regions.length > 0) instances = instances.filter(i => filters.regions.includes(i.region));
    return instances;
  }, [data?.data?.ec2Instances, filters]);

  const handleInstanceClick = (instance: EC2Instance) => {
    setHighlightedResource(instance.instanceId);
    const util = data?.data?.utilizationData?.find(u => u.resourceId === instance.instanceId);
    setSelectedInstance(instance);
    setSelectedUtilization(util || null);
    setSelectedService(null);
    setSelectedZombie(null);
    setDrawerTitle(`Instance: ${instance.instanceId}`);
    setDrawerOpen(true);
  };

  const handleServiceSelect = (service: ServiceCost) => {
    setSelectedService(service);
    setSelectedServiceDetails((data?.data as any)?.serviceDetails || []);
    setDrawerTitle(`Cost Analysis: ${service.serviceName}`);
    setDrawerOpen(true);
  };

  const handleZombieSelect = (zombie: ZombieResource) => {
    setSelectedZombie(zombie);
    setDrawerTitle(`Zombie Resource: ${zombie.resourceType}`);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedService(null);
    setSelectedServiceDetails([]);
    setSelectedUtilization(null);
    setSelectedZombie(null);
    setSelectedInstance(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <AnimatedGradientOrbs />
        <div className="relative max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-white/[0.05]" />
                <Skeleton className="h-3 w-40 bg-white/[0.05]" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl bg-white/[0.05]" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl bg-white/[0.05]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-2xl bg-white/[0.05]" />
            <Skeleton className="h-80 rounded-2xl bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <AnimatedGradientOrbs />
        <div className="relative max-w-7xl mx-auto flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-lg text-zinc-300">Failed to load data</p>
            <Button variant="ghost" className="mt-4 text-zinc-500 hover:text-zinc-300" onClick={() => mutate()}>
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

  const optimizationScore = ec2Count > 0 ? Math.max(0, Math.min(100, Math.round(100 - (recCount * 15)))) : 100;
  const scoreLabel = optimizationScore >= 90 ? 'Excellent' : optimizationScore >= 70 ? 'Good' : optimizationScore >= 50 ? 'Needs Work' : 'Critical';

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedGradientOrbs />

      <header className="relative border-b border-white/[0.05] bg-black/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Cloud className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-light tracking-tight text-white">NexusCloud</h1>
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Cloud Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-zinc-600">{new Date(report.timestamp).toLocaleTimeString()}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={DollarSign} label="Monthly Spend" value={`$${spend.toFixed(2)}`} subValue={report.currentSpend?.period?.start} delay={0} onClick={() => setSelectedMetric(selectedMetric === 'spend' ? null : 'spend')} isActive={selectedMetric === 'spend'} />
          <MetricCard icon={Zap} label="Optimization" value={`${optimizationScore}%`} subValue={scoreLabel} trend={optimizationScore >= 70 ? 'up' : 'down'} delay={0.1} onClick={() => setSelectedMetric(selectedMetric === 'score' ? null : 'score')} isActive={selectedMetric === 'score'} />
          <MetricCard icon={TrendingDown} label="Potential Savings" value={`$${savings.toFixed(2)}`} subValue="per month" trend={savings > 0 ? 'down' : 'neutral'} delay={0.2} onClick={() => setSelectedMetric(selectedMetric === 'savings' ? null : 'savings')} isActive={selectedMetric === 'savings'} />
          <MetricCard icon={Activity} label="Resources" value={ec2Count + ebsCount} subValue={`${ec2Count} EC2 · ${ebsCount} EBS`} delay={0.3} onClick={() => setSelectedMetric(selectedMetric === 'resources' ? null : 'resources')} isActive={selectedMetric === 'resources'} />
        </div>

        {/* Context Panel */}
        <AnimatePresence>
          {selectedMetric === 'savings' && savings > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-300 font-light">Optimization Opportunity</p>
                  <p className="text-xs text-zinc-500 mt-1 font-light">Save <span className="text-emerald-400 font-medium">${savings.toFixed(2)}/month</span> with {recCount} recommendations</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Leaderboard & Zombie Hunter - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0c0c0d]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-indigo-400" />
                <span className="text-sm font-light text-zinc-300">Top Cost Drivers</span>
                <GlowBadge variant="default">Live</GlowBadge>
              </div>
            </div>
            <div className="p-4 max-h-[360px] overflow-y-auto">
              <ServiceLeaderboard services={(report as any).topServices || []} serviceDetails={(report as any).serviceDetails || []} onSelectService={handleServiceSelect} />
            </div>
          </div>

          <div className="bg-[#0c0c0d]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-light text-zinc-300">Zombie Hunter</span>
                {((report as any).zombieResources?.length || 0) > 0 && (
                  <GlowBadge variant="warning">{((report as any).zombieResources as ZombieResource[]).length}</GlowBadge>
                )}
              </div>
            </div>
            <div className="p-4 max-h-[360px] overflow-y-auto">
              <ZombiePanel zombies={(report as any).zombieResources || []} onSelectZombie={handleZombieSelect} />
            </div>
          </div>
        </div>

        {/* EC2 Instances Panel */}
        <div className="bg-[#0c0c0d]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-light text-zinc-300">EC2 Instances</span>
                <GlowBadge variant="muted">{instances.length}</GlowBadge>
              </div>
            </div>
          </div>
          <div className="p-4">
            {instances.length === 0 ? (
              <EmptyState type="instances" />
            ) : (
              <div className="max-h-[400px] overflow-y-auto -mx-4 px-4 space-y-1">
                {instances.map((instance, index) => (
                  <InstanceRow key={instance.instanceId} instance={instance} isExpanded={expandedInstance === instance.instanceId} onToggleExpand={() => setExpandedInstance(expandedInstance === instance.instanceId ? null : instance.instanceId)} onClick={() => handleInstanceClick(instance)} isHighlighted={highlightedResource === instance.instanceId} />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="text-center py-4 border-t border-white/[0.03]">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.15em] font-light">Refreshes every 30s · Powered by Claude AI</p>
        </footer>
      </main>

      {/* Deep Dive Drawer */}
      <DeepDiveDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} title={drawerTitle}>
        {selectedInstance && <InstanceDeepDive instance={selectedInstance} utilization={selectedUtilization} />}
        {!selectedInstance && selectedService && <ServiceDeepDive service={selectedService} serviceResources={selectedServiceDetails} />}
        {!selectedInstance && !selectedService && selectedZombie && <ZombieDeepDive zombie={selectedZombie} />}
      </DeepDiveDrawer>
    </div>
  );
}