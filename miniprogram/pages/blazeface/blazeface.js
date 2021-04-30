'use strict';

var tfjs = require('../../chunks/tfjs.js');
var face = require('../../chunks/face.js');

const BLAZEFACE_MODEL_URL =
  'https://cdn.static.oppenlab.com/weblf/test/blazeface/model.json';










/**
 * Load blazeface.
 *
 * @param config A configuration object with the following properties:
 *  `maxFaces` The maximum number of faces returned by the model.
 *  `inputWidth` The width of the input image.
 *  `inputHeight` The height of the input image.
 *  `iouThreshold` The threshold for deciding whether boxes overlap too
 * much.
 *  `scoreThreshold` The threshold for deciding when to remove boxes based
 * on score.
 */
async function load({
  maxFaces = 10,
  inputWidth = 128,
  inputHeight = 128,
  iouThreshold = 0.3,
  scoreThreshold = 0.75,
  modelUrl,
} = {}) {
  let blazeface;
  if (modelUrl != null) {
    blazeface = await tfjs.loadGraphModel(modelUrl);
  } else {
    blazeface = await tfjs.loadGraphModel(BLAZEFACE_MODEL_URL, {
      fromTFHub_: true,
    });
  }

  const model = new face.BlazeFaceModel(
    blazeface,
    inputWidth,
    inputHeight,
    maxFaces,
    iouThreshold,
    scoreThreshold
  );
  return model;
}

function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// miniprogram/pages/blazeface/blazeface.js



Page({
  helper: null ,

  async onReady() {
    console.log('blazeface onReady');
    await tfjs.ready();
    console.log('tf ready');
    const helper = this.selectComponent('#helper');
    console.log('blazeface load start');
    const model = await load();
    console.log('blazeface load end');
    helper.set({
      onFrame: async (frame, deps) => {
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
        const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, annotateBoxes);

        helper.drawCanvas2D(frame);

        // console.log(predictions.length)
        if (predictions.length > 0) {
          for (let i = 0; i < predictions.length; i++) {

            const start = predictions[i].topLeft;
            const end = predictions[i].bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(start[0], start[1], size[0], size[1]);

            {
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
    _optionalChain([this, 'access', _ => _.helper, 'optionalAccess', _2 => _2.start, 'call', _3 => _3()]);
  },

  onHide: function () {
    _optionalChain([this, 'access', _4 => _4.helper, 'optionalAccess', _5 => _5.stop, 'call', _6 => _6()]);
  },

  onUnload: function () { },

  onShareAppMessage: function () { },
});
