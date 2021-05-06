// miniprogram/pages/blazeface/blazeface.js
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// import * as faceLandmarksDetection from '../../../tfjs-models/face-landmarks';
import * as posenet from '../../../tfjs-models-sync/posenet';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view'
import { drawPoses } from './util';

const POSENET_URL =
  'https://www.gstaticcnapps.cn/tfjs-models/savedmodel/posenet/mobilenet/float/050/model-stride16.json';

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

    const onFrame = (frame, deps: Deps) => {
      const { ctx } = deps;
      const video = {
        width: frame.width,
        height: frame.height,
        data: new Uint8Array(frame.data),
      }
      const t = Date.now()
      // @ts-ignore
      const prediction = model.estimateSinglePose(video, { flipHorizontal: false })
      console.log('predict cost', Date.now() - t)

      helper.drawCanvas2D(frame);
      drawPoses([prediction], ctx)
    }

    helper.set({ onFrame });
    this.helper = helper;
  },

  onShow: function () {
    this.helper?.start();
  },

  onHide: function () {
    this.helper?.stop();
  },

  onUnload: function () { },
});
