import { Process, SAMRecord, CapacityRecord, CostRecord } from '../types';

export interface CapacityCalculationInput {
  machineCapacityPerHour: number;
  workingHours: number;
  shiftCount: number;
  efficiencyPct: number; // e.g. 85 for 85%
}

export interface CapacityCalculationResult {
  hourlyCapacity: number;
  shiftCapacity: number;
  dailyCapacity: number;
  monthlyCapacity: number;
}

export function calculateCapacity({
  machineCapacityPerHour,
  workingHours,
  shiftCount,
  efficiencyPct,
}: CapacityCalculationInput): CapacityCalculationResult {
  const efficiency = Math.max(0.1, Math.min(100, efficiencyPct)) / 100;
  const hourly = Number((machineCapacityPerHour * efficiency).toFixed(1));
  const shift = Number((hourly * workingHours).toFixed(1));
  const daily = Number((shift * shiftCount).toFixed(1));
  const monthly = Number((daily * 26).toFixed(1)); // 26 working days standard

  return {
    hourlyCapacity: hourly,
    shiftCapacity: shift,
    dailyCapacity: daily,
    monthlyCapacity: monthly,
  };
}

export interface SAMSummary {
  totalSAMSec: number;
  averageSAMSec: number;
  highestSAM: { processName: string; samSec: number };
  lowestSAM: { processName: string; samSec: number };
  bottleneckRatio: number;
}

export function calculateSAMMetrics(processes: Process[], samRecords: SAMRecord[]): SAMSummary {
  if (!processes.length && !samRecords.length) {
    return {
      totalSAMSec: 0,
      averageSAMSec: 0,
      highestSAM: { processName: 'None', samSec: 0 },
      lowestSAM: { processName: 'None', samSec: 0 },
      bottleneckRatio: 1,
    };
  }

  // Use process sam_sec or sam_records
  const items = processes.map((p) => ({
    name: p.name,
    sam: Number(p.sam_sec) || 0,
  })).filter((i) => i.sam > 0);

  if (!items.length) {
    return {
      totalSAMSec: 0,
      averageSAMSec: 0,
      highestSAM: { processName: 'N/A', samSec: 0 },
      lowestSAM: { processName: 'N/A', samSec: 0 },
      bottleneckRatio: 1,
    };
  }

  const total = items.reduce((sum, i) => sum + i.sam, 0);
  const avg = Number((total / items.length).toFixed(1));

  let highest = items[0];
  let lowest = items[0];

  for (const item of items) {
    if (item.sam > highest.sam) highest = item;
    if (item.sam < lowest.sam) lowest = item;
  }

  const bottleneckRatio = lowest.sam > 0 ? Number((highest.sam / lowest.sam).toFixed(2)) : 1;

  return {
    totalSAMSec: total,
    averageSAMSec: avg,
    highestSAM: { processName: highest.name, samSec: highest.sam },
    lowestSAM: { processName: lowest.name, samSec: lowest.sam },
    bottleneckRatio,
  };
}

export function formatCurrencyBDT(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 1,
  }).format(amount).replace('BDT', '৳');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
