"use client";

import type { ReactNode } from "react";

interface GroupFormationWrapperProps {
  className?: string;
  children: ReactNode;
}

export function GroupFormationWrapper({ className, children }: GroupFormationWrapperProps) {
  return <div className={className}>{children}</div>;
}
