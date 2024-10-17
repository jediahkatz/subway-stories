import { useEffect, useRef } from 'react';

// Sorry Paras :(
export function usePrevious(value) {
    const ref = useRef();
    
    useEffect(() => {
        ref.current = value;
    }, [value]);
    
    return ref.current;
}