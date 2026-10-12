"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Input avec compteur de caractères visible (ex. 12 / 200). */
export function CharCountInput({
  maxLength,
  defaultValue,
  className,
  id,
  ...props
}: React.ComponentProps<"input"> & { maxLength: number }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const initial = typeof defaultValue === "string" ? defaultValue.length : 0;
  const [count, setCount] = useState(initial);
  return (
    <div className="space-y-1">
      <Input
        {...props}
        id={inputId}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className={className}
        onChange={(e) => {
          setCount(e.target.value.length);
          props.onChange?.(e);
        }}
        aria-describedby={`${inputId}-count`}
      />
      <p id={`${inputId}-count`} className="text-right text-xs tabular-nums text-muted-foreground">
        {count} / {maxLength}
      </p>
    </div>
  );
}

/** Textarea avec compteur de caractères. */
export function CharCountTextarea({
  maxLength,
  defaultValue,
  className,
  id,
  ...props
}: React.ComponentProps<"textarea"> & { maxLength: number }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const initial = typeof defaultValue === "string" ? defaultValue.length : 0;
  const [count, setCount] = useState(initial);
  return (
    <div className="space-y-1">
      <Textarea
        {...props}
        id={inputId}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className={cn(className)}
        onChange={(e) => {
          setCount(e.target.value.length);
          props.onChange?.(e);
        }}
        aria-describedby={`${inputId}-count`}
      />
      <p id={`${inputId}-count`} className="text-right text-xs tabular-nums text-muted-foreground">
        {count} / {maxLength}
      </p>
    </div>
  );
}
