/// <reference types="vite/client" />
export = FFT;
declare function FFT(size: any): void;
declare class FFT {
  constructor(size: any);
  size: number;
  table: any[];
  createComplexArray(): any[];
  transform(out: any, data: any): void;
}
