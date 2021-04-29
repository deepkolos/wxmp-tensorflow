export function getNode(
  id,
  ctx,
): Promise<[{ node: HTMLCanvasElement; width: number; height: Number }]> {
  return new Promise(resolve => {
    wx.createSelectorQuery().in(ctx).select(id).fields({ node: true, rect: true }).exec(resolve);
  });
}

export function objectFit(imgW, imgH, canW, canH) {
  let w, h;
  const canRatio = canW / canH;
  const imgRatio = imgW / imgH;

  if (canRatio > imgRatio) {
    w = canW;
    h = canW / imgRatio;
  } else {
    w = canH * imgRatio;
    h = canH;
  }

  return [w, h];
}

export const fetch = url =>
  new Promise((resolve, reject) => wx.request({ url, success: resolve, fail: reject }));
