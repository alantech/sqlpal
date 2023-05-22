// https://usehooks-ts.com/react-hook/use-isomorphic-layout-effect
import { useLayoutEffect, useEffect } from 'react'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default useIsomorphicLayoutEffect;
