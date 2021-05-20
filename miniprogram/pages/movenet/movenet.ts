import { createDetector, SupportedModels, movenet } from '../../../tfjs-models-sync/pose-detection/index';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view'
import { Painter } from './painter';
import { onePixel } from '../helper-view/utils'

Page({
  helper: null as any,

  async onReady() {
    await tf.ready()
    const helper = this.selectComponent('#helper');
    const model = await createDetector(SupportedModels.MoveNet, { modelType: movenet.modelType.SINGLEPOSE_LIGHTNING })
    console.log('movenet load end')
    const t = Date.now()
    // @ts-ignore
    model.estimatePoses(onePixel, { flipHorizontal: false })
    console.log('movenet warm up', Date.now() - t)
    const painter = new Painter()

    const onFrame = (frame, deps: Deps) => {
      const { ctx } = deps;
      const video = {
        width: frame.width,
        height: frame.height,
        data: new Uint8Array(frame.data),
      }

      helper.drawCanvas2D(frame);

      const t = Date.now()
      // @ts-ignore
      const prediction = model.estimatePoses(video, { flipHorizontal: false })
      console.log('predict cost', Date.now() - t)

      painter.setCtx(ctx);
      painter.drawResults(prediction);
    }

    helper.set({ onFrame });
    this.helper = helper;
  },

  onShow() {
    this.helper?.start();
  },

  onHide() {
    this.helper?.stop();
  },

  onUnload() {},
  onShareAppMessage() {},
});
