"use client";

import { WhatsAppFAB } from "bezel-ui/buttons/WhatsAppFAB";
import { IMAGES } from "../kit";

export default function WhatsAppFABPreview() {
  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <img src={IMAGES.cake} alt="" className="h-36 w-full object-cover" />
      <div className="px-4 py-3">
        <p className="text-base font-semibold">Chocolate truffle cake</p>
        <p className="text-sm text-[#4a4a4c]">₹699 · serves 8 · order a day ahead</p>
      </div>
      <WhatsAppFAB phoneNumber="910000000000" tooltipText="Chat with the bakery" />
    </main>
  );
}
