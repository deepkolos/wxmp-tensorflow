// @ts-nocheck
import { Environment } from './types';
import { fetchFunc } from '../../../tfjs-plugin/fetch';

class NOP {}

export function createWXMPEnv(): Environment {
  const fetch =
    fetchFunc ||
    function () {
      throw new Error('fetch - missing fetch implementation for browser environment');
    };

  const readFile = function () {
    throw new Error('readFile - filesystem not available for browser environment');
  };

  return {
    Canvas: NOP,
    CanvasRenderingContext2D: NOP,
    Image: NOP,
    ImageData: NOP,
    Video: NOP,
    createCanvasElement: NOP,
    createImageElement: NOP,
    fetch,
    readFile,
  };
}
