import { createDetector, SupportedModels } from '../../../tfjs-models-sync/pose-detection/index';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view'
import { Painter } from '../movenet/painter';
import { onePixel } from '../helper-view/utils'

Page({
  helper: null as any,

  async onReady() {
    await tf.ready()
    const helper = this.selectComponent('#helper');
    const model = await createDetector(SupportedModels.BlazePose, { runtime: 'tfjs', modelType: 'lite' })
    console.log('blazepose load end')
    const t = Date.now()
    // @ts-ignore
    model.estimatePoses(onePixel, { flipHorizontal: false })
    console.log('blazepose warm up', Date.now() - t)
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
      const prediction = model.estimatePoses(video, { maxPoses:1, flipHorizontal: false })
      console.log('predict cost', Date.now() - t)

      painter.setCtx(ctx);
      // console.log(prediction)
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

  onUnload() { },
  onShareAppMessage() { },
});
