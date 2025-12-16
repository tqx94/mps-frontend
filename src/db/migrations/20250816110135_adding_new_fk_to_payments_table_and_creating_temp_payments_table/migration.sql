/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "confirmedPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentId" UUID;

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL,
    "bookingRef" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "cost" DECIMAL(12,2),
    "discountCode" TEXT,
    "totalAmount" DECIMAL(12,2),
    "paidBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_paymentId_key" ON "public"."Booking"("paymentId");

-- CreateIndex
CREATE INDEX "Booking_paymentId_idx" ON "public"."Booking"("paymentId");

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
