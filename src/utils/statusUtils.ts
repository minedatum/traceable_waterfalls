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
 * - 'ready_for_review' -> "Submitted for Review"
 *
 * Certified status is retired and mapped to "Requirement Finalized".
 */
export function getWaterfallStatusInfo(status: WaterfallRowStatus | string): StatusConfig {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        description: 'Draft Formulation',
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
        dotColor: 'bg-stone-400',
      };
    case 'in_modification':
      return {
        label: 'In Modification',
        description: 'In Modification by FRC',
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
        label: 'Submitted for Review',
        description: 'Submitted by Analyst (Ready for Review)',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        dotColor: 'bg-purple-600',
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
