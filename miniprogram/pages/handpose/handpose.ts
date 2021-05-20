import * as handpose from '../../../tfjs-models-sync/handpose';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view';
import { onePixel } from '../helper-view/utils';
import { drawKeypoints } from './utils'

Page({
  helper: null as any,

  async onReady() {
    await tf.ready();
    const helper = this.selectComponent('#helper');
    const model = await handpose.load();
    console.log('handpose load end');
    const t = Date.now();
    // @ts-ignore
    model.estimateHands(onePixel, false);
    console.log('handpose warm up', Date.now() - t);

    let initCanvas = false;

    const onFrame = (frame, deps: Deps) => {
      const { ctx, canvas2D } = deps;
      const video = {
        width: frame.width,
        height: frame.height,
        data: new Uint8Array(frame.data),
      };
      
      if (!initCanvas) {
        ctx.strokeStyle = 'red';
        ctx.fillStyle = 'red';

        ctx.translate(canvas2D.width, 0);
        ctx.scale(-1, 1);
        initCanvas = true;
      }

      helper.drawCanvas2D(frame);

      const t = Date.now();
      // @ts-ignore
      const predictions = model.estimateHands(video, false);
      console.log('predict cost', Date.now() - t);

      if (predictions.length > 0) {
        const result = predictions[0].landmarks;
        drawKeypoints(ctx, result);
      }
    };

    helper.set({ onFrame });
    this.helper = helper;
  },

  onShow () {
    this.helper?.start();
  },

  onHide () {
    this.helper?.stop();
  },

  onUnload () {},
  onShareAppMessage() {},
});
