import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import sucrase from '@rollup/plugin-sucrase';
import alias from '@rollup/plugin-alias';

const p = s => path.resolve(__dirname, s);
const useCustomTFjs = process.argv.includes('--customtfjs');
const isDev = process.argv.includes('-w');

function codeTransform() {
  return {
    transform(code, file) {
      // 因为tfhub需要翻墙，所以构建时替换地址
      code = code
        .replace('fromTFHub:', 'fromTFHub_:')
        .replace(
          'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1',
          'https://cdn.static.oppenlab.com/weblf/test/blazeface/model.json',
        );
      // 修复tfjs的webgl版本检测
      code = code.replace(`isWebGLVersionEnabled(2)`, `false`);
      code = code.replace(`isWebGLVersionEnabled(1)`, `true`);
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

export default [
  {
    input: [
      './miniprogram/pages/blazeface/blazeface.ts',
      './miniprogram/pages/face-landmarks/face-landmarks.ts',
      './miniprogram/pages/posenet/posenet.ts',
      './miniprogram/pages/helper-view/helper-view.ts',
    ],
    treeshake: true,
    output: {
      format: 'cjs', // 小程序大文件不会把esm转cjs
      dir: 'miniprogram/',
      chunkFileNames: 'chunks/[name].js',
      entryFileNames: 'pages/[name]/[name].js',
      manualChunks: {
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
      builtins(),
      commonjs(),
      // sucrase({ transforms: ['typescript'] }),
      esbuild({
        sourceMap: false,
        minify: !isDev,
        target: 'es2018',
        legalComments: 'none',
      }),
      terser({
        output: { comments: false },
        mangle: !isDev,
        compress: !isDev, // { typeofs: false }
      }),
      resolve({
        extensions: ['.ts', '.js'],
        preferBuiltins: false,
        mainFields: ['jsnext:main', 'jsnext', 'module', 'main'],
      }),
      useCustomTFjs &&
        alias({
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
          ],
        }),
    ],
  },
];
