<!--
Update Rules for databaseContext.md
- Only updated for schema changes, new models, or best practices.
- All changes should be atomic and well-documented.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Database Context

## Schema File Location
⚠️ CRITICAL REQUIREMENT: The database schema file MUST be located at `/prisma/schema.prisma` (root level).
- DO NOT create schema files in other locations
- DO NOT create schema files in server/prisma/
- DO NOT create schema files in any other directories
- This is a critical architectural requirement to prevent schema conflicts and ensure proper database management

## Schema Management
- All database schema changes must be made in the root `/prisma/schema.prisma` file
- After schema changes, run `prisma generate` to update the Prisma Client
- Create migrations using `prisma migrate dev` when schema changes are made
- Keep the schema file in sync with the database using `prisma db push` when needed

## Database Models
- Users table for authentication
- Modules table for installed modules
- ModuleSettings table for configuration
- ModuleData table for module-specific data
- Activities table for audit log
- Marketplace table for available modules
- OAuth clients and tokens

## Best Practices
1. Always use the root schema file for changes
2. Keep schema changes atomic and well-documented
3. Test migrations before applying to production
4. Maintain backward compatibility when possible
5. Document any breaking changes in the schema 