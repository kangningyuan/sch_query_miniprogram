const app = getApp()
const DEBOUNCE_TIME = 400
const debounce = require('../../utils/debounce');

Page({

  data: {
    isLoading: true,
    searchResults: [],
    resultCount: 0,
    allDataLength: 0
  },

  onLoad() {
    this.loadAllData()
  },

  async loadAllData() {
    try {
      const requests = [];
      const cacheBuster = Date.now(); // 生成唯一时间戳参数（共用）
      for (let i = 0; i < app.globalData.CHUNK_COUNT; i++) {
        const chunkId = i.toString().padStart(3, '0');
        requests.push(
          new Promise((resolve, reject) => {
            wx.request({
              url: `${app.globalData.CDN_BASE}/data/chunk_${chunkId}.json?_t=${cacheBuster}`,
              enableCache: false,
              success: resolve,
              fail: reject
            });
          })
        );
      }

      const res = await Promise.all(requests);
      app.globalData.allData = res.flatMap(r => r.data);
      this.setData({
        allDataLength: app.globalData.allData.length,
        isLoading: false,
        allData: app.globalData.allData // 显式赋值
      });
    } catch (error) {
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      });
      this.setData({
        isLoading: false,
        allData: []
      }); // 数据加载失败时回退为空数组
    }
  },


  handleInput: debounce(function (e) {
    if (!this.data.allData || this.data.isLoading) {
      wx.showToast({
        title: '数据未加载完成',
        icon: 'none'
      });
      return;
    }

    const keyword = e.detail.value.trim().toLowerCase();
    const results = this.search(keyword);
    this.setData({
      searchResults: results,
      resultCount: results.length
    });
  }, DEBOUNCE_TIME),


  search(keyword) {
    // 新增空关键词判断
    if (!keyword || !this.data.allData) return [];

    return this.data.allData.reduce((results, item) => {
      if (!item || typeof item !== 'object') return results;

      try {
        const matchConditions = [
          item.base_id?.startsWith(keyword),
          item.name?.toLowerCase().includes(keyword),
          item.pinyin?.includes(keyword)
        ];

        if (matchConditions.some(Boolean)) {
          results.push(Object.assign({}, item)); // 返回数据副本避免污染
        }
      } catch (e) {
        console.warn('异常数据项:', item, e);
      }

      return results;
    }, []);
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '叔蘋奖学金得奖信息查询系统',
      path: '/pages/index/index',
      imageUrl: '/static/shuping_logo.webp',
      success: function(res) {
        console.log('分享成功', res);
      },
      fail: function(res) {
        console.log('分享失败', res);
      }
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '叔蘋奖学金得奖信息查询系统',
      path: '/pages/index/index',
      imageUrl: '/static/shuping_logo.webp',
      success: function(res) {
        console.log('分享到朋友圈成功', res);
      },
      fail: function(res) {
        console.log('分享到朋友圈失败', res);
      }
    }
  }

})