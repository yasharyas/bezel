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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
      {/* The stars are one image with a spoken rating. Gold fill keeps the look;
          the darker gold outline is what clears 3:1 on white. */}
      <div
        role="img"
        aria-label={`Rated ${testimonial.rating} out of 5`}
        className="flex items-center gap-0.5 mb-4"
      >
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            size={14}
            aria-hidden
            className="fill-[color:var(--bz-gold-fill,#c9a227)] text-[color:var(--bz-gold,#7a6015)]"
          />
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
          {testimonial.role && (
            <p className="text-[color:var(--bz-ink-subtle,#6b6b70)] text-xs">{testimonial.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
