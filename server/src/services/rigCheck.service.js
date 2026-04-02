const canonicalRigDefinitions = {
  'texas rig': {
    label: 'Texas rig',
    hook: {
      expected: 'offset worm hook',
      aliases: ['offset worm hook', 'ewg hook', 'offset hook', 'worm hook'],
    },
    weight: {
      expected: 'bullet weight',
      aliases: ['bullet weight', 'bullet sinker', 'texas weight'],
    },
    bait: {
      expected: 'soft plastic worm',
      aliases: ['soft plastic worm', 'soft plastic', 'worm', 'creature bait', 'stick bait'],
    },
  },
  spinnerbait: {
    label: 'Spinnerbait',
    hook: {
      expected: 'integrated spinnerbait hook',
      aliases: ['spinnerbait hook', 'integrated spinnerbait hook', 'built-in spinnerbait hook'],
    },
    weight: {
      expected: 'integrated spinnerbait head',
      aliases: ['spinnerbait head', 'integrated spinnerbait head', 'weighted head'],
    },
    bait: {
      expected: 'skirted spinnerbait with trailer',
      aliases: ['spinnerbait', 'skirted spinnerbait', 'soft plastic trailer', 'trailer'],
    },
  },
  'drop shot': {
    label: 'Drop shot',
    hook: {
      expected: 'drop shot hook',
      aliases: ['drop shot hook', 'nose hook', 'finesse hook'],
    },
    weight: {
      expected: 'drop shot weight',
      aliases: ['drop shot weight', 'cylinder weight', 'teardrop weight'],
    },
    bait: {
      expected: 'small finesse soft plastic',
      aliases: ['finesse worm', 'small soft plastic', 'soft plastic', 'minnow bait'],
    },
  },
  'wacky rig': {
    label: 'Wacky rig',
    hook: {
      expected: 'wacky hook',
      aliases: ['wacky hook', 'finesse hook', 'circle wacky hook'],
    },
    weight: {
      expected: 'unweighted or nail weight',
      aliases: ['unweighted', 'nail weight', 'o-ring nail weight', 'none'],
    },
    bait: {
      expected: 'stick worm',
      aliases: ['stick worm', 'senko', 'soft stick bait', 'soft plastic worm'],
    },
  },
  'jighead + paddle tail': {
    label: 'Jighead + paddle tail',
    hook: {
      expected: 'jighead hook',
      aliases: ['jighead hook', 'integrated jig hook', 'jig hook'],
    },
    weight: {
      expected: 'jighead',
      aliases: ['jighead', 'weighted jighead', 'lead head'],
    },
    bait: {
      expected: 'paddle tail soft plastic',
      aliases: ['paddle tail', 'soft plastic paddle tail', 'swimbait', 'soft plastic swimbait'],
    },
  },
  'popping cork': {
    label: 'Popping cork',
    hook: {
      expected: 'leader hook or jighead under cork',
      aliases: ['jighead hook', 'leader hook', 'circle hook', 'live bait hook'],
    },
    weight: {
      expected: 'popping cork float system',
      aliases: ['popping cork', 'cork float', 'float'],
    },
    bait: {
      expected: 'live bait or soft plastic trailer',
      aliases: ['live bait', 'shrimp', 'soft plastic', 'paddle tail'],
    },
  },
  'fish finder rig': {
    label: 'Fish finder rig',
    hook: {
      expected: 'circle hook',
      aliases: ['circle hook', 'live bait hook', 'octopus hook'],
    },
    weight: {
      expected: 'sliding sinker',
      aliases: ['sliding sinker', 'egg sinker', 'fish finder weight'],
    },
    bait: {
      expected: 'live or cut bait',
      aliases: ['live bait', 'cut bait', 'shrimp', 'bait fish'],
    },
  },
  'surf high-low rig': {
    label: 'Surf high-low rig',
    hook: {
      expected: 'double dropper hooks',
      aliases: ['double hook', 'dropper hooks', 'high-low hooks', 'bait holder hook'],
    },
    weight: {
      expected: 'pyramid or spider weight',
      aliases: ['pyramid weight', 'spider weight', 'surf sinker'],
    },
    bait: {
      expected: 'cut bait or natural bait',
      aliases: ['cut bait', 'shrimp', 'sand flea', 'natural bait'],
    },
  },
};

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function findRigDefinition(rig) {
  const normalizedRig = normalizeText(rig);
  if (!normalizedRig) {
    throw new Error('Rig name is required');
  }

  const definition = canonicalRigDefinitions[normalizedRig];
  if (definition) return definition;

  const aliasEntry = Object.entries(canonicalRigDefinitions).find(([, candidate]) => (
    normalizeText(candidate.label) === normalizedRig
  ));

  if (!aliasEntry) {
    throw new Error('Rig check only supports the built-in FishDex rig names right now');
  }

  return aliasEntry[1];
}

function includesAlias(value, aliases) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return false;
  return aliases.some((alias) => normalizedValue.includes(normalizeText(alias)));
}

function buildValidationForField(label, providedValue, fieldDefinition) {
  const value = String(providedValue || '').trim();

  if (!value) {
    return {
      match: null,
      issue: null,
      fix: `Add ${label.toLowerCase()} to fully validate this rig.`,
      explanation: `${label} was not provided, so FishDex could not fully validate that part of the setup.`,
      missing: true,
    };
  }

  if (includesAlias(value, fieldDefinition.aliases)) {
    return {
      match: `${label} matches the expected ${fieldDefinition.expected}.`,
      issue: null,
      fix: null,
      explanation: `${label} aligns with the expected ${fieldDefinition.expected}.`,
      missing: false,
    };
  }

  return {
    match: null,
    issue: `${label} does not match this ${fieldDefinition.expected === fieldDefinition.aliases[0] ? 'rig setup' : 'rig setup'}.`,
    fix: `Use ${fieldDefinition.expected} for a cleaner ${label.toLowerCase()} match.`,
    explanation: `${label} does not align with the expected ${fieldDefinition.expected}.`,
    missing: false,
  };
}

function deriveConfidence(matchCount, mismatchCount, missingCount) {
  if (mismatchCount >= 2) return 'low';
  if (mismatchCount === 1) return 'medium';
  if (matchCount >= 3 && missingCount === 0) return 'high';
  if (matchCount >= 1) return 'medium';
  return 'low';
}

function checkRigSetup(input = {}) {
  const definition = findRigDefinition(input.rig);
  const validations = [
    buildValidationForField('Hook', input.hook, definition.hook),
    buildValidationForField('Weight', input.weight, definition.weight),
    buildValidationForField('Bait', input.bait, definition.bait),
  ];

  const matches = validations.map((item) => item.match).filter(Boolean);
  const issues = validations.map((item) => item.issue).filter(Boolean);
  const fixes = validations.map((item) => item.fix).filter(Boolean);
  const mismatches = validations
    .filter((item) => item.issue)
    .map((item) => item.explanation);

  const missingCount = validations.filter((item) => item.missing).length;
  const matchCount = matches.length;
  const mismatchCount = issues.length;
  const status = mismatchCount > 0 ? 'needs_adjustment' : 'valid';
  const confidence = deriveConfidence(matchCount, mismatchCount, missingCount);

  return {
    status,
    confidence,
    issues,
    fixes,
    explanation: {
      matches,
      mismatches,
    },
  };
}

module.exports = {
  checkRigSetup,
  canonicalRigDefinitions,
};
