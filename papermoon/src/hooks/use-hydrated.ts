"use client";

import { useEffect, useState } from "react";

/** True after the first client mount — use to gate rendering of persisted
 *  (localStorage) state so server and client HTML match on first paint. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
