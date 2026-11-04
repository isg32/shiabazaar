"use client";

import dynamic from "next/dynamic";

// ponytail: client wrapper so ssr:false works from a server component parent
const ScrollBookDynamic = dynamic(() => import("./ScrollBook"), { ssr: false });

export function ScrollBookLazy() {
  return <ScrollBookDynamic />;
}
