# Memory Bank README

## Purpose
The memory bank is the single source of truth for project context, requirements, architecture, technical decisions, progress, and ongoing work. It ensures continuity, clarity, and consistency for all contributors.

## General Update Rules
- Always date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents to any file over 200 lines.
- Summarize changes at the top of each file if the update is significant.

## File-Specific Update Rules

### projectbrief.md
- Only updated for major changes in project scope, vision, or core requirements.
- All changes must be reviewed and approved before updating.
- Should always reflect the single source of truth for project goals.

### productContext.md
- Updated when user experience goals, personas, or problem space evolve.
- Additions should be incremental and dated.
- Avoid duplicating requirements from projectbrief.md; instead, reference them.

### systemPatterns.md
- Updated when new architectural patterns, technical decisions, or design patterns are adopted.
- Each new pattern/decision should be clearly dated and described.
- Deprecated patterns should be moved to an "Archive" section at the end.

### techContext.md
- Updated when the tech stack, dependencies, or technical constraints change.
- All updates should be specific (e.g., "Upgraded Next.js from 14 to 15.3.0 on 2024-06-10").
- Avoid duplicating architectural patterns—reference systemPatterns.md if needed.

### activeContext.md
- Only contains the current work focus, recent changes, and next steps.
- When a phase is completed, move its details to progress.md and summarize the outcome.
- Should always be up-to-date and concise.

### progress.md
- Tracks what's done, what's left, and known issues.
- When a new phase starts, summarize the previous phase and move details to an archive section if needed.
- Avoid duplicating technical details—reference other files.

### databaseContext.md
- Only updated for schema changes, new models, or best practices.
- All changes should be atomic and well-documented.

### New/Context-Specific Files (e.g., UI Audit, Analytics Integration)
- Create a new file for any major, ongoing cross-cutting concern.
- Reference these files from activeContext.md and progress.md as needed.

## Consistency Practices
- All contributors must check both this README and file headers for update procedures.
- If in doubt, ask for review before making major changes.

## Memory Bank File Index (Required Reading)
- activeContext.md
- apiDocumentation.md
- compliance.md
- contributorGuide.md
- databaseContext.md
- deployment.md
- designPatterns.md
- futureIdeas.md
- moduleSpecs.md
- permissionsModel.md
- productContext.md
- progress.md
- projectbrief.md
- README.md
- systemPatterns.md
- techContext.md
- testingStrategy.md
