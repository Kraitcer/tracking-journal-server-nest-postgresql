ALTER TABLE "goals"
ADD COLUMN "smart" JSONB NOT NULL DEFAULT '{
  "specific": {
    "status": "newGoal",
    "definition": "(Specific):\nGoals should be well-defined and unambiguous. Ask: What exactly needs to be accomplished? Who is involved?",
    "currentNameConclusion": null,
    "proposedNames": null
  },
  "mesurable": {
    "status": "newGoal",
    "definition": "(Mesurable):\nGoals should have measurable criteria. Ask: How will progress be tracked and measured?",
    "currentGoalConclusion": null,
    "proposedMeasures": null
  },
  "actionable": {
    "status": "newGoal",
    "definition": "(Actionable):\nGoals should be actionable. Ask: What specific actions need to be taken to achieve the goal?",
    "currentGoalConclusion": null,
    "proposedActions": null
  },
  "resonable": {
    "status": "newGoal",
    "definition": "(Resonable):\nGoals should be reasonable and attainable. Ask: Is the goal realistic given the available resources and constraints?",
    "currentGoalConclusion": null,
    "proposedReasons": null
  },
  "timeBound": {
    "status": "newGoal",
    "definition": "(TimeBound):\nGoals should have a clear timeframe. Ask: What is the deadline for achieving the goal?",
    "currentGoalConclusion": null,
    "proposedTimeFrames": null
  }
}'::jsonb;
