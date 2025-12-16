-- CreateEnum
CREATE TYPE "public"."BookingDiscountType" AS ENUM ('CREDIT', 'PASS', 'PROMO_CODE');

-- CreateEnum
CREATE TYPE "public"."BookingActionType" AS ENUM ('ORIGINAL_BOOKING', 'RESCHEDULE', 'EXTENSION', 'MODIFICATION');

-- CreateTable
CREATE TABLE "public"."BookingDiscountHistory" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID,
    "discountType" "public"."BookingDiscountType" NOT NULL,
    "actionType" "public"."BookingActionType" NOT NULL,
    "promoCodeId" UUID,
    "userPassId" UUID,
    "creditId" UUID,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDiscountHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingDiscountHistory_bookingId_idx" ON "public"."BookingDiscountHistory"("bookingId");

-- CreateIndex
CREATE INDEX "BookingDiscountHistory_userId_idx" ON "public"."BookingDiscountHistory"("userId");

-- CreateIndex
CREATE INDEX "BookingDiscountHistory_discountType_idx" ON "public"."BookingDiscountHistory"("discountType");

-- CreateIndex
CREATE INDEX "BookingDiscountHistory_actionType_idx" ON "public"."BookingDiscountHistory"("actionType");

-- CreateIndex
CREATE INDEX "BookingDiscountHistory_appliedAt_idx" ON "public"."BookingDiscountHistory"("appliedAt");

-- AddForeignKey
ALTER TABLE "public"."BookingDiscountHistory" ADD CONSTRAINT "BookingDiscountHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingDiscountHistory" ADD CONSTRAINT "BookingDiscountHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

