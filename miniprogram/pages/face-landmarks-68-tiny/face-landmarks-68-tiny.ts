import { FaceLandmark68TinyNet } from '../../../tfjs-models-async/face-api/faceLandmarkNet/FaceLandmark68TinyNet'
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view'
import { onePixel } from '../helper-view/utils'

Page({
  helper: null as any,

  async onReady() {
    await tf.ready()
    const helper = this.selectComponent('#helper');
    const model = new FaceLandmark68TinyNet()
    await model.loadFromUri('https://cdn.static.oppenlab.com/weblf/test/weights/face_landmark_68_model-weights_manifest.json')
    console.log('faceLandMarks68Tiny load end')
    const t = Date.now()
    const video: tf.Tensor = tf.tidy(() => {
      const temp = tf.tensor(new Uint8Array(onePixel.data), [onePixel.height, onePixel.width, 4]);
      return tf.slice(temp, [0, 0, 0], [-1, -1, 3]);
    });
    // video.print()
    // await model.detectLandmarks(video)
    // console.log('faceLandMarks68Tiny warm up', Date.now() - t)

    const onFrame = (frame, deps: Deps) => {
      const { ctx } = deps;
      // const video = {
      //   width: frame.width,
      //   height: frame.height,
      //   data: new Uint8Array(frame.data),
      // }
      const video: tf.Tensor = tf.tidy(() => {
        const temp = tf.tensor(new Uint8Array(frame.data), [frame.height, frame.width, 4]);
        return tf.slice(temp, [0, 0, 0], [-1, -1, 3]);
      });

      helper.drawCanvas2D(frame);

      const t = Date.now()
      const prediction = model.detectLandmarks(video)
      console.log('predict cost', Date.now() - t)

      // drawPoses([prediction], ctx)
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
