-- DropIndex
DROP INDEX "cart_items_cartId_productId_key";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "variantId" UUID;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "variantId" UUID,
ADD COLUMN     "variantLabel" VARCHAR(160);

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "variantId" UUID;

-- CreateTable
CREATE TABLE "product_options" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "id" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "colorHex" VARCHAR(7),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "priceCents" INTEGER,
    "salePriceCents" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_values" (
    "variantId" UUID NOT NULL,
    "optionValueId" UUID NOT NULL,

    CONSTRAINT "product_variant_values_pkey" PRIMARY KEY ("variantId","optionValueId")
);

-- CreateIndex
CREATE INDEX "product_options_productId_position_idx" ON "product_options"("productId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_productId_name_key" ON "product_options"("productId", "name");

-- CreateIndex
CREATE INDEX "product_option_values_optionId_position_idx" ON "product_option_values"("optionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_optionId_label_key" ON "product_option_values"("optionId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_productId_position_idx" ON "product_variants"("productId", "position");

-- CreateIndex
CREATE INDEX "product_variant_values_optionValueId_idx" ON "product_variant_values"("optionValueId");

-- CreateIndex
-- NULLS NOT DISTINCT : une seule ligne de panier par produit sans déclinaison.
CREATE UNIQUE INDEX "cart_items_cartId_productId_variantId_key" ON "cart_items"("cartId", "productId", "variantId") NULLS NOT DISTINCT;

-- CreateIndex
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ───────────── Règles métier (hors Prisma)
ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_stock_non_negative CHECK (stock >= 0),
  ADD CONSTRAINT product_variants_price_positive     CHECK ("priceCents" IS NULL OR "priceCents" > 0),
  ADD CONSTRAINT product_variants_sale_positive      CHECK ("salePriceCents" IS NULL OR "salePriceCents" > 0);
ALTER TABLE product_option_values
  ADD CONSTRAINT product_option_values_color_hex     CHECK ("colorHex" IS NULL OR "colorHex" ~ '^#[0-9A-Fa-f]{6}$');
