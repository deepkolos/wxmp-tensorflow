import * as posenet from '../../../tfjs-models-sync/posenet';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view'
import { drawPoses } from './util';
import { onePixel } from '../helper-view/utils'

const POSENET_URL =
  // 'https://www.gstaticcnapps.cn/tfjs-models/savedmodel/posenet/mobilenet/float/050/model-stride16.json';
  // 'https://storage.googleapis.com/tfjs-models/savedmodel/posenet/mobilenet/float/050/model-stride16.json'
  'https://cdn.static.oppenlab.com/weblf/test/posenet-mobilenet-float-050/model-stride16.json'

Page({
  helper: null as any,

  async onReady() {
    await tf.ready()
    const helper = this.selectComponent('#helper');
    const model = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: 193,
      multiplier: 0.5,
      modelUrl: POSENET_URL
    });
    console.log('posenet load end')
    const t = Date.now()
    model.estimateSinglePose(onePixel, { flipHorizontal: false })
    console.log('posenet warm up', Date.now() - t)

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
      const prediction = model.estimateSinglePose(video, { flipHorizontal: false })
      console.log('predict cost', Date.now() - t)

      drawPoses([prediction], ctx)
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

  onUnload: function () {},
  onShareAppMessage() {},
});
