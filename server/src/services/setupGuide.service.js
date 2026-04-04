const setupGuideDefinitions = {
  texas_rig: {
    id: 'texas_rig',
    title: 'Texas Rig Setup',
    subtitle: 'Step-by-step guide',
    type: 'rig',
    appliesToRig: 'Texas rig',
    summary: 'Build the classic weedless Texas rig in four exact steps.',
    steps: [
      {
        step: 1,
        title: 'Insert Hook',
        instruction: 'Push hook into the nose of the bait.',
        imageKey: 'texas_step_1',
      },
      {
        step: 2,
        title: 'Slide Up and Rotate Hook',
        instruction: 'Slide bait up hook and rotate.',
        imageKey: 'texas_step_2',
      },
      {
        step: 3,
        title: 'Reinsert Hook (Weedless)',
        instruction: 'Reinsert hook into bait for a weedless presentation.',
        imageKey: 'texas_step_3',
      },
      {
        step: 4,
        title: 'Add Weight',
        instruction: 'Slide weight onto line, snug against hook.',
        imageKey: 'texas_step_4',
      },
    ],
  },
  palomar_knot: {
    id: 'palomar_knot',
    title: 'Palomar Knot',
    subtitle: 'Strong and simple',
    type: 'knot',
    appliesToRig: null,
    summary: 'Tie a clean Palomar knot with the same line path every time.',
    steps: [
      {
        step: 1,
        title: 'Double the Line',
        instruction: 'Pass loop through hook eye.',
        imageKey: 'palomar_step_1',
      },
      {
        step: 2,
        title: 'Tie Overhand Knot',
        instruction: 'Tie overhand knot with the loop.',
        imageKey: 'palomar_step_2',
      },
      {
        step: 3,
        title: 'Pull Loop Over Hook',
        instruction: 'Pass hook through loop, pull loop over hook.',
        imageKey: 'palomar_step_3',
      },
      {
        step: 4,
        title: 'Tighten Knot',
        instruction: 'Moisten line, then pull ends to tighten.',
        imageKey: 'palomar_step_4',
      },
    ],
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listSetupGuides() {
  return Object.values(setupGuideDefinitions).map((guide) => ({
    id: guide.id,
    title: guide.title,
    subtitle: guide.subtitle,
    type: guide.type,
    appliesToRig: guide.appliesToRig,
    summary: guide.summary,
    stepCount: guide.steps.length,
  }));
}

function getSetupGuide(guideId) {
  const normalizedId = String(guideId || '').trim().toLowerCase();
  if (!normalizedId) {
    throw new Error('Guide id is required');
  }

  const guide = setupGuideDefinitions[normalizedId];
  if (!guide) {
    const error = new Error('Setup guide not found');
    error.status = 404;
    throw error;
  }

  return clone(guide);
}

function findGuideIdForRig(rigName) {
  const normalizedRig = String(rigName || '').trim().toLowerCase();
  if (!normalizedRig) return null;

  const matchedGuide = Object.values(setupGuideDefinitions).find((guide) => (
    guide.appliesToRig && String(guide.appliesToRig).trim().toLowerCase() === normalizedRig
  ));

  return matchedGuide?.id || null;
}

module.exports = {
  listSetupGuides,
  getSetupGuide,
  findGuideIdForRig,
  setupGuideDefinitions,
};
