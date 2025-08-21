import 'express';
import type { File as MulterFile } from 'multer';

declare module 'express-serve-static-core' {
  interface Request {
    file?: MulterFile;
    files?: MulterFile[];
  }
} 