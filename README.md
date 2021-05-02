# wxmp-tensorflow

微信小程序下运行最新`TensorFlow`的工程解决办法，有以下特点

### TODO

0. 运行 balzeface 安卓 √，IOS √ 但卡
1. 运行 face-landmarks 安卓 √，IOS √ 但卡
2. 集成 tfjsPlugin，方便使用，无需二次引用 √
3. 支持 wasm backend √ ios 性能比 gl 慢很多，安卓上骁龙 wasm 一样比 gl 慢（安卓 WASM 不支持SIMD）

### 性能数据

| 机器     | 模型      | FPS | Backend |
| -------- | --------- | --- | ------- |
| MI 8     | BlazeFace | 20  | WebGL   |
| MI 8     | BlazeFace | 17  | WASM    |
| IPhone 7 | BlazeFace | 12  | WebGL   |
| IPhone 7 | BlazeFace | 1   | WASM    |

### 问题

0. ios async 版本会卡 async await，所以改为 sync 版本，并且其他用到 async await 也可能出现
1. wasm 只有在华为手机上比 webgl 好 (2.7 测试的结果)

### 使用 custom_tfjs 进一步优化包大小

请参考

0. [[962K -> 347K] TensorflowJS 基于 Runtime 结果的 TreeShaking](https://juejin.cn/post/6947198156987711524/)
1. [https://github.com/mattsoulanille/tfjs_custom_module_demo](https://github.com/mattsoulanille/tfjs_custom_module_demo)

## 赞助

如果项目对您有帮助或者有适配需求，欢迎打赏

<img src="https://upload-images.jianshu.io/upload_images/252050-d3d6bfdb1bb06ddd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240" alt="赞赏码" width="300">
