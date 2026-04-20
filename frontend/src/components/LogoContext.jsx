import React, { createContext, useContext, useState, useEffect } from 'react';

const LogoContext = createContext();

export function LogoProvider({ children }) {
  // 1. Check if we saved a custom logo previously, otherwise use default
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('systemLogo') || '/logo.png';
  });

  // 2. Every time the logo changes, save it to local storage so it survives page refreshes!
  useEffect(() => {
    localStorage.setItem('systemLogo', logoUrl);
  }, [logoUrl]);

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}