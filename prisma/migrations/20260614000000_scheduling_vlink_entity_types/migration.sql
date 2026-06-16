-- Scheduling CO-09 / G13: V_Link entity types for schedule, shift, and swap request

ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'SCHEDULE';
ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'SCHEDULE_SHIFT';
ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'SHIFT_SWAP_REQUEST';
