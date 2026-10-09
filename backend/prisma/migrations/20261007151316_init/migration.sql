-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('AUTOMATIC', 'MANUAL', 'QUARTZ', 'SOLAR', 'KINETIC');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'UNISEX');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('CLOUDINARY', 'S3');

-- CreateEnum
CREATE TYPE "StockReason" AS ENUM ('INITIAL', 'RESTOCK', 'ADJUSTMENT', 'ORDER_RESERVED', 'ORDER_CANCELLED', 'ORDER_REFUNDED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'COD');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'LABEL_CREATED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'FAILED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" VARCHAR(80) NOT NULL,
    "lastName" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(30),
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" UUID NOT NULL,
    "userAgent" VARCHAR(255),
    "ip" VARCHAR(45),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" VARCHAR(40),
    "firstName" VARCHAR(80) NOT NULL,
    "lastName" VARCHAR(80) NOT NULL,
    "line1" VARCHAR(160) NOT NULL,
    "line2" VARCHAR(160),
    "city" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "brandId" UUID,
    "coverUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "shortDescription" VARCHAR(300),
    "description" TEXT NOT NULL,
    "reference" VARCHAR(60) NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "priceCents" INTEGER NOT NULL,
    "salePriceCents" INTEGER,
    "saleStartsAt" TIMESTAMP(3),
    "saleEndsAt" TIMESTAMP(3),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 3,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "gender" "Gender" NOT NULL DEFAULT 'UNISEX',
    "brandId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "collectionId" UUID,
    "movementType" "MovementType" NOT NULL,
    "caliber" VARCHAR(60),
    "caseMaterial" VARCHAR(60) NOT NULL,
    "strapMaterial" VARCHAR(60) NOT NULL,
    "color" VARCHAR(40) NOT NULL,
    "dialColor" VARCHAR(40),
    "diameterMm" DECIMAL(4,1) NOT NULL,
    "thicknessMm" DECIMAL(4,1),
    "lugWidthMm" INTEGER,
    "waterResistanceM" INTEGER NOT NULL,
    "glass" VARCHAR(60) NOT NULL,
    "powerReserveHours" INTEGER,
    "warrantyMonths" INTEGER NOT NULL DEFAULT 24,
    "extraSpecs" JSONB,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "provider" "StorageProvider" NOT NULL,
    "storageKey" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "alt" VARCHAR(160),
    "width" INTEGER,
    "height" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "StockReason" NOT NULL,
    "orderId" UUID,
    "actorId" UUID,
    "note" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "guestToken" VARCHAR(64),
    "couponId" UUID,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "wishlistId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "userId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "subtotalCents" INTEGER NOT NULL,
    "shippingCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "couponId" UUID,
    "couponCode" VARCHAR(40),
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB,
    "shippingMethodId" UUID,
    "shippingMethodName" VARCHAR(80) NOT NULL,
    "customerNote" VARCHAR(500),
    "idempotencyKey" VARCHAR(64),
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID,
    "productName" VARCHAR(160) NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "imageUrl" TEXT,
    "unitPriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "from" "OrderStatus",
    "to" "OrderStatus" NOT NULL,
    "note" VARCHAR(255),
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentId" VARCHAR(120),
    "amountCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "failureReason" VARCHAR(255),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "providerRefundId" VARCHAR(120),
    "amountCents" INTEGER NOT NULL,
    "reason" VARCHAR(255),
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "eventId" VARCHAR(120) NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "countries" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "carrier" VARCHAR(60) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "freeAboveCents" INTEGER,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "codAllowed" BOOLEAN NOT NULL DEFAULT false,
    "codFeeCents" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "carrier" VARCHAR(60) NOT NULL,
    "trackingNumber" VARCHAR(80),
    "trackingUrl" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" CITEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxDiscountCents" INTEGER,
    "minOrderCents" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" UUID NOT NULL,
    "couponId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_targets" (
    "id" UUID NOT NULL,
    "promotionId" UUID NOT NULL,
    "productId" UUID,
    "categoryId" UUID,
    "collectionId" UUID,

    CONSTRAINT "promotion_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(120),
    "comment" VARCHAR(2000) NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedById" UUID,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL,
    "to" VARCHAR(254) NOT NULL,
    "template" VARCHAR(60) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "providerMessageId" VARCHAR(120),
    "error" TEXT,
    "sendAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" VARCHAR(60) NOT NULL,
    "entity" VARCHAR(40) NOT NULL,
    "entityId" VARCHAR(60),
    "changes" JSONB,
    "ip" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_familyId_idx" ON "sessions"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_tokenHash_key" ON "user_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "user_tokens_userId_type_idx" ON "user_tokens"("userId", "type");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_position_idx" ON "categories"("parentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collections_brandId_idx" ON "collections"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_status_publishedAt_idx" ON "products"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "products_status_categoryId_idx" ON "products"("status", "categoryId");

-- CreateIndex
CREATE INDEX "products_status_brandId_idx" ON "products"("status", "brandId");

-- CreateIndex
CREATE INDEX "products_status_collectionId_idx" ON "products"("status", "collectionId");

-- CreateIndex
CREATE INDEX "products_status_priceCents_idx" ON "products"("status", "priceCents");

-- CreateIndex
CREATE INDEX "products_status_soldCount_idx" ON "products"("status", "soldCount" DESC);

-- CreateIndex
CREATE INDEX "products_movementType_idx" ON "products"("movementType");

-- CreateIndex
CREATE INDEX "products_color_idx" ON "products"("color");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");

-- CreateIndex
CREATE INDEX "product_images_productId_position_idx" ON "product_images"("productId", "position");

-- CreateIndex
CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "carts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_guestToken_key" ON "carts"("guestToken");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_userId_key" ON "wishlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlistId_productId_key" ON "wishlist_items"("wishlistId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "refunds_paymentId_idx" ON "refunds"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "shipping_methods_zoneId_isActive_idx" ON "shipping_methods"("zoneId", "isActive");

-- CreateIndex
CREATE INDEX "shipments_orderId_idx" ON "shipments"("orderId");

-- CreateIndex
CREATE INDEX "shipments_trackingNumber_idx" ON "shipments"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_isActive_expiresAt_idx" ON "coupons"("isActive", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_orderId_key" ON "coupon_redemptions"("orderId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_couponId_userId_idx" ON "coupon_redemptions"("couponId", "userId");

-- CreateIndex
CREATE INDEX "promotions_isActive_startsAt_endsAt_idx" ON "promotions"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "promotion_targets_productId_idx" ON "promotion_targets"("productId");

-- CreateIndex
CREATE INDEX "promotion_targets_categoryId_idx" ON "promotion_targets"("categoryId");

-- CreateIndex
CREATE INDEX "promotion_targets_collectionId_idx" ON "promotion_targets"("collectionId");

-- CreateIndex
CREATE INDEX "reviews_productId_status_createdAt_idx" ON "reviews"("productId", "status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_productId_key" ON "reviews"("userId", "productId");

-- CreateIndex
CREATE INDEX "email_outbox_status_sendAfter_idx" ON "email_outbox"("status", "sendAfter");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_targets" ADD CONSTRAINT "promotion_targets_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_targets" ADD CONSTRAINT "promotion_targets_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_targets" ADD CONSTRAINT "promotion_targets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_targets" ADD CONSTRAINT "promotion_targets_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ───── Contraintes métier et recherche (d'après extra.sql de la maquette, colonnes adaptées au nommage Prisma)
ALTER TABLE products
  ADD CONSTRAINT products_price_positive      CHECK ("priceCents" > 0),
  ADD CONSTRAINT products_sale_lt_price       CHECK ("salePriceCents" IS NULL OR ("salePriceCents" > 0 AND "salePriceCents" < "priceCents")),
  ADD CONSTRAINT products_stock_non_negative  CHECK (stock >= 0),
  ADD CONSTRAINT products_sale_window         CHECK ("saleStartsAt" IS NULL OR "saleEndsAt" IS NULL OR "saleStartsAt" < "saleEndsAt");

ALTER TABLE cart_items  ADD CONSTRAINT cart_items_qty      CHECK (quantity BETWEEN 1 AND 10);
ALTER TABLE order_items ADD CONSTRAINT order_items_qty     CHECK (quantity > 0 AND "unitPriceCents" >= 0);
ALTER TABLE orders      ADD CONSTRAINT orders_totals       CHECK ("totalCents" >= 0 AND "totalCents" = "subtotalCents" + "shippingCents" - "discountCents");
ALTER TABLE reviews     ADD CONSTRAINT reviews_rating      CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE coupons     ADD CONSTRAINT coupons_value       CHECK ((type = 'PERCENTAGE' AND value BETWEEN 1 AND 100) OR (type = 'FIXED_AMOUNT' AND value > 0));
ALTER TABLE payments    ADD CONSTRAINT payments_refund_lte CHECK ("refundedCents" <= "amountCents");

CREATE UNIQUE INDEX product_images_one_primary ON product_images ("productId") WHERE "isPrimary";
CREATE UNIQUE INDEX addresses_one_default      ON addresses ("userId")         WHERE "isDefault";

CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);
ALTER TABLE products ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('french', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('french', coalesce(reference, '') || ' ' || coalesce(sku, '')), 'A') ||
  setweight(to_tsvector('french', coalesce("shortDescription", '')), 'B') ||
  setweight(to_tsvector('french', coalesce(description, '')), 'C')
) STORED;
CREATE INDEX products_search_idx ON products USING gin (search_vector);
