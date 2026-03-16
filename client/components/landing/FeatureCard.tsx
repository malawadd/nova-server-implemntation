"use client";

import React from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

export default function FeatureCard({ icon, title, desc, color }: FeatureCardProps) {
  return (
    <div
      className="hybrid-surface p-6 flex flex-col gap-3 hover:translate-x-[2px] hover:translate-y-[2px] transition-transform duration-150"
      style={{ background: "var(--retro-surface)" }}
    >
      <span style={{ fontSize: 36 }}>{icon}</span>
      <h4 style={{ color }}>{title}</h4>
      <p className="text-sm font-medium opacity-70 leading-relaxed">{desc}</p>
    </div>
  );
}
