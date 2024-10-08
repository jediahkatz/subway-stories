import { useRef, useCallback } from 'react';

export function useDebounce(func, wait) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedFunction = useCallback((...args) => {
        const later = () => {
            func(...args);
        };

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(later, wait);
    }, [func, wait]);

    return debouncedFunction;
}
