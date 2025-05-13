declare global {
  // Window extensions
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }

  // Custom type definitions
  type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };

  type Nullable<T> = T | null;

  type Optional<T> = T | undefined;

  type AsyncReturnType<T extends (...args: any) => Promise<any>> =
    T extends (...args: any) => Promise<infer R> ? R : any;

  type ValueOf<T> = T[keyof T];

  type RecordOf<K extends keyof any, T> = {
    [P in K]: T;
  };

  // Utility types
  type Awaited<T> = T extends Promise<infer R> ? R : T;

  type NonNullable<T> = T extends null | undefined ? never : T;

  type Required<T> = {
    [P in keyof T]-?: T[P];
  };

  type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  type Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  type Exclude<T, U> = T extends U ? never : T;

  type Extract<T, U> = T extends U ? T : never;

  type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

  // Module declarations
  declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
  }

  declare module '*.png' {
    const content: string;
    export default content;
  }

  declare module '*.jpg' {
    const content: string;
    export default content;
  }

  declare module '*.jpeg' {
    const content: string;
    export default content;
  }

  declare module '*.gif' {
    const content: string;
    export default content;
  }

  declare module '*.webp' {
    const content: string;
    export default content;
  }

  declare module '*.json' {
    const content: { [key: string]: any };
    export default content;
  }

  declare module '*.css' {
    const content: { [key: string]: string };
    export default content;
  }

  declare module '*.module.css' {
    const content: { [key: string]: string };
    export default content;
  }

  declare module '*.module.scss' {
    const content: { [key: string]: string };
    export default content;
  }
}

export {}; 