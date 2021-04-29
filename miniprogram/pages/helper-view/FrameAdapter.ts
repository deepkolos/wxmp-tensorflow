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

  constructor(public consumer: (frame: Frame) => Promise<void>) { }

  onFrame(frame: Frame) {
    this.currFrame = frame
    this.currFrameReachTime = Date.now()
    this.processFrame()
  }

  async processFrame() {
    if (!this.enable || this.processing) return

    const frame = this.currFrame
    this.processing = true
    try {
      await this.consumer(frame)
      this.processing = false
    } catch (error) {
      console.error(error)
      this.enable = false
    }
  }
}
