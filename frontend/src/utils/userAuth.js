const likelyNamePattern = /^[A-Za-zÑñ.'\-_\s]{3,}$/;

function normalizeStringCandidate(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Skip "active" as it's likely a default status, not a username
  if (trimmed.toLowerCase() === 'active') return null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return getNameFromObject(parsed);
    } catch {
      // Not JSON, continue below.
    }
  }

  // Handle bis_ prefix format
  if (trimmed.startsWith('bis_')) {
    const namePart = trimmed.substring(4); // Remove 'bis_' prefix
    if (namePart && likelyNamePattern.test(namePart)) {
      return namePart;
    }
  }

  if (likelyNamePattern.test(trimmed) && trimmed.split(' ').length <= 5) {
    return trimmed;
  }

  return null;
}

function getNameFromObject(item) {
  if (!item || typeof item !== 'object') return null;

  const props = [
    'fullName', 'fullname', 'full_name', 'name', 'displayName', 'userName', 'username', 'user', 'firstName'
  ];

  for (const prop of props) {
    const value = item[prop];
    const candidate = normalizeStringCandidate(value);
    if (candidate) return candidate;
  }

  for (const key of Object.keys(item)) {
    const value = item[key];
    if (typeof value === 'string') {
      const candidate = normalizeStringCandidate(value);
      if (candidate) return candidate;
    }
    if (typeof value === 'object') {
      const candidate = getNameFromObject(value);
      if (candidate) return candidate;
    }
  }

  return null;
}

function scanStorage(storage) {
  if (!storage || typeof storage.length !== 'number') return null;

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    const raw = storage.getItem(key);
    if (!raw) continue;

    const lowerKey = key?.toLowerCase() || '';
    const candidate = normalizeStringCandidate(raw);
    if (candidate && (lowerKey.includes('user') || lowerKey.includes('name') || lowerKey.includes('auth') || lowerKey.includes('profile'))) {
      return candidate;
    }

    const objectCandidate = getNameFromObject(raw.startsWith('{') || raw.startsWith('[') ? JSON.parse(raw) : raw);
    if (objectCandidate) return objectCandidate;
  }

  return null;
}

export function getLoggedInUserName() {
  // Display lonto for the single account
  return 'lonto';
}
