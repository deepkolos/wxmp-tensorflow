'use strict';

var tfjs = require('../../chunks/tfjs.js');

class FrameAdapter {
  
  
  
  __init() {this.enable = true;}

  constructor( consumer) {this.consumer = consumer;FrameAdapter.prototype.__init.call(this); }

  onFrame(frame) {
    this.currFrame = frame;
    this.currFrameReachTime = Date.now();
    this.processFrame();
  }

  async processFrame() {
    if (!this.enable || this.processing) return

    const frame = this.currFrame;
    this.processing = true;
    try {
      await this.consumer(frame);
      this.processing = false;
    } catch (error) {
      console.error(error);
      this.enable = false;
    }
  }
}

function getNode(
  id,
  ctx,
) {
  return new Promise(resolve => {
    wx.createSelectorQuery().in(ctx).select(id).fields({ node: true, rect: true }).exec(resolve);
  });
}

/**
 * Implementation of atob() according to the HTML and Infra specs, except that
 * instead of throwing INVALID_CHARACTER_ERR we return null.
 */
function atob(data) {
  // Web IDL requires DOMStrings to just be converted using ECMAScript
  // ToString, which in our case amounts to using a template literal.
  data = `${data}`;
  // "Remove all ASCII whitespace from data."
  data = data.replace(/[ \t\n\f\r]/g, "");
  // "If data's length divides by 4 leaving no remainder, then: if data ends
  // with one or two U+003D (=) code points, then remove them from data."
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  }
  // "If data's length divides by 4 leaving a remainder of 1, then return
  // failure."
  //
  // "If data contains a code point that is not one of
  //
  // U+002B (+)
  // U+002F (/)
  // ASCII alphanumeric
  //
  // then return failure."
  if (data.length % 4 === 1 || /[^+/0-9A-Za-z]/.test(data)) {
    return null;
  }
  // "Let output be an empty byte sequence."
  let output = "";
  // "Let buffer be an empty buffer that can have bits appended to it."
  //
  // We append bits via left-shift and or.  accumulatedBits is used to track
  // when we've gotten to 24 bits.
  let buffer = 0;
  let accumulatedBits = 0;
  // "Let position be a position variable for data, initially pointing at the
  // start of data."
  //
  // "While position does not point past the end of data:"
  for (let i = 0; i < data.length; i++) {
    // "Find the code point pointed to by position in the second column of
    // Table 1: The Base 64 Alphabet of RFC 4648. Let n be the number given in
    // the first cell of the same row.
    //
    // "Append to buffer the six bits corresponding to n, most significant bit
    // first."
    //
    // atobLookup() implements the table from RFC 4648.
    buffer <<= 6;
    buffer |= atobLookup(data[i]);
    accumulatedBits += 6;
    // "If buffer has accumulated 24 bits, interpret them as three 8-bit
    // big-endian numbers. Append three bytes with values equal to those
    // numbers to output, in the same order, and then empty buffer."
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 0xff0000) >> 16);
      output += String.fromCharCode((buffer & 0xff00) >> 8);
      output += String.fromCharCode(buffer & 0xff);
      buffer = accumulatedBits = 0;
    }
    // "Advance position by 1."
  }
  // "If buffer is not empty, it contains either 12 or 18 bits. If it contains
  // 12 bits, then discard the last four and interpret the remaining eight as
  // an 8-bit big-endian number. If it contains 18 bits, then discard the last
  // two and interpret the remaining 16 as two 8-bit big-endian numbers. Append
  // the one or two bytes with values equal to those one or two numbers to
  // output, in the same order."
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 0xff00) >> 8);
    output += String.fromCharCode(buffer & 0xff);
  }
  // "Return output."
  return output;
}
/**
 * A lookup table for atob(), which converts an ASCII character to the
 * corresponding six-bit number.
 */

const keystr$1 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function atobLookup(chr) {
  const index = keystr$1.indexOf(chr);
  // Throw exception if character is not in the lookup string; should not be hit in tests
  return index < 0 ? undefined : index;
}

var atob_1 = atob;

/**
 * btoa() as defined by the HTML and Infra specs, which mostly just references
 * RFC 4648.
 */
function btoa(s) {
  let i;
  // String conversion as required by Web IDL.
  s = `${s}`;
  // "The btoa() method must throw an "InvalidCharacterError" DOMException if
  // data contains any character whose code point is greater than U+00FF."
  for (i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      return null;
    }
  }
  let out = "";
  for (i = 0; i < s.length; i += 3) {
    const groupsOfSix = [undefined, undefined, undefined, undefined];
    groupsOfSix[0] = s.charCodeAt(i) >> 2;
    groupsOfSix[1] = (s.charCodeAt(i) & 0x03) << 4;
    if (s.length > i + 1) {
      groupsOfSix[1] |= s.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (s.charCodeAt(i + 1) & 0x0f) << 2;
    }
    if (s.length > i + 2) {
      groupsOfSix[2] |= s.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = s.charCodeAt(i + 2) & 0x3f;
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === "undefined") {
        out += "=";
      } else {
        out += btoaLookup(groupsOfSix[j]);
      }
    }
  }
  return out;
}

/**
 * Lookup table for btoa(), which converts a six-bit number into the
 * corresponding ASCII character.
 */
const keystr =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function btoaLookup(index) {
  if (index >= 0 && index < 64) {
    return keystr[index];
  }

  // Throw INVALID_CHARACTER_ERR exception here -- won't be hit in the tests.
  return undefined;
}

var btoa_1 = btoa;

var abab = {
  atob: atob_1,
  btoa: btoa_1
};

var utf8Encodings = [
  'utf8',
  'utf-8',
  'unicode-1-1-utf-8'
];

function TextEncoder(encoding) {
  if (utf8Encodings.indexOf(encoding) < 0 && typeof encoding !== 'undefined' && encoding != null) {
    throw new RangeError('Invalid encoding type. Only utf-8 is supported');
  } else {
    this.encoding = 'utf-8';
    this.encode = function(str) {
      if (typeof str !== 'string') {
        throw new TypeError('passed argument must be of tye string');
      }
      var binstr = unescape(encodeURIComponent(str)),
        arr = new Uint8Array(binstr.length);
      const split = binstr.split('');
      for (let i = 0; i < split.length; i++) {
        arr[i] = split[i].charCodeAt(0);
      }
      return arr;
    };
  }
}

function TextDecoder(encoding) {
  if (utf8Encodings.indexOf(encoding) < 0 && typeof encoding !== 'undefined' && encoding != null) {
    throw new RangeError('Invalid encoding type. Only utf-8 is supported');
  }
  else {
    this.encoding = 'utf-8';
    this.decode = function (view, options) {
      if (typeof view === 'undefined') {
        return '';
      }

      var stream = (typeof options !== 'undefined' && stream in options) ? options.stream : false;
      if (typeof stream !== 'boolean') {
        throw new TypeError('stream option must be boolean');
      }

      if (!ArrayBuffer.isView(view)) {
        throw new TypeError('passed argument must be an array buffer view');
      } else {
        var arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
          charArr = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
          charArr[i] = String.fromCharCode(arr[i]);
        }
        return decodeURIComponent(escape(charArr.join('')));
      }
    };
  }
}

var textEncoder = {
  TextEncoder,
  TextDecoder,
};

let systemFetchFunc;

// Implement the WeChat Platform for TFJS
class PlatformWeChat  {
  constructor(fetchFunc) {
    systemFetchFunc = fetchFunc;
  }
  fetch(path, requestInits) {
    return systemFetchFunc(path, requestInits);
  }
  now() {
    return Date.now();
  }
  encode(text, encoding) {
    if (encoding !== 'utf-8' && encoding !== 'utf8') {
      throw new Error(
        `Browser's encoder only supports utf-8, but got ${encoding}`);
    }
    return new textEncoder.TextEncoder(encoding).encode(text);
  }
  decode(bytes, encoding) {
    return new textEncoder.TextDecoder(encoding).decode(bytes);
  }
}

const WECHAT_WEBGL_BACKEND_NAME = 'wechat-webgl';

/**
 * Setup the fetch polyfill and WebGL backend for WeChat.
 * @param config: SystemConfig object contains Tensorflow.js runtime, fetch
 *     polyfill and WeChat offline canvas.
 * @param debug: flag to enable/disable debugging.
 */
function setupWechatPlatform(config, debug = false) {
  const tf = config.tf ;
  const backendName = config.backendName || WECHAT_WEBGL_BACKEND_NAME;
  if (debug) {
    console.log(tf);
  }
  // Skip initialization if the backend has been set.
  if (tf.getBackend() === backendName) {
    return;
  }
  const webgl = config.webgl ;
  tf.ENV.setPlatform('wechat', new PlatformWeChat(config.fetchFunc));
  setBase64Methods(tf);
  if (config.webgl && config.canvas) {
    initWebGL(tf, webgl, config.canvas, backendName, debug);
  } else {
    console.log(
      'webgl backend is not initialized, ' +
      'please inject webgl backend and the offscreen canvas.');
  }
}

/**
 * Polyfill btoa and atob method on the global scope which will be used by
 * model parser.
 */
function setBase64Methods(tf) {
  tf.ENV.global.btoa = abab.btoa;
  tf.ENV.global.atob = abab.atob;
}
/**
 * Initialize webgl backend using the WebGLRenderingContext from the webgl
 * canvas node.
 * @param canvas: webgl canvas node container return from node selector.
 * @param platform: platform name where the mini app is running (ios, android,
 *     devtool).
 * @param debug: enable/disable debug logging.
 */
const BACKEND_PRIORITY = 2;
function initWebGL(
  // tslint:disable-next-line:no-any
  tf, webgl, canvas,
  backendName = WECHAT_WEBGL_BACKEND_NAME, debug = false) {
  if (tf.findBackend(backendName) == null) {
    const WEBGL_ATTRIBUTES = {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      depth: false,
      stencil: false,
      failIfMajorPerformanceCaveat: true
    };
    const gl = canvas.getContext('webgl', WEBGL_ATTRIBUTES);
    if (debug) {
      console.log('start backend registration');
    }
    webgl.setWebGLContext(1, gl);
    try {
      tf.registerBackend(backendName, () => {
        const context = new webgl.GPGPUContext(gl);
        return new webgl.MathBackendWebGL(context);
      }, BACKEND_PRIORITY);

      // Register all the webgl kernels on the rn-webgl backend
      const kernels = tf.getKernelsForBackend('webgl');
      kernels.forEach(kernelConfig => {
        const newKernelConfig = Object.assign({}, kernelConfig, { backendName });
        tf.registerKernel(newKernelConfig);
      });
    } catch (e) {
      throw (new Error(`Failed to register Webgl backend: ${e.message}`));
    }
  }
  tf.setBackend(backendName);
  if (debug) {
    console.log('current backend = ', tf.getBackend());
  }
}

const TEXT_FILE_EXTS = /\.(txt|json|html|txt|csv)/;

function parseResponse(url, res) {
  let header = res.header || {};
  header = Object.keys(header).reduce((map, key) => {
    map[key.toLowerCase()] = header[key];
    return map;
  }, {});
  return {
    ok: ((res.statusCode / 200) | 0) === 1, // 200-299
    status: res.statusCode,
    statusText: res.statusCode,
    url,
    clone: () => parseResponse(url, res),
    text: () =>
      Promise.resolve(
        typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
      ),
    json: () => {
      if (typeof res.data === 'object') return Promise.resolve(res.data);
      let json = {};
      try {
        json = JSON.parse(res.data);
      } catch (err) {
        console.error(err);
      }
      return Promise.resolve(json);
    },
    arrayBuffer: () => {
      return Promise.resolve(res.data);
    },
    headers: {
      keys: () => Object.keys(header),
      entries: () => {
        const all = [];
        for (const key in header) {
          if (header.hasOwnProperty(key)) {
            all.push([key, header[key]]);
          }
        }
        return all;
      },
      get: (n) => header[n.toLowerCase()],
      has: (n) => n.toLowerCase() in header
    }
  };
}

function fetchFunc(url, options) {
  options = options || {};
  const dataType = url.match(TEXT_FILE_EXTS) ? 'text' : 'arraybuffer';

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.body,
      header: options.headers,
      dataType,
      responseType: dataType,
      success: (resp) => resolve(parseResponse(url, resp)),
      fail: (err) => reject(err)
    });
  });
}

function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// components/helper-view/helper-view.js

setupWechatPlatform({
  fetchFunc,
  tf: tfjs.tf,
  webgl: tfjs.webgl,
  canvas: wx.createOffscreenCanvas()
});

/**
 * HelperView
 * 集成展示TensorFlow Demo常用的逻辑
 * 0. 从相机获取数据
 * 1. 编辑three场景
 * 2. 编辑2d canvas
 */

let deps












;

let userFrameCallback;



Component({
  properties: {
    cameraPosition: {
      type: String,
      value: 'front'
    }
  },

  data: {
    FPS: '0',
    usingCamera: false,
  },

  behaviors: ['wx://component-export'],
  export() {
    return {
      set(cfg) {
        userFrameCallback = cfg.onFrame;
      },
      drawCanvas2D(frame) {
        if (deps) {
          const { ctx, canvas2D } = deps;
          ctx.clearRect(0, 0, canvas2D.width, canvas2D.height);
          canvas2D.width = frame.width;
          canvas2D.height = frame.height;
          // @ts-ignore
          const imageData = canvas2D.createImageData(new Uint8Array(frame.data), frame.width, frame.height);
          ctx.putImageData(imageData, 0, 0);
        }
      },
      start() {
        // deps?.cameraListener.start();
      },
      stop() {
        // deps?.cameraListener.stop();
      },
    };
  },

  async ready() {
    console.log('helper view ready');
    const [{ node: canvasGL }] = await getNode('#gl', this);
    const [{ node: canvas2D }] = await getNode('#canvas', this);
    const [{ node: canvasInput }] = await getNode('#canvas-input', this);
    console.log('helper view get canvas node');

    // PLATFORM.set(new WechatPlatform(canvasGL));
    const ctx = canvas2D.getContext('2d') ;
    const inputCtx = canvasInput.getContext('2d') ;
    // const renderer = new WebGL1Renderer({ canvas: canvasGL, antialias: true });
    // const scene = new Scene();
    const cameraCtx = wx.createCameraContext();
    const frameAdapter = new FrameAdapter(async frame => {
      if (userFrameCallback) {
        const t = Date.now();
        console.log('trigger userFrameCallback');
        frame.data = frame.data.slice(0);
        await userFrameCallback(frame, deps);
        this.setData({ FPS: (1000 / (Date.now() - t)).toFixed(2) });
      }
    });
    const cameraListener = cameraCtx.onCameraFrame(frameAdapter.onFrame.bind(frameAdapter));

    deps = {
      ctx,
      inputCtx,
      // scene,
      canvasGL,
      canvas2D,
      canvasInput,
      // renderer,
      cameraCtx,
      frameAdapter,
      cameraListener,
    };
    // deps.cameraListener.start();
    this.triggerEvent('inited');
    console.log('helper view inited');
  },

  detached() {
    _optionalChain([deps, 'optionalAccess', _ => _.cameraListener, 'access', _2 => _2.stop, 'call', _3 => _3()]);
    // PLATFORM.dispose();
    // @ts-ignore
    deps = null;
    // @ts-ignore
    userFrameCallback = null;
  },

  methods: {
    onBtnUseCameraClick() {
      if (!deps) return
      if (this.data.usingCamera) {
        this.setData({ usingCamera: false });
        deps.cameraListener.stop();
      } else {
        this.setData({ usingCamera: true });
        deps.cameraListener.start();
      }
    },

    onBtnSelectClick() {
      if (!deps) return
      wx.chooseImage({
        count: 1,
        success: (res) => {
          const imgPath = res.tempFilePaths[0];
          Promise.all([
            new Promise((resolve) => {
              wx.getImageInfo({
                src: imgPath,
                success: resolve
              });
            }),
            new Promise((resolve) => {
              // @ts-ignore
              const img = deps.canvasInput.createImage();
              img.onload = () => resolve(img);
              img.src = imgPath;
            })
          ]).then(([{ width, height }, img]) => {
            deps.canvasInput.width = width;
            deps.canvasInput.height = height;
            deps.inputCtx.drawImage(img, 0, 0);
            const imgData = deps.inputCtx.getImageData(0, 0, width, height);
            _optionalChain([userFrameCallback, 'optionalCall', _4 => _4(imgData, deps)]);
          });
        }
      });
    }
  },
});
