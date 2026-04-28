const likelyNamePattern = /^[A-Za-zÑñ.'\-\s]{3,}$/;

function normalizeStringCandidate(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return getNameFromObject(parsed);
    } catch {
      // Not JSON, continue below.
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
  if (typeof window === 'undefined') return null;

  const storageKeys = [
    'loggedInUser',
    'loggedInUsername',
    'username',
    'userName',
    'currentUser',
    'user',
    'fullName',
    'name',
    'authUser',
    'portalUser',
    'current_user',
    'loginUser'
  ];

  for (const key of storageKeys) {
    const localValue = localStorage.getItem(key);
    const parsedLocal = normalizeStringCandidate(localValue) || getNameFromObject(localValue && localValue.startsWith('{') ? JSON.parse(localValue) : localValue);
    if (parsedLocal) return parsedLocal;

    const sessionValue = sessionStorage.getItem(key);
    const parsedSession = normalizeStringCandidate(sessionValue) || getNameFromObject(sessionValue && sessionValue.startsWith('{') ? JSON.parse(sessionValue) : sessionValue);
    if (parsedSession) return parsedSession;
  }

  const searchedSession = scanStorage(sessionStorage);
  if (searchedSession) return searchedSession;

  const searchedLocal = scanStorage(localStorage);
  if (searchedLocal) return searchedLocal;

  const params = new URLSearchParams(window.location.search);
  const queryKeys = ['user', 'username', 'name', 'fullname', 'full_name', 'loggedInUser', 'currentUser'];
  for (const key of queryKeys) {
    const value = params.get(key);
    const candidate = normalizeStringCandidate(value);
    if (candidate) return candidate;
  }

  const hash = window.location.hash;
  if (hash && hash.includes('=')) {
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    for (const key of queryKeys) {
      const value = hashParams.get(key);
      const candidate = normalizeStringCandidate(value);
      if (candidate) return candidate;
    }
  }

  const globalKeys = ['CURRENT_USER', 'currentUser', 'LOGGED_IN_USER', 'loggedInUser', 'USER_NAME', 'userName'];
  for (const key of globalKeys) {
    const value = window[key];
    if (typeof value === 'string') {
      const candidate = normalizeStringCandidate(value);
      if (candidate) return candidate;
    }
    if (typeof value === 'object') {
      const candidate = getNameFromObject(value);
      if (candidate) return candidate;
    }
  }

  if (typeof window.name === 'string') {
    const candidate = normalizeStringCandidate(window.name);
    if (candidate) return candidate;
  }

  return null;
}
