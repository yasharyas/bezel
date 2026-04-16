import { MessageCircle } from "lucide-react";

type Props = {
  phoneNumber: string;
  message?: string;
  tooltipText?: string;
};

export function WhatsAppFAB({ phoneNumber, message = "Hello! I have a question.", tooltipText = "Chat with us!" }: Props) {
  const encodedMsg = encodeURIComponent(message);
  const href = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <MessageCircle size={26} fill="white" />
      {tooltipText && (
        <span className="absolute right-full mr-3 bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {tooltipText}
        </span>
      )}
    </a>
  );
}
