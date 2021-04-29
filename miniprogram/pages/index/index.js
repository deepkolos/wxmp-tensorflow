Page({
  data: {
    pages: [
      {
        title: 'Blazeface',
        href: '/pages/blazeface/blazeface',
      },
      {
        title: 'FaceLandMarks',
        href: '/pages/face-landmarks/face-landmarks',
      },
    ],
  },
  onBtnClick(e) {
    const { item } = e.target.dataset;
    wx.navigateTo({ url: item.href });
  },
});
