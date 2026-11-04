import { WaterfallRowStatus } from '../types';

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

/**
 * Returns canonical status metadata strictly aligned across FRC and Analyst views.
 * Statuses:
 * - 'draft' -> "Draft"
 * - 'step_finalized' -> "Requirement Finalized"
 * - 'in_modification' -> "In Modification"
 * - 'in_analysis' -> "Analytics in Progress"
 * - 'ready_for_review' -> "Analytics in Progress"
 *
 * Certified status is retired and mapped to "Requirement Finalized".
 */
export function getWaterfallStatusInfo(
  status: WaterfallRowStatus | string,
  role?: 'frc' | 'analyst'
): StatusConfig {
  switch (status) {
    case 'draft':
      return {
        label: 'Requirement in Draft',
        description: 'Requirement in Draft',
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
        dotColor: 'bg-stone-400',
      };
    case 'in_modification':
      return {
        label: role === 'frc' ? 'In Modification' : 'New Requirement in Progress',
        description: role === 'frc' ? 'In Modification by FRC' : 'New Requirement in Progress',
        badgeClass: 'bg-amber-500 text-white border-amber-600',
        dotColor: 'bg-amber-200',
      };
    case 'in_analysis':
      return {
        label: 'Analytics in Progress',
        description: 'Analytics in Progress',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        dotColor: 'bg-blue-600',
      };
    case 'ready_for_review':
    case 'submitted':
      return {
        label: 'Analytics Step Completed',
        description: 'Analytics Step Completed',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotColor: 'bg-emerald-600',
      };
    case 'step_finalized':
    case 'signed_off': // Aligned with FRC: retired "certified", mapped to Requirement Finalized
    default:
      return {
        label: 'Requirement Finalized',
        description: 'Requirement Finalized',
        badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        dotColor: 'bg-indigo-600',
      };
  }
}
