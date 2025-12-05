import { useCallback, useEffect, useState } from "react"

export const useLocalStorage = (key: string, initialValue: string) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (state !== undefined) {
        window.localStorage.setItem(key, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(key);
      }
    } catch { }
  }, [key, state]);

  const setValue = useCallback((value: string) => {
    setState(value);
  }, [])

  return [state, setValue];
};

export default useLocalStorage;
