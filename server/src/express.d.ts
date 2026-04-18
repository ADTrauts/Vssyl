import type { User as PrismaUser } from '@prisma/client';

// If JWTPayload is not exported, define it here to match index.ts
// interface JWTPayload {
//   id: string;
//   email: string;
//   name: string | null;
// }

// NOTE: To support JWT payloads, use a type guard or assertion in your code where needed.

declare global {
  namespace Express {
    interface User extends PrismaUser {
      id: string;
    }
    interface Request {
      user?: User;
      /** Attached by usage limit middleware (storage, subscription checks, etc.) */
      usageInfo?: unknown;
      /** Attached by feature gating when access is granted */
      featureAccess?: {
        featureName: string;
        hasAccess: boolean;
        usageInfo?: unknown;
      };
      /** Multer single-file upload */
      file?: Express.Multer.File;
      /** Multer multi-part uploads */
      files?:
        | Express.Multer.File[]
        | {
            [fieldname: string]: Express.Multer.File[];
          };
    }
  }
}

export {}; 