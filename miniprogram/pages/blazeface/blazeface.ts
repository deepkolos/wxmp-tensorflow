// miniprogram/pages/blazeface/blazeface.js
// import * as blazeface from '../../../tfjs-models/blazeface';
import * as blazeface from '../../../tfjs-models-sync/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view';
import { Frame } from '../helper-view/FrameAdapter';

Page({
  helper: null as any,

  async onReady() {
    console.log('blazeface onReady');
    await tf.ready();
    console.log('tf ready');
    const helper = this.selectComponent('#helper');
    console.log('blazeface load start');
    const model = await blazeface.load();
    console.log('blazeface load end');
    let profiled = false;
    const onFrame = (frame: Frame, deps: Deps) => {
      const { ctx } = deps;
      const video = {
        width: frame.width,
        height: frame.height,
        data: new Uint8Array(frame.data),
      };
      // const video: tf.Tensor = tf.tidy(() => {
      //   const temp = tf.tensor(new Uint8Array(frame.data), [frame.height, frame.width, 4]);
      //   return tf.slice(temp, [0, 0, 0], [-1, -1, 3]);
      // });

      const returnTensors = false;
      const flipHorizontal = false;
      const annotateBoxes = true;
      // 用于CustomTFJS
      let predictions;
      const t = Date.now();
      if (!profiled) {
        tf.profile(() => {
          // @ts-ignore
          predictions = model.estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes);
        }).then(e => {
          console.log(e.kernelNames);
        });
        profiled = true
      } else {
        // @ts-ignore
        predictions = model.estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes);
      }
      console.log('predict cost', Date.now() - t);

      helper.drawCanvas2D(frame);

      // console.log(predictions.length)
      if (predictions.length > 0) {
        for (let i = 0; i < predictions.length; i++) {
          if (returnTensors) {
            predictions[i].topLeft = predictions[i].topLeft.arraySync();
            predictions[i].bottomRight = predictions[i].bottomRight.arraySync();
            if (annotateBoxes) {
              predictions[i].landmarks = predictions[i].landmarks.arraySync();
            }
          }

          const start = predictions[i].topLeft;
          const end = predictions[i].bottomRight;
          const size = [end[0] - start[0], end[1] - start[1]];
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.fillRect(start[0], start[1], size[0], size[1]);

          if (annotateBoxes) {
            const landmarks = predictions[i].landmarks;

            ctx.fillStyle = 'blue';
            for (let j = 0; j < landmarks.length; j++) {
              const x = landmarks[j][0];
              const y = landmarks[j][1];
              ctx.fillRect(x, y, 5, 5);
            }
          }
        }
      }
    };

    helper.set({ onFrame });
    this.helper = helper;
  },

  onShow: function () {
    this.helper?.start();
  },

  onHide: function () {
    this.helper?.stop();
  },

  onUnload: function () {},

  onShareAppMessage: function () {},
});
