
import axios from 'axios';
import { _getCookie, _setCookie } from './Session';
// import { _getCookie } from './Session';
// 创建axios默认请求
// axios.defaults.baseURL = 'http://iot.symgrid.com';
// 配置超时时间
axios.defaults.timeout = 100000;
// 配置请求拦截
axios.interceptors.request.use((config) => {
  // config.headers.common['auto_token'] = _getCookie('auto_token');
  // config.headers.common['full_name'] = _getCookie('full_name');
  // config.headers.common['sid'] = _getCookie('sid');
  // config.headers.common['system'] = _getCookie('system');
  // config.headers.common['user_id'] = _getCookie('user_id');
  // config.headers.common['user_image'] = _getCookie('user_image');
  return config;
});

// 添加响应拦截器
axios.interceptors.response.use(
  function (response) {
    console.log(response)
    const cookie  = response.headers.cookie;
    // console.log(cookie)
    const arr = cookie && cookie.length > 0 ? cookie.split(';') : [];
    console.log(arr)
    let obj = {};
    arr && arr.length > 0 && arr.map(item=>{
      obj[item.split('=')[0].trim()] = item.split('=')[1];
    })
    // console.log(arr)
    console.log(obj)
    if (obj.sid === 'Guest' || response.data.error === 'auth_code_missing'){
      _setCookie('T&R_auth_token', '')
      window.location.href = '/'
    }
    // if (obj.sid === 'Guest' || obj.sid === ''){
    //   console.log('sssssss')
    //   document.cookie = ''
    //   _setCookie('T&R_auth_token', '')
    // }
    return response;
  },
  function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);
/**
 * get请求
 * @method get
 * @param {url, params, loading} 请求地址，请求参数，是否需要加载层
 */
var get = function (url, params) {
  return new Promise((resolve, reject) => {
    // {
    //   params: params
    // }
    axios(url, {
        method: 'get',
        data: params,
        headers: {
            Accept: 'application/json; charset=utf-8',
            'Content-Type': 'application/json; charset=utf-8',
            'dataType': 'json',
            'X-Frappe-CSRF-Token': _getCookie('T&R_auth_token') || ''
        }
    }).then(res=>{
        resolve(res.data)
    }).catch(err=>{
      reject(err)
    })
  });
};
/**
 * post请求
 * @method post
 * @param {url, params} 请求地址，请求参数，是否需要加载层
 */
var post = function (url, data) {
  return new Promise((resolve, reject) => {
    // qs.stringify(data)
    axios(url, {
          method: 'post',
          data: data,
          headers: {
              Accept: 'application/json; charset=utf-8',
              'Content-Type': 'application/json; charset=UTF-8',
              'dataType': 'json'
          }
      }).then(res=>{
          resolve(res.data)
      }).catch(err=>{
        reject(err)
      })
  });
};
var form = function (url, data) {
    return new Promise((resolve, reject) => {
        // qs.stringify(data)
        axios(url, {
            method: 'post',
            data: data,
            headers: {
                Accept: 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Type': false,
                'dataType': 'json'
            }
        }).then(res=>{
            resolve(res.data)
        }).catch(err=>{
            reject(err)
        })
    });
};

var postToken = function (url, data) {
  return new Promise((resolve, reject) => {
    const token = _getCookie('T&R_auth_token');
    // qs.stringify(data)
    axios(url, {
          method: 'post',
          data: data,
          headers: {
              Accept: 'application/json; charset=utf-8',
              'Content-Type': 'application/json; charset=UTF-8',
              'dataType': 'json',
              'X-Frappe-CSRF-Token': token
          }
      }).then(res=>{
          resolve(res.data)
      }).catch(err=>{
        reject(err)
      })
  });
};
export default { get, post, postToken, form };