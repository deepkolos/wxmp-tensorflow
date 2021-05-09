export interface Frame {
  data: ArrayBuffer;
  width: number;
  height: number;
}

export class FrameAdapter {
  frameNum = 0;
  processFrameNum = 0;
  frameGap: number;
  frameProcesser?: (frame: Frame) => Promise<any>;
  lastProcessTime?: number;
  maxProcessFrame: number;
  currGap = 0;
  lastFrameDone = true;
  maxFrameCB?: () => void;

  constructor(maxProcessFrame = Number.MAX_SAFE_INTEGER, frameGap = 30) {
    this.frameGap = frameGap;
    this.maxProcessFrame = maxProcessFrame;
  }

  onProcessFrame(cb: (frame: Frame) => any) {
    this.frameProcesser = cb;
  }

  onMaxFrame(cb: () => void) {
    this.maxFrameCB = cb;
  }

  reset() {
    this.currGap = 0;
    this.frameNum = 0;
    this.processFrameNum = 0;
  }

  async triggerFrame(frame: Frame) {
    if (this.frameProcesser && this.processFrameNum < this.maxProcessFrame && this.lastFrameDone) {
      // console.log('triggerFrame', this.frameNum, Date.now())

      if (this.frameNum === 0 || this.lastProcessTime === undefined) {
        await this.processFrame(frame);
      } else {
        const gap = Math.max(Math.round(this.lastProcessTime / this.frameGap), 1);
        this.currGap = gap;
        if (this.frameNum >= gap) {
          await this.processFrame(frame);
          this.frameNum = 0;
        }
      }

      this.frameNum++;
    }

    if (this.processFrameNum === this.maxProcessFrame) {
      this.processFrameNum++;
      this.maxFrameCB?.();
    }
  }

  private async processFrame(frame: Frame) {
    if (this.frameProcesser) {
      this.lastFrameDone = false;
      const t = Date.now();
      // console.log('processFrame', this.frameNum, t)
      await this.frameProcesser(frame);
      this.lastFrameDone = true;
      // this.lastProcessTime = updateGap === false ? this.defaultProcessTime : Date.now() - t;
      this.lastProcessTime = Date.now() - t;
    }
    this.processFrameNum++;
  }
}
