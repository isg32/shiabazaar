-- Threshold for the BI dashboard's "unusual discount" alert. Additive.
ALTER TABLE "business_settings" ADD COLUMN "unusualDiscountPct" INTEGER NOT NULL DEFAULT 20;
