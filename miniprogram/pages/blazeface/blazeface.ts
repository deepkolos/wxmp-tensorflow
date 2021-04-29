// miniprogram/pages/blazeface/blazeface.js
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import { Deps } from '../helper-view/helper-view'

Page({
  helper: null as any,

  async onReady() {
    console.log('blazeface onReady')
    await tf.ready()
    console.log('tf ready')
    const helper = this.selectComponent('#helper');
    console.log('blazeface load start')
    const model = await blazeface.load();
    console.log('blazeface load end')
    helper.set({
      onFrame: async (frame, deps: Deps) => {
        const { ctx } = deps;
        const video = {
          width: frame.width,
          height: frame.height,
          data: new Uint8Array(frame.data),
        };
        const returnTensors = false;
        const flipHorizontal = false;
        const annotateBoxes = true;
        const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes)

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

      },
    });
    this.helper = helper;
  },

  onShow: function () {
    this.helper?.start();
  },

  onHide: function () {
    this.helper?.stop();
  },

  onUnload: function () { },

  onShareAppMessage: function () { },
});
