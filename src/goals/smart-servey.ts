export type SmartServey = {
  specific: {
    status: 'newGoal' | 'corresponds';
    definition: string;
    currentNameConclusion: string | null;
    proposedNames: string[] | null;
  };
  mesurable: {
    status: 'newGoal' | 'corresponds';
    definition: string;
    currentGoalConclusion: string | null;
    proposedMeasures: string[] | null;
  };
  actionable: {
    status: 'newGoal' | 'corresponds';
    definition: string;
    currentGoalConclusion: string | null;
    proposedActions: string[] | null;
  };
  resonable: {
    status: 'newGoal' | 'corresponds';
    definition: string;
    currentGoalConclusion: string | null;
    proposedReasons: string[] | null;
  };
  timeBound: {
    status: 'newGoal' | 'corresponds';
    definition: string;
    currentGoalConclusion: string | null;
    proposedTimeFrames: string[] | null;
  };
};

export const createDefaultSmartServey = (): SmartServey => ({
  specific: {
    status: 'newGoal',
    definition: `(Specific):
Goals should be well-defined and unambiguous. Ask: What exactly needs to be accomplished? Who is involved?`,
    currentNameConclusion: null,
    proposedNames: null,
  },
  mesurable: {
    status: 'newGoal',
    definition: `(Mesurable):
Goals should have measurable criteria. Ask: How will progress be tracked and measured?`,
    currentGoalConclusion: null,
    proposedMeasures: null,
  },
  actionable: {
    status: 'newGoal',
    definition: `(Actionable):
Goals should be actionable. Ask: What specific actions need to be taken to achieve the goal?`,
    currentGoalConclusion: null,
    proposedActions: null,
  },
  resonable: {
    status: 'newGoal',
    definition: `(Resonable):
Goals should be reasonable and attainable. Ask: Is the goal realistic given the available resources and constraints?`,
    currentGoalConclusion: null,
    proposedReasons: null,
  },
  timeBound: {
    status: 'newGoal',
    definition: `(TimeBound):
Goals should have a clear timeframe. Ask: What is the deadline for achieving the goal?`,
    currentGoalConclusion: null,
    proposedTimeFrames: null,
  },
});
