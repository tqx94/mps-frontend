-- CreateEnum
CREATE TYPE "public"."MemberType" AS ENUM ('STUDENT', 'MEMBER', 'TUTOR');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENT', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('NA', 'PENDING', 'VERIFIED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "memberType" "public"."MemberType" NOT NULL DEFAULT 'MEMBER',
    "contactNumber" TEXT,
    "studentVerificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'NA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" UUID NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "userId" UUID,
    "location" TEXT NOT NULL,
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "specialRequests" TEXT,
    "seatNumbers" TEXT[],
    "pax" INTEGER NOT NULL,
    "students" INTEGER NOT NULL,
    "members" INTEGER NOT NULL,
    "tutors" INTEGER NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "discountId" UUID,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "memberType" "public"."MemberType" NOT NULL,
    "bookedForEmails" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Discount" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "public"."DiscountType" NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "availableQty" INTEGER,
    "eligibleMember" "public"."MemberType",
    "perUserOnce" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscountRedemption" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "bookingId" UUID,
    "amountDiscounted" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PassProduct" (
    "id" UUID NOT NULL,
    "packageName" TEXT NOT NULL,
    "typeOfPass" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "availableQty" INTEGER,
    "eligibleMember" "public"."MemberType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPass" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "packageName" TEXT,
    "typeOfPass" TEXT,
    "durationMinutes" INTEGER,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "remainingQuantity" INTEGER NOT NULL DEFAULT 1,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "memberType" "public"."MemberType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingPassUse" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userPassId" UUID NOT NULL,
    "minutesApplied" INTEGER,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPassUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_memberType_idx" ON "public"."User"("memberType");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "public"."Booking"("bookingRef");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_startAt_idx" ON "public"."Booking"("startAt");

-- CreateIndex
CREATE INDEX "Booking_endAt_idx" ON "public"."Booking"("endAt");

-- CreateIndex
CREATE INDEX "Booking_discountId_idx" ON "public"."Booking"("discountId");

-- CreateIndex
CREATE INDEX "Booking_userId_startAt_idx" ON "public"."Booking"("userId", "startAt");

-- CreateIndex
CREATE INDEX "Booking_startAt_endAt_idx" ON "public"."Booking"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "public"."Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_isActive_activeFrom_activeTo_idx" ON "public"."Discount"("isActive", "activeFrom", "activeTo");

-- CreateIndex
CREATE INDEX "Discount_eligibleMember_idx" ON "public"."Discount"("eligibleMember");

-- CreateIndex
CREATE INDEX "DiscountRedemption_userId_idx" ON "public"."DiscountRedemption"("userId");

-- CreateIndex
CREATE INDEX "DiscountRedemption_discountId_idx" ON "public"."DiscountRedemption"("discountId");

-- CreateIndex
CREATE INDEX "DiscountRedemption_bookingId_idx" ON "public"."DiscountRedemption"("bookingId");

-- CreateIndex
CREATE INDEX "PassProduct_isActive_activeFrom_activeTo_idx" ON "public"."PassProduct"("isActive", "activeFrom", "activeTo");

-- CreateIndex
CREATE INDEX "PassProduct_eligibleMember_idx" ON "public"."PassProduct"("eligibleMember");

-- CreateIndex
CREATE INDEX "UserPass_userId_idx" ON "public"."UserPass"("userId");

-- CreateIndex
CREATE INDEX "UserPass_productId_idx" ON "public"."UserPass"("productId");

-- CreateIndex
CREATE INDEX "UserPass_isActive_idx" ON "public"."UserPass"("isActive");

-- CreateIndex
CREATE INDEX "BookingPassUse_bookingId_idx" ON "public"."BookingPassUse"("bookingId");

-- CreateIndex
CREATE INDEX "BookingPassUse_userPassId_idx" ON "public"."BookingPassUse"("userPassId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPassUse_bookingId_userPassId_key" ON "public"."BookingPassUse"("bookingId", "userPassId");

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscountRedemption" ADD CONSTRAINT "DiscountRedemption_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPass" ADD CONSTRAINT "UserPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPass" ADD CONSTRAINT "UserPass_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."PassProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingPassUse" ADD CONSTRAINT "BookingPassUse_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingPassUse" ADD CONSTRAINT "BookingPassUse_userPassId_fkey" FOREIGN KEY ("userPassId") REFERENCES "public"."UserPass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
