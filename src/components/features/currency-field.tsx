"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

type Props = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur"
> & {
  value: string;
  onChange: (value: string) => void;
  /** If true, blur formats empty as "0.00"; if false, empty stays empty. */
  allowEmpty?: boolean;
};

/**
 * Controlled amount input: formats to two decimals on blur (e.g. 2300 → 2300.00).
 */
export function CurrencyField({
  value,
  onChange,
  allowEmpty = true,
  className,
  ...rest
}: Props) {
  return (
    <Input
      {...rest}
      className={cn("tabular-nums", className)}
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        const t = value.trim();
        if (t === "") {
          onChange(allowEmpty ? "" : formatCurrency("0"));
          return;
        }
        onChange(formatCurrency(t));
      }}
    />
  );
}
