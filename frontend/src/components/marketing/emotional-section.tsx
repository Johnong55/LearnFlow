import { Eye, Feather, RefreshCw } from "lucide-react";

import { DisplayHeading } from "@/components/ui/display-heading";

const principles = [
  {
    icon: Feather,
    title: "Sustainable pace",
    text: "Capacity is a boundary, not a target you must max out.",
  },
  {
    icon: RefreshCw,
    title: "Flexible planning",
    text: "A changed week creates a changed plan—not a broken one.",
  },
  {
    icon: Eye,
    title: "Visible progress",
    text: "See what moved forward without turning every day into a score.",
  },
];

export function EmotionalSection() {
  return (
    <section className="section-space relative overflow-hidden">
      <div className="bg-primary-soft/60 absolute inset-x-[8%] inset-y-[12%] -z-10 rounded-[5rem] blur-3xl" />
      <div className="page-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-primary-strong mb-4 text-sm font-semibold">
            PROGRESS, WITHOUT THE PRESSURE
          </p>
          <DisplayHeading>
            Make progress without turning your life into a productivity contest.
          </DisplayHeading>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-[17px] leading-8">
            SkillPilot helps you move forward at a pace you can sustain. Your
            plan changes when your life changes.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <article key={title} className="text-center">
              <span className="bg-surface text-primary-strong border-border mx-auto grid size-14 place-items-center rounded-[22px] border shadow-sm">
                <Icon className="size-5" />
              </span>
              <h3 className="font-display mt-5 text-xl font-bold">{title}</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
