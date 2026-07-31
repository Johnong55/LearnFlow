import type { Metadata } from "next";

export const metadata: Metadata = { title: "Điều khoản" };

export default function TermsPage() {
  return (
    <main className="page-shell pt-36 pb-24">
      <article className="mx-auto max-w-3xl">
        <p className="text-primary-strong text-sm font-semibold">TERMS</p>
        <h1 className="font-display mt-4 text-5xl font-bold">
          A clear agreement for steady progress.
        </h1>
        <div className="text-muted-foreground mt-10 space-y-6 text-[17px] leading-8">
          <p>
            SkillPilot provides planning and educational organization tools.
            Generated roadmaps are guidance and should be reviewed by the user
            before relying on them.
          </p>
          <p>
            The production terms will cover account responsibilities, acceptable
            use, service availability, intellectual property, and dispute
            procedures before public launch.
          </p>
          <p>
            This current page documents the Phase 2 product intent and is not a
            substitute for a reviewed legal agreement.
          </p>
        </div>
      </article>
    </main>
  );
}
