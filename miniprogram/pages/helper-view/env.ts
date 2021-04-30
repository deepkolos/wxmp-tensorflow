const { platform } = wx.getSystemInfoSync()

export const isIos = platform === 'ios'
export const isAndroid = platform === 'android'