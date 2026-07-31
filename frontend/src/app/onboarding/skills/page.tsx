"use client";

import { ArrowRight, Plus, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { StepCard } from "@/components/onboarding/step-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import {
  SKILL_LEVELS,
  type DesiredSkillDraft,
} from "@/features/onboarding/types";
import { isValidLevelProgression } from "@/features/onboarding/validation";
import { useOnboardingStore } from "@/stores/onboarding-store";

const suggestions = [
  "Node.js",
  "Tiếng Anh giao tiếp",
  "UI/UX Design",
  "Phân tích dữ liệu",
  "Thuyết trình",
  "React",
  "Quản lý dự án",
];

function createSkill(name: string): DesiredSkillDraft {
  return {
    clientId:
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name,
    currentLevel: "NONE",
    targetLevel: "INTERMEDIATE",
  };
}

export default function SkillsPage() {
  const router = useRouter();
  const skills = useOnboardingStore((state) => state.draft.skills);
  const setSkills = useOnboardingStore((state) => state.setSkills);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      suggestions.filter(
        (item) =>
          item.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) &&
          !skills.some(
            (skill) =>
              skill.name.toLocaleLowerCase() === item.toLocaleLowerCase(),
          ),
      ),
    [query, skills],
  );

  const add = (name: string) => {
    const clean = name.trim();
    if (
      !clean ||
      skills.some(
        (skill) => skill.name.toLocaleLowerCase() === clean.toLocaleLowerCase(),
      )
    )
      return;
    setSkills([...skills, createSkill(clean)]);
    setQuery("");
    setError(null);
  };
  const update = (id: string, value: Partial<DesiredSkillDraft>) =>
    setSkills(
      skills.map((skill) =>
        skill.clientId === id ? { ...skill, ...value } : skill,
      ),
    );
  const next = () => {
    if (!skills.length)
      return setError("Hãy chọn ít nhất một kỹ năng bạn muốn học.");
    if (
      skills.some(
        (skill) =>
          !isValidLevelProgression(skill.currentLevel, skill.targetLevel),
      )
    )
      return setError("Mức mục tiêu phải cao hơn mức hiện tại ở mọi kỹ năng.");
    router.push("/onboarding/goal");
  };

  return (
    <StepCard
      title="Bạn muốn học điều gì?"
      description="Không chỉ kỹ năng công nghệ—hãy thêm bất kỳ kỹ năng nghề nghiệp hoặc giáo dục nào quan trọng với bạn."
    >
      <div className="relative">
        <Input
          label="Tìm hoặc nhập kỹ năng"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(query);
            }
          }}
          placeholder="Ví dụ: Node.js, tiếng Anh, thiết kế…"
          trailing={<Search className="text-muted-foreground size-4" />}
        />
        {query.trim() ? (
          <div className="border-border bg-surface absolute z-10 mt-2 w-full rounded-2xl border p-2 shadow-xl">
            {filtered.slice(0, 5).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => add(item)}
                className="hover:bg-surface-muted flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm"
              >
                <Plus className="size-4" /> {item}
              </button>
            ))}
            <button
              type="button"
              onClick={() => add(query)}
              className="text-primary-strong hover:bg-primary-soft flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold"
            >
              <Sparkles className="size-4" /> Thêm “{query.trim()}”
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.slice(0, 6).map((item) => (
          <button
            key={item}
            type="button"
            disabled={skills.some((skill) => skill.name === item)}
            onClick={() => add(item)}
            className="border-border bg-surface-muted hover:border-primary/40 rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-40"
          >
            + {item}
          </button>
        ))}
      </div>

      <div className="mt-7 space-y-3">
        {skills.map((skill, index) => (
          <div
            key={skill.clientId}
            className="border-border bg-surface-muted/55 rounded-[22px] border p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-primary-strong text-xs font-bold">
                  Ưu tiên {index + 1}
                </span>
                <h3 className="font-display text-xl font-semibold">
                  {skill.name}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Xóa ${skill.name}`}
                onClick={() =>
                  setSkills(
                    skills.filter((item) => item.clientId !== skill.clientId),
                  )
                }
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Mức hiện tại"
                value={skill.currentLevel}
                onChange={(event) =>
                  update(skill.clientId, {
                    currentLevel: event.target
                      .value as DesiredSkillDraft["currentLevel"],
                  })
                }
                options={SKILL_LEVELS}
              />
              <SelectField
                label="Mức muốn đạt"
                value={skill.targetLevel}
                error={
                  !isValidLevelProgression(
                    skill.currentLevel,
                    skill.targetLevel,
                  )
                    ? "Phải cao hơn mức hiện tại."
                    : undefined
                }
                onChange={(event) =>
                  update(skill.clientId, {
                    targetLevel: event.target
                      .value as DesiredSkillDraft["targetLevel"],
                  })
                }
                options={SKILL_LEVELS}
              />
            </div>
          </div>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-danger mt-4 text-sm">
          {error}
        </p>
      ) : null}
      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={next}>
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </div>
    </StepCard>
  );
}
