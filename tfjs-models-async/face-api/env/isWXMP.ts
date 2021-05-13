export function isWXMP(): boolean {
  return typeof wx === 'object' && typeof wx.getSystemInfoSync === 'function';
}
