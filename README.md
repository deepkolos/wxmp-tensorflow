# wxmp-tensorflow

微信小程序下运行最新`TensorFlow`的工程解决方案，有以下特点

0. 运行 balzeface 安卓 √，IOS √
1. 运行 face-landmarks 安卓 √，IOS √
2. 集成 tfjsPlugin，方便使用，无需二次引用 √
3. 支持 wasm backend √ 给 tfjs 提的[PR](https://github.com/tensorflow/tfjs/pull/5056)已合并
4. 运行 posenet (例子是 mobilenet 0.50 stride16) √
5. custom tfjs 减少包体积 blazeface 例子 √
6. 运行 handpose √
7. 运行 movenet √

<img width="120" src="https://upload-images.jianshu.io/upload_images/252050-c99071dc4bf61185.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" />

> 注: Paddle.js 已适配百度小程序和微信小程序，https://github.com/PaddlePaddle/Paddle.js

### 性能数据

| 机器     | 模型      | FPS | Backend |
| -------- | --------- | --- | ------- |
| MI 8     | BlazeFace | 20  | WebGL   |
| MI 8     | BlazeFace | 17  | WASM    |
| IPhone 7 | BlazeFace | 12  | WebGL   |
| IPhone 7 | BlazeFace | 1   | WASM    |
| MI 8     | FaceLandMarks   | 20  | WebGL  |
| MI 8     | FaceLandMarks   | 10  | WASM   |
| MI 8     | PoseNet   | 20  | WebGL   |
| MI 8     | PoseNet   | 5   | WASM    |
| MI 8     | HandPose  | 14  | WebGL   |
| MI 8     | HandPose  | 1   | WASM    |
| MI 8     | MoveNet   | 14  | WebGL   |
| MI 8     | MoveNet   | 2.5 | WASM    |

> 注：WASM 为非 SIMD 版，安卓微信小程序运行 SIMD WASM 报错
> 虽说能跑，但是微信 IOS 上面问题多多，建议能 webview 还是 webview，性能好，gl 起码符合标准也无内存问题

### 问题

0. ios async 版本会卡 async await，所以改为 sync 版本，并且其他用到 async await 也可能出现（IOS 下 Promise 是 setTimeout 模拟的，见[小程序 JavaScript 支持情况](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/js-support.html)）**目前 ios 下比较容易卡初始化**
1. wasm 只有在华为手机上比 webgl 好 (2.7 测试的结果)

### 优化经验

0. 使用 FrameAdapter 动态跳帧处理
1. 正式处理数据前，预热处理一个空白帧，把所用到的 shader 编译
2. 利用 profile 生成 custom tfjs 优化包大小
3. 微信小程序 cameraFrame 的 ArrayBuffer 是复用的，可能推理完成后，内容就被更新了，所以先绘制背景，再绘制推理结果，另种解法是拿到相机帧时候复制一份(iPhone7 大概 0~5ms, 大部分是 1ms)

### TODO

0. 结果 UI 美化
1. face-api.js
2. warm up 通用化，根据已注册的 registerKernel 做 warm up

### 运行

```sh
> pnpm i / npm i / yarn
> npm run dev
# 使用小程序开发工具打开，替换appid为测试appid，不校验域名

# 使用custom tfjs编译，例子是仅仅blazeface可用tf + webgl backend 小程序包从 985KB下降到534KB (js大概下降234KB)
> npm run make-custom
> npm run build-custom
```

### 使用 custom_tfjs 进一步优化包大小

请参考

0. [[962K -> 347K] TensorflowJS 基于 Runtime 结果的 TreeShaking](https://juejin.cn/post/6947198156987711524/)
1. [https://github.com/mattsoulanille/tfjs_custom_module_demo](https://github.com/mattsoulanille/tfjs_custom_module_demo)
2. [https://github.com/deepkolos/tfjs-treeshaking-test](https://github.com/deepkolos/tfjs-treeshaking-test)

### tfjs-models async 转 sync 方法

只需要把读取数据部分的 async 方法比如`Tensor.array()`改为`Tensor.arraySync()`，或者`Tensor.buffer()`改为`Tensor.bufferSync()`，然后把`async`和`await`，`Promise.all`等关键字去除，即可

## 赞助

如果项目对您有帮助或者有适配需求，欢迎打赏

<img src="https://upload-images.jianshu.io/upload_images/252050-d3d6bfdb1bb06ddd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" alt="赞赏码" width="300">
