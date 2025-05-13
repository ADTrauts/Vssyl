import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: User;
      _startAt?: [number, number];
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
      file?: Express.Multer.File;
      body: any;
      query: any;
      params: any;
    }

    interface Response {
      _header?: string;
      locals: {
        user?: User;
        [key: string]: any;
      };
    }

    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
    }
  }
} 