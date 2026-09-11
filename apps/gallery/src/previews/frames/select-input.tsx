"use client";

import { useId, useState } from "react";
import { SelectInput } from "bezel-ui/forms/SelectInput";

export default function SelectInputPreview() {
  const [plan, setPlan] = useState("Studio");
  const id = useId();
  return (
    <main className="flex min-h-screen items-start justify-center px-8 pt-14">
      <div className="w-full max-w-[300px]">
        <SelectInput
          name={`${id}-plan`}
          label="Plan"
          value={plan}
          onChange={setPlan}
          options={["Starter", "Studio", "Enterprise"]}
          placeholder="Choose a plan"
          mandatory
        />
        <p className="mt-3 text-xs text-[#4a4a4c]">Arrow keys move, Enter selects, Escape closes.</p>
      </div>
    </main>
  );
}
