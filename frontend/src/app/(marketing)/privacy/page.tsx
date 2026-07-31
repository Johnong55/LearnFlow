import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quyền riêng tư" };

export default function PrivacyPage() {
  return (
    <main className="page-shell pt-36 pb-24">
      <article className="mx-auto max-w-3xl">
        <p className="text-primary-strong text-sm font-semibold">PRIVACY</p>
        <h1 className="font-display mt-4 text-5xl font-bold">
          Your learning data belongs to you.
        </h1>
        <div className="text-muted-foreground mt-10 space-y-6 text-[17px] leading-8">
          <p>
            SkillPilot only requests information needed to personalize your
            roadmap, protect your routines, and track progress. Authentication
            secrets are never displayed or stored by this frontend.
          </p>
          <p>
            The production privacy policy will describe data retention, exports,
            deletion, subprocessors, and contact procedures before public
            launch.
          </p>
          <p>
            This current page documents the Phase 2 product intent and is not a
            substitute for a reviewed legal policy.
          </p>
        </div>
      </article>
    </main>
  );
}
