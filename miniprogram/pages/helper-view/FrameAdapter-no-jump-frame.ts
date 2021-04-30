export interface Frame {
  data: ArrayBuffer
  width: number
  height: number
}

export class FrameAdapter {
  currFrame!: Frame;
  currFrameReachTime!: number;
  processing!: boolean;
  enable = true;
  frameProcesser!: (frame: Frame) => Promise<any>;

  constructor() { }

  onProcessFrame(cb: (frame: Frame) => Promise<any>) {
    this.frameProcesser = cb;
  }

  triggerFrame(frame: Frame) {
    this.currFrame = frame
    this.currFrameReachTime = Date.now()
    if (!this.enable || this.processing) return
    this.processFrame()
    // this.canvas.requestAnimationFrame(() => this.processFrame())
  }

  async processFrame() {
    const frame = this.currFrame
    this.processing = true
    try {
      await this.frameProcesser?.(frame)
      this.processing = false
    } catch (error) {
      console.error(error)
      this.enable = false
    }
  }
}
