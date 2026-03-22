const { fetchFishSpeciesCatalog } = require('../providers/usgsNas.provider');

const COMMON_NAME_ALIASES = {
  largemouthbass: ['largemouth black bass'],
  smallmouthbass: ['smallmouth black bass'],
  stripedbass: ['striper'],
  redear: ['redear sunfish', 'shellcracker'],
  bluegill: ['bream'],
  crappie: ['black crappie', 'white crappie'],
};

const SCIENTIFIC_NAME_ALIASES = {
  micropterussalmoides: ['micropterusnigricans'],
  micropterusnigricans: ['micropterussalmoides'],
};

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeNasItem(item) {
  const genus = String(item?.genus || '').trim();
  const species = String(item?.species || '').trim();
  const scientificName = String(item?.scientific_name || item?.scientificName || `${genus} ${species}` || '').trim();
  const commonName = String(item?.common_name || item?.commonName || '').trim();
  const family = String(item?.family || '').trim() || null;
  const nativeExotic = String(item?.native_exotic || item?.nativeExotic || '').trim();
  const speciesId = item?.species_ID ?? item?.speciesId ?? null;

  return {
    speciesId,
    scientificName: scientificName || null,
    commonName: commonName || null,
    family,
    nativeExotic: nativeExotic || null,
  };
}

function buildCatalogIndex(items) {
  const scientificNameMap = new Map();
  const commonNameMap = new Map();

  items.map(normalizeNasItem).forEach((item) => {
    if (item.scientificName) scientificNameMap.set(normalizeKey(item.scientificName), item);
    if (item.commonName) commonNameMap.set(normalizeKey(item.commonName), item);
  });

  return { scientificNameMap, commonNameMap };
}

function buildTaxonomyNote(scientificName, commonName) {
  const scientificKey = normalizeKey(scientificName);
  const commonKey = normalizeKey(commonName);

  if (scientificKey === 'micropterusnigricans' || commonKey === 'largemouthbass') {
    return 'Largemouth bass is now commonly treated as Micropterus nigricans; older sources may still use Micropterus salmoides.';
  }

  if (scientificKey === 'micropterussalmoides' || commonKey === 'floridabass') {
    return 'Florida bass is commonly treated as Micropterus salmoides and was historically often grouped under largemouth bass naming.';
  }

  return null;
}

function mapNasStatus(nativeExotic) {
  const value = String(nativeExotic || '').toLowerCase();

  if (value === 'native') {
    return { status: 'native', label: 'Native', confidence: 'high' };
  }

  if (value === 'exotic') {
    return { status: 'introduced', label: 'Introduced', confidence: 'high' };
  }

  if (value === 'cryptogenic') {
    return { status: 'unknown', label: 'Unknown', confidence: 'medium' };
  }

  if (value === 'hybrid') {
    return { status: 'unknown', label: 'Unknown', confidence: 'low' };
  }

  return { status: 'unknown', label: 'Unknown', confidence: 'low' };
}

function buildOrigin(item, matchedOn) {
  const mapped = mapNasStatus(item?.nativeExotic);
  const explanation = [];

  if (matchedOn === 'scientificName') {
    explanation.push('Matched scientific name to USGS NAS species metadata.');
  } else if (matchedOn === 'scientificAlias') {
    explanation.push('Matched a historical scientific-name synonym to USGS NAS species metadata.');
  } else if (matchedOn === 'commonName') {
    explanation.push('Matched common name to USGS NAS species metadata.');
  } else if (matchedOn === 'alias') {
    explanation.push('Matched a known common-name alias to USGS NAS species metadata.');
  }

  if (mapped.status === 'native') {
    explanation.push('USGS NAS classifies this species as native to the United States.');
  } else if (mapped.status === 'introduced') {
    explanation.push('USGS NAS classifies this species as non-native in the United States.');
  } else if (String(item?.nativeExotic || '').toLowerCase() === 'cryptogenic') {
    explanation.push('USGS NAS classifies this species as cryptogenic, so origin is treated as uncertain.');
  } else if (String(item?.nativeExotic || '').toLowerCase() === 'hybrid') {
    explanation.push('USGS NAS marks this as a hybrid entry, so origin is treated as uncertain.');
  } else {
    explanation.push('No supported origin classification was available from the enrichment source.');
  }

  return {
    status: mapped.status,
    label: mapped.label,
    source: 'usgs_nas',
    confidence: mapped.confidence,
    explanation,
    provenance: {
      provider: 'usgs_nas',
      matchedOn,
      confidence: mapped.confidence,
      speciesId: item?.speciesId ?? null,
    },
  };
}

function buildUnknownOrigin() {
  return {
    status: 'unknown',
    label: 'Unknown',
    source: null,
    confidence: 'low',
    explanation: ['No origin metadata match was found.'],
    provenance: {
      provider: null,
      matchedOn: null,
      confidence: 'low',
      speciesId: null,
    },
  };
}

function findAliasMatch(commonNameMap, commonName) {
  const normalized = normalizeKey(commonName);
  const aliasEntries = Object.entries(COMMON_NAME_ALIASES);

  for (const [canonical, aliases] of aliasEntries) {
    const normalizedAliases = aliases.map(normalizeKey);
    if (normalized === canonical || normalizedAliases.includes(normalized)) {
      const match = commonNameMap.get(canonical);
      if (match) return match;
    }
  }

  return null;
}

function findScientificAliasMatch(scientificNameMap, scientificName) {
  const normalized = normalizeKey(scientificName);
  const aliases = SCIENTIFIC_NAME_ALIASES[normalized] || [];

  for (const alias of aliases) {
    const match = scientificNameMap.get(alias);
    if (match) return match;
  }

  return null;
}

async function enrichSpeciesOrigins(items) {
  if (!Array.isArray(items) || !items.length) return items || [];

  try {
    const catalog = await fetchFishSpeciesCatalog();
    const { scientificNameMap, commonNameMap } = buildCatalogIndex(catalog);

    return items.map((item) => {
      const scientificKey = normalizeKey(item?.scientificName);
      const commonKey = normalizeKey(item?.commonName);

      if (scientificKey && scientificNameMap.has(scientificKey)) {
        const match = scientificNameMap.get(scientificKey);
        return {
          ...item,
          taxonomyNote: buildTaxonomyNote(item?.scientificName, item?.commonName),
          origin: buildOrigin(match, 'scientificName'),
        };
      }

      const scientificAliasMatch = findScientificAliasMatch(scientificNameMap, item?.scientificName);
      if (scientificAliasMatch) {
        return {
          ...item,
          taxonomyNote: buildTaxonomyNote(item?.scientificName, item?.commonName),
          origin: buildOrigin(scientificAliasMatch, 'scientificAlias'),
        };
      }

      if (commonKey && commonNameMap.has(commonKey)) {
        const match = commonNameMap.get(commonKey);
        return {
          ...item,
          taxonomyNote: buildTaxonomyNote(item?.scientificName, item?.commonName),
          origin: buildOrigin(match, 'commonName'),
        };
      }

      const aliasMatch = findAliasMatch(commonNameMap, item?.commonName);
      if (aliasMatch) {
        return {
          ...item,
          taxonomyNote: buildTaxonomyNote(item?.scientificName, item?.commonName),
          origin: buildOrigin(aliasMatch, 'alias'),
        };
      }

      return {
        ...item,
        taxonomyNote: buildTaxonomyNote(item?.scientificName, item?.commonName),
        origin: buildUnknownOrigin(),
      };
    });
  } catch {
    return items;
  }
}

module.exports = {
  enrichSpeciesOrigins,
};
