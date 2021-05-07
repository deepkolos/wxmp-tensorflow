# wxmp-tensorflow

微信小程序下运行最新`TensorFlow`的工程解决方案，有以下特点

0. 运行 balzeface 安卓 √，IOS √
1. 运行 face-landmarks 安卓 √，IOS √
2. 集成 tfjsPlugin，方便使用，无需二次引用 √
3. 支持 wasm backend √
4. 运行 posenet (例子是 mobilenet 0.50 stride16) √
5. custom tfjs 减少包体积 blazeface 例子 √

<img width="120" src="https://upload-images.jianshu.io/upload_images/252050-c99071dc4bf61185.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" />

### 性能数据

| 机器     | 模型      | FPS | Backend |
| -------- | --------- | --- | ------- |
| MI 8     | BlazeFace | 20  | WebGL   |
| MI 8     | BlazeFace | 17  | WASM    |
| IPhone 7 | BlazeFace | 12  | WebGL   |
| IPhone 7 | BlazeFace | 1   | WASM    |

> 注：WASM 为非 SIMD 版，安卓微信小程序运行 SIMD WASM 报错

### 问题

0. ios async 版本会卡 async await，所以改为 sync 版本，并且其他用到 async await 也可能出现（IOS下Promise是setTimeout模拟的，见[小程序JavaScript支持情况](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/js-support.html)）
1. wasm 只有在华为手机上比 webgl 好 (2.7 测试的结果)

### TODO

0. postnet
1. 体验小程序码
2. 结果UI美化

### 运行

```sh
> pnpm i / npm i / yarn
> npm run dev
# 使用小程序开发工具打开，替换appid为测试appid，不校验域名

# 编写custom tfjs，例子是仅仅blazeface可用tf + webgl backend 小程序包从 985KB下降到534KB (js大概下降234KB)
> npm run make-custom
> npm run build-custom
```

### 使用 custom_tfjs 进一步优化包大小

请参考

0. [[962K -> 347K] TensorflowJS 基于 Runtime 结果的 TreeShaking](https://juejin.cn/post/6947198156987711524/)
1. [https://github.com/mattsoulanille/tfjs_custom_module_demo](https://github.com/mattsoulanille/tfjs_custom_module_demo)
2. [https://github.com/deepkolos/tfjs-treeshaking-test](https://github.com/deepkolos/tfjs-treeshaking-test)

## 赞助

如果项目对您有帮助或者有适配需求，欢迎打赏

<img src="https://upload-images.jianshu.io/upload_images/252050-d3d6bfdb1bb06ddd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" alt="赞赏码" width="300">
