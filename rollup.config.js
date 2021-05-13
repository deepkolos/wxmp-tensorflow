import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
// import sucrase from '@rollup/plugin-sucrase';
import alias from '@rollup/plugin-alias';
import copy from 'rollup-plugin-copy';

const p = s => path.resolve(__dirname, s);
const useCustom = process.argv.includes('--custom');
const isDev = process.argv.includes('-w');

function codeTransform() {
  return {
    transform(code, file) {
      // 注入环境变量
      code = code.replace(`import.meta.CUSTOM`, `${useCustom}`);

      // 因为tfhub需要翻墙，所以构建时替换地址
      code = code
        .replace(/fromTFHub:/g, 'fromTFHub_:')
        .replace(
          'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1',
          'https://cdn.static.oppenlab.com/weblf/test/blazeface/model.json',
        )
        .replace(
          'https://tfhub.dev/mediapipe/tfjs-model/handdetector/1/default/1',
          'https://cdn.static.oppenlab.com/weblf/test/handdetector_1_default_1/model.json',
        )
        .replace(
          'https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1',
          'https://cdn.static.oppenlab.com/weblf/test/handskeleton_1_default_1/model.json',
        )
        .replace(
          'https://tfhub.dev/mediapipe/tfjs-model/handskeleton/1/default/1/anchors.json?tfjs-format=file',
          'https://cdn.static.oppenlab.com/weblf/test/handpose/anchors.json',
        );
      // 修复tfjs的webgl版本检测
      // code = code.replace(`isWebGLVersionEnabled(2)`, `false`);
      // code = code.replace(`isWebGLVersionEnabled(1)`, `true`);
      // 修复wasm
      if (
        file.endsWith('tfjs-backend-wasm-threaded-simd.worker.js') ||
        file.endsWith('tfjs-backend-wasm-threaded-simd.js')
      ) {
        code = code.replace(`require("worker_threads")`, 'null');
        code = code.replace(`require("perf_hooks")`, 'null');
      }
      if (file.endsWith('backend_wasm.js')) {
        code = code.replace(`env().getAsync('WASM_HAS_SIMD_SUPPORT')`, 'false');
        code = code.replace(`env().getAsync('WASM_HAS_MULTITHREAD_SUPPORT')`, 'false');
        code = code.replace(
          `return (imports, callback) => {`,
          `return (imports, callback) => {
            WebAssembly.instantiate(path, imports).then(output => {
                callback(output.instance, output.module);
            });
            return {};`,
        );
      }
      code = code.replace(`WebAssembly.`, `WXWebAssembly.`);
      code = code.replace(`typeof WebAssembly`, `typeof WXWebAssembly`);
      return { code };
    },
  };
}

const aliasPlugin = useCustom
  ? alias({
      entries: [
        {
          find: /@tensorflow\/tfjs$/,
          replacement: p('./custom_tfjs/custom_tfjs.js'),
        },
        {
          find: /@tensorflow\/tfjs-core$/,
          replacement: p('./custom_tfjs/custom_tfjs_core.js'),
        },
        {
          find: '@tensorflow/tfjs-core/dist/ops/ops_for_converter',
          replacement: p('./custom_tfjs/custom_ops_for_converter.js'),
        },
        {
          find: /@tensorflow\/tfjs-backend-webgl$/,
          replacement: p('./custom_tfjs/custom_tfjs.js'),
        },
        {
          find: /@tensorflow\/tfjs-backend-wasm$/,
          replacement: p('./custom_tfjs/custom_tfjs.js'),
        },
      ],
    })
  : null;

export default [
  {
    input: useCustom
      ? [
          './miniprogram/pages/blazeface/blazeface.ts',
          './miniprogram/pages/helper-view/helper-view.ts',
        ]
      : [
          './miniprogram/pages/blazeface/blazeface.ts',
          './miniprogram/pages/face-landmarks/face-landmarks.ts',
          './miniprogram/pages/posenet/posenet.ts',
          './miniprogram/pages/handpose/handpose.ts',
          './miniprogram/pages/face-landmarks-68-tiny/face-landmarks-68-tiny.ts',
          './miniprogram/pages/helper-view/helper-view.ts',
        ],
    treeshake: true,
    output: {
      format: 'cjs', // 小程序大文件不会把esm转cjs
      dir: 'miniprogram/',
      chunkFileNames: 'chunks/[name].js',
      entryFileNames: 'pages/[name]/[name].js',
      manualChunks: useCustom
        ? {
            index: ['three-platformize'], // 其他页面空引用
            tfjs: [
              './custom_tfjs/custom_ops_for_converter.js',
              './custom_tfjs/custom_tfjs_core.js',
              './custom_tfjs/custom_tfjs.js',
            ],
          }
        : {
            // 'three-platformize': ['three-platformize'],
            tfjs: [
              '@tensorflow/tfjs-backend-webgl',
              '@tensorflow/tfjs-converter',
              '@tensorflow/tfjs-core',
            ],
            wasm: ['@tensorflow/tfjs-backend-wasm'],
            // blazeface: ['@tensorflow-models/blazeface'],
            // facemesh: ['@tensorflow-models/face-landmarks-detection'],
          },
    },
    plugins: [
      codeTransform(),
      aliasPlugin,
      builtins(),
      resolve({
        extensions: ['.ts', '.js'],
        preferBuiltins: false,
        mainFields: ['jsnext:main', 'jsnext', 'module', 'main'],
      }),
      commonjs({ include: ['node_modules/**'] }),
      esbuild({
        sourceMap: false,
        minify: !isDev,
        target: 'es2018',
        legalComments: 'none',
      }),
      // sucrase({ transforms: ['typescript'] }),
      // terser({
      //   output: { comments: false },
      //   mangle: !isDev,
      //   compress: !isDev, // { typeofs: false }
      // }),
      !useCustom
        ? copy({
            targets: [
              {
                src:
                  './node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/tfjs-backend-wasm.wasm',
                dest: 'miniprogram/',
              },
            ],
          })
        : null,
    ],
  },
];
