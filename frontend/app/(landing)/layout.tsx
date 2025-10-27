import { Metadata } from "next";
import React from "react";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Maroil Trading",
  description: "Maroil Trading Refinery.",
};

export default function LandingLayout({ children }: LandingLayoutProps) {
  return <React.Fragment>{children}</React.Fragment>;
}
