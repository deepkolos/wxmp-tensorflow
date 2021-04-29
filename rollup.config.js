import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import sucrase from '@rollup/plugin-sucrase';

const p = s => path.resolve(__dirname, s);

const useCustomTFjs = process.argv.includes('--customtfjs');

function codeTransform() {
  return {
    transform(code) {
      // 移除注释
      // code = code.replace(/\/\*[\S\s]*\*\//g, '\n');
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
      return { code };
    },
  };
}

export default [
  {
    input: [
      './miniprogram/pages/blazeface/blazeface.ts',
      './miniprogram/pages/face-landmarks/face-landmarks.ts',
      './miniprogram/pages/helper-view/helper-view.ts',
      // './miniprogram/pages//.ts',
    ],
    treeshake: true,
    output: {
      format: 'cjs', // 小程序大文件不会把esm转cjs
      dir: 'miniprogram/',
      chunkFileNames: 'chunks/[name].js',
      entryFileNames: 'pages/[name]/[name].js',
      manualChunks: {
        'three-platformize': ['three-platformize'],
        tfjs: [
          '@tensorflow/tfjs-backend-webgl',
          '@tensorflow/tfjs-converter',
          '@tensorflow/tfjs-core',
        ],
      },
    },
    plugins: [
      builtins(),
      commonjs(),
      codeTransform(),
      sucrase({ transforms: ['typescript'] }),
      terser({ output: { comments: false } }),
      // esbuild({
      //   sourceMap: false,
      //   minify: true,
      //   target: 'es6',
      //   legalComments: 'none',
      // }),
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
