"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DisplayHeading } from "@/components/ui/display-heading";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { fadeUp, modalMotion } from "@/lib/motion/tokens";

const colors = [
  ["Primary", "bg-primary"],
  ["Accent", "bg-accent"],
  ["Coral", "bg-coral"],
  ["Info", "bg-info"],
  ["Surface", "bg-surface"],
  ["Muted", "bg-surface-muted"],
  ["Success", "bg-success"],
  ["Danger", "bg-danger"],
];

export function DesignSystemShowcase() {
  return (
    <main className="page-shell py-16 sm:py-24">
      <Badge tone="primary">DEVELOPMENT ONLY</Badge>
      <h1 className="font-display mt-5 text-5xl font-bold tracking-tight sm:text-6xl">
        SkillPilot design system
      </h1>
      <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-8">
        Semantic tokens and composable components used across marketing,
        authentication, and the future application.
      </p>

      <Section title="Typography">
        <DisplayHeading>
          Display heading · Học đều, sống cân bằng.
        </DisplayHeading>
        <p className="max-w-2xl text-lg leading-8">
          Inter supports readable Vietnamese body copy: Lộ trình học thông minh,
          vừa sức và phù hợp với cuộc sống thực tế.
        </p>
        <p className="text-muted-foreground text-sm">
          Labels and descriptions stay compact without becoming tiny.
        </p>
      </Section>

      <Section title="Semantic colors">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {colors.map(([label, className]) => (
            <div
              key={label}
              className="border-border bg-surface rounded-2xl border p-3"
            >
              <div className={`h-20 rounded-xl ${className}`} />
              <p className="mt-3 text-sm font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons and feedback">
        <div className="flex flex-wrap gap-3">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading loadingLabel="Saving...">
            Save
          </Button>
          <Button disabled>Disabled</Button>
          <Button success>
            <Check className="size-4" />
            Saved
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Badge tone="primary">Ready</Badge>
          <Badge tone="success">Completed</Badge>
          <Badge tone="accent">Needs review</Badge>
          <Badge tone="coral">Conflict</Badge>
          <Badge tone="blue">Scheduled</Badge>
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
          <Input
            label="Goal title"
            placeholder="Learn Node.js backend"
            description="Describe the outcome, not only the topic."
          />
          <Input
            label="Target date"
            type="date"
            error="Choose a date in the future."
          />
          <Input
            label="Disabled field"
            value="Protected sleep"
            disabled
            readOnly
          />
          <Input
            label="Loading field"
            placeholder="Searching skills..."
            trailing={<LoadingSpinner />}
          />
        </div>
      </Section>

      <Section title="Cards and loading">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <span className="bg-primary-soft text-primary-deep grid size-11 place-items-center rounded-2xl">
              <BookOpen className="size-5" />
            </span>
            <h3 className="font-display mt-6 text-2xl font-bold">
              Roadmap card
            </h3>
            <p className="text-muted-foreground mt-3 leading-7">
              Clear hierarchy, subtle border, generous radius, and one focused
              action.
            </p>
            <Button variant="ghost" className="mt-5 px-0">
              Open roadmap
              <ChevronRight className="size-4" />
            </Button>
          </Card>
          <SkeletonCard />
        </div>
        <Skeleton className="mt-5 h-3 w-full" />
      </Section>

      <Section title="Motion, dialogs, and toasts">
        <div className="flex flex-wrap gap-3">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Button variant="secondary">
              <Sparkles className="size-4" />
              Motion example
            </Button>
          </motion.div>
          <Button
            variant="secondary"
            onClick={() =>
              toast.success("Routine saved", {
                description: "Your upcoming schedule is still valid.",
              })
            }
          >
            <Bell className="size-4" />
            Show toast
          </Button>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button>Open dialog</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm" />
              <Dialog.Content asChild>
                <motion.div
                  variants={modalMotion}
                  initial="hidden"
                  animate="visible"
                  className="border-border bg-surface fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border p-6 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="font-display text-2xl font-bold">
                        Rebalance this week?
                      </Dialog.Title>
                      <Dialog.Description className="text-muted-foreground mt-3 leading-7">
                        Three learning sessions will move. Protected routines
                        will not change.
                      </Dialog.Description>
                    </div>
                    <Dialog.Close asChild>
                      <Button variant="ghost" size="icon" aria-label="Close">
                        <X className="size-4" />
                      </Button>
                    </Dialog.Close>
                  </div>
                  <div className="mt-7 flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <Button variant="secondary">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close asChild>
                      <Button>Preview changes</Button>
                    </Dialog.Close>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </Section>

      <Section title="Calendar and roadmap blocks">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <CalendarDays className="text-primary-strong size-5" />
              <h3 className="font-display text-xl font-bold">Thursday</h3>
            </div>
            <div className="space-y-2">
              <CalendarBlock
                time="09:00"
                label="Work"
                className="bg-info-soft text-info-foreground"
              />
              <CalendarBlock
                time="12:30"
                label="Lunch"
                className="bg-accent-soft text-accent-foreground"
              />
              <CalendarBlock
                time="19:00"
                label="Learning · 45 min"
                className="bg-primary-soft text-primary-deep"
              />
            </div>
          </Card>
          <Card>
            <Badge tone="success">IN PROGRESS</Badge>
            <h3 className="font-display mt-4 text-2xl font-bold">
              Build reliable APIs
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Milestone 2 · 4 modules · 12 tasks
            </p>
            <div className="bg-surface-muted mt-6 h-2 overflow-hidden rounded-full">
              <div className="bg-primary h-full w-[62%] rounded-full" />
            </div>
          </Card>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border mt-16 border-t pt-10">
      <h2 className="font-display mb-7 text-3xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function CalendarBlock({
  time,
  label,
  className,
}: {
  time: string;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${className}`}
    >
      <span>{label}</span>
      <span className="text-xs opacity-75">{time}</span>
    </div>
  );
}
