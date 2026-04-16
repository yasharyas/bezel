import { Star } from "lucide-react";

export interface Testimonial {
  rating: number;
  text: string;
  name: string;
  role?: string;
}

type Props = {
  testimonial: Testimonial;
};

export function TestimonialCard({ testimonial }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-neutral-600 text-sm leading-relaxed mb-5 italic">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
          <span className="text-neutral-600 font-bold text-sm">
            {testimonial.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-neutral-900 font-semibold text-sm">{testimonial.name}</p>
          {testimonial.role && <p className="text-neutral-400 text-xs">{testimonial.role}</p>}
        </div>
      </div>
    </div>
  );
}
