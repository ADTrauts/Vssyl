-- Add installedBy column to business_module_installations
ALTER TABLE "business_module_installations" ADD COLUMN "installedBy" TEXT;

-- Add index for performance
CREATE INDEX "business_module_installations_installedBy_idx" ON "business_module_installations"("installedBy");

-- Add foreign key constraint (optional, for data integrity)
-- Note: This is commented out because installedBy can be NULL for existing records
-- ALTER TABLE "business_module_installations" ADD CONSTRAINT "business_module_installations_installedBy_fkey" FOREIGN KEY ("installedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

