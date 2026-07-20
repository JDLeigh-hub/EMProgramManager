// The 4 engagement-level phases that gate the guided workspace flow.
// New projects start in Discovery; the header phase stepper moves them along.
export const ENGAGEMENT_PHASES = ['Discovery', 'Kickoff', 'Implementation', 'Assessment'];

// Master-checklist sections, mapped to the engagement phase they belong to.
// Sections not listed here are "Ongoing" — always shown regardless of phase
// (weekly rhythm, failure modes, the MVP pack, first-2-weeks priorities).
const SECTION_PHASE = {
  '1. Before kickoff: foundation': 'Kickoff',
  '1B. Value baseline (Ramp to Value)': 'Kickoff',
  '2. Kickoff preparation': 'Kickoff',
  '3. Customer kickoff outcomes': 'Kickoff',
  '4. Discovery & planning': 'Discovery',
  '4A. Value Hypothesis (per use case)': 'Discovery',
  '4B. Stakeholder Value Map (per use case)': 'Discovery',
  '5. Implementation & execution': 'Implementation',
  '6. Launch & adoption readiness': 'Implementation',
  '7. Value realization': 'Assessment',
  '8. Closeout & next-phase': 'Assessment',
};

export function sectionPhase(section) {
  return SECTION_PHASE[section] || 'Ongoing';
}

// Project-plan task / Gantt-stage "phase" labels, mapped to the same 4
// engagement phases (Launch folds into Implementation; Closeout into
// Assessment, matching "Kickoff = Mobilize+Kickoff, Discovery = Discovery,
// Implementation = Build+UAT+Launch, Assessment = Value").
const TASK_PHASE_GROUP = {
  'Pre-kickoff': 'Kickoff',
  'Kickoff': 'Kickoff',
  'Discovery': 'Discovery',
  'Implementation': 'Implementation',
  'Launch': 'Implementation',
  'Value': 'Assessment',
  'Closeout': 'Assessment',
};

export function taskPhaseGroup(phase) {
  return TASK_PHASE_GROUP[phase] || 'Kickoff';
}

export function phaseIndex(phase) {
  const i = ENGAGEMENT_PHASES.indexOf(phase);
  return i < 0 ? 0 : i;
}

// The Project Plan Gantt orders its phase bands chronologically (Kickoff's
// shared mobilize/kickoff stages always start first, then each use case's
// own Discovery → Implementation → Assessment work) — a different order
// than ENGAGEMENT_PHASES, which is about guiding the EM's workflow (start
// in free-form Discovery before a use case is even committed, then move
// into formal Kickoff).
export const GANTT_PHASE_ORDER = ['Kickoff', 'Discovery', 'Implementation', 'Assessment'];
