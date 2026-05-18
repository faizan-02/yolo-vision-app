"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

interface SwitchToggleThemeProps {
  isDark: boolean;
  onThemeChange: (dark: boolean) => void;
}

const SwitchToggleThemeDemo = ({ isDark, onThemeChange }: SwitchToggleThemeProps) => {
  const id = useId();

  return (
    <div className="group inline-flex items-center gap-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/80 px-3 py-1.5 rounded-2xl shadow-sm transition-all duration-300">
      <span
        id={`${id}-light`}
        className={cn(
          "cursor-pointer text-left text-sm font-medium transition-colors duration-200",
          isDark ? "text-slate-500 hover:text-slate-300" : "text-amber-500",
        )}
        aria-controls={id}
        onClick={() => onThemeChange(false)}
      >
        <SunIcon className="size-4" aria-hidden="true" />
      </span>

      <Switch
        id={id}
        checked={isDark}
        onCheckedChange={onThemeChange}
        aria-labelledby={`${id}-light ${id}-dark`}
        aria-label="Toggle between dark and light mode"
      />

      <span
        id={`${id}-dark`}
        className={cn(
          "cursor-pointer text-right text-sm font-medium transition-colors duration-200",
          isDark ? "text-rose-400" : "text-slate-400 hover:text-slate-600",
        )}
        aria-controls={id}
        onClick={() => onThemeChange(true)}
      >
        <MoonIcon className="size-4" aria-hidden="true" />
      </span>
    </div>
  );
};

export default SwitchToggleThemeDemo;
