-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'BANK_TRANSFER';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'MAD';

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "currency" SET DEFAULT 'MAD';

