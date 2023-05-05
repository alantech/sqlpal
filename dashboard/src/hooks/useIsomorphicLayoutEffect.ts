// https://usehooks-ts.com/react-hook/use-local-storage
import { useLayoutEffect, useEffect } from 'react'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default useIsomorphicLayoutEffect;
