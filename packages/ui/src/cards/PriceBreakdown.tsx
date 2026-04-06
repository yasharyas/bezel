import { IndianRupee, Receipt, Percent } from "lucide-react"

interface PriceBreakdownProps {
  price: number
  gstPercent: number
  priceLabel?: string
}

export function PriceBreakdown({
  price,
  gstPercent,
  priceLabel = "Base Price",
}: PriceBreakdownProps) {
  const validPrice = Number.isFinite(price) && price > 0 ? price : 0
  const validGst = Number.isFinite(gstPercent) && gstPercent >= 0 ? gstPercent : 0

  if (validPrice === 0) return null

  const gstAmount = validPrice * (validGst / 100)
  const totalPrice = validPrice + gstAmount

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        <Receipt className="h-4 w-4" />
        Price Breakdown
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            {priceLabel}
          </span>
          <span className="font-medium">
            ₹{validPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Percent className="h-3.5 w-3.5" />
            GST ({validGst}%)
          </span>
          <span className="font-medium">
            {gstAmount > 0
              ? `₹${gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </span>
        </div>

        <div className="border-t" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total Price</span>
          <span className="text-lg font-bold text-primary">
            ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}
