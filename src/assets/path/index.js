
import OEM from '../../assets/OEM';

module.exports = {
    api_path: 'http://127.0.0.1:8881', // node接口
    apis_path: OEM.IOEDomain, // 首页echarts接口
    store_assets_path: OEM.IOEDomain, //应用logo信息接口
    mqtt_local_path: 'ws://127.0.0.1:7884/mqtt', //mqtt本地地址
    mqtt_cloud_path: OEM.MQTTWS // mqtt云端地址
}