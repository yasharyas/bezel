"use client";

import { useId, useState } from "react";
import { ScreenLayout } from "bezel-ui/layout/ScreenLayout";
import { Stepper } from "bezel-ui/navigation/Stepper";
import { StepperNavigation } from "bezel-ui/navigation/StepperNavigation";
import { TextInput } from "bezel-ui/forms/TextInput";

const noop = () => {};

export default function ScreenLayoutPreview() {
  const id = useId();
  const [company, setCompany] = useState("Tideline Studio");
  const [gst, setGst] = useState("27ABCDE1234F1Z5");
  return (
    <ScreenLayout
      brandInitials="BZ"
      brandName="Bezel Studio"
      title="Business details"
      subtitle="We use these to set up invoicing."
      stepper={
        <Stepper
          steps={[
            { id: "account", title: "Account" },
            { id: "business", title: "Business" },
            { id: "payout", title: "Payout" },
          ]}
          currentStepIndex={1}
          completedStepIds={new Set(["account"])}
        />
      }
      navigation={
        <StepperNavigation currentStepIndex={1} totalSteps={3} onPrevious={noop} onNext={noop} onSubmit={noop} />
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <TextInput name={`${id}-company`} label="Company name" value={company} onChange={setCompany} mandatory />
        <TextInput name={`${id}-gst`} label="GST number" value={gst} onChange={setGst} uppercase />
      </div>
    </ScreenLayout>
  );
}
