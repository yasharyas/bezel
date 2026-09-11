"use client";

import { MultiStepLoader } from "bezel-ui/loaders/MultiStepLoader";

export default function MultiStepLoaderPreview() {
  return (
    <main className="min-h-screen bg-[#f7f3ee]">
      <MultiStepLoader
        loading
        loop
        duration={1500}
        title="Setting up your workspace"
        loadingStates={[
          { text: "Checking your details" },
          { text: "Creating the workspace" },
          { text: "Importing your data" },
          { text: "Inviting your team" },
          { text: "Ready" },
        ]}
      />
    </main>
  );
}
