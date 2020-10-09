import React, { Component } from 'react';
import { Card, Button, message, Icon, Tag } from 'antd';
import { inject, observer} from 'mobx-react';
import { withRouter } from 'react-router-dom';
import http from '../../../utils/Server';
import axios from 'axios';
import echarts from 'echarts/lib/echarts';
import  'echarts/lib/chart/line';
import  'echarts/lib/chart/pie';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/tooltip';
import './style.scss';

import Upgrade from './Upgrade'
import SettingsEdit from './Edit'
import intl from 'react-intl-universal';

@withRouter
@inject('store')
@observer
class GatewaySettings extends Component {
    state = {
        skynet_version_list: [],
        skynet_latest_version: 0,
        freeioe_version_list: [],
        freeioe_latest_version: 0,
        loading: true,
        gateway: '',
        upgrading: false,
        showUpgrade: false,
        showEdit: false
    }
    componentDidMount (){
        this.setState({
            gateway: this.props.gateway,
            loading: true
        }, ()=> {
            this.getAllData();
            this.timer = setInterval(() => {
                this.fetchUpdate()
            }, 10000);
        })
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.store.gatewayInfo.data.platform !== this.props.store.gatewayInfo.data.platform) {
            this.fetchUpdate()
            this.setState({skynet_latest_version: undefined})
        }
        if (nextProps.gateway !== this.state.gateway){
            this.setState({
                gateway: nextProps.gateway,
                loading: true
            }, ()=> {
                this.getAllData();
            })
        }
    }
    componentWillUnmount () {
        window.removeEventListener('resize', this.resize, 20)
        clearInterval(this.timer)
    }
    resize  = () => {
        this.myFaultTypeChart1 && this.myFaultTypeChart1.resize();
        this.myFaultTypeChart2 && this.myFaultTypeChart2.resize();
    }
    fetchUpdate () {
        this.fetchFreeIOEVersion()
        this.fetchSkynetVersion()
        this.fetchCharts()
    }
    fetchFreeIOEVersion () {
        const { gatewayInfo } = this.props.store;
        http.get('/api/applications_versions_list?app=FreeIOE&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)).then(res=>{
            if (res.ok) {
                const arr = [];
                res.data && res.data.length > 0 && res.data.map(item=>{
                    if (item.version > gatewayInfo.data.version){
                        if (gatewayInfo.data.enable_beta){
                            arr.push(item)
                        } else {
                            if (item.beta === 0){
                                arr.push(item)
                            }
                        }
                    }
                })
                this.setState({
                    freeioe_version_list: arr
                })
            }
        })

        http.get('/api/applications_versions_latest?app=freeioe&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)).then(res=>{
            if (res.ok) {
                this.setState({
                    freeioe_latest_version: res.data
                })
            }
        })
    }
    fetchSkynetVersion () {
        const { gatewayInfo } = this.props.store;

        const platform_reg = new RegExp('^([^/]+)/([^/]+)/(.+)$');
        const new_bin_app_path = platform_reg.exec(gatewayInfo.data.platform)
        let url = '/api/applications_versions_list?app=' + gatewayInfo.data.platform + '_skynet&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)
        if (new_bin_app_path) {
            url = '/api/applications_versions_list?app=bin/' + gatewayInfo.data.platform + '/skynet&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)
        }
        http.get(url).then(res=>{
            const arr = [];
            res.data && res.data.length > 0 && res.data.map(item=>{
                if (item.version > gatewayInfo.data.skynet_version){
                    if (gatewayInfo.data.enable_beta){
                        arr.push(item)
                    } else {
                        if (item.beta === 0){
                            arr.push(item)
                        }
                    }
                }
            })
            this.setState({
                skynet_version_list: arr
            })
        })
        let url_latest = '/api/applications_versions_latest?app=' + gatewayInfo.data.platform + '_skynet&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)
        if (new_bin_app_path) {
            url_latest = '/api/applications_versions_latest?app=bin/' + gatewayInfo.data.platform + '/skynet&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)
        }
        http.get(url_latest).then(res=>{
            this.setState({
                skynet_latest_version: res.data
            })
        })
    }
    fetchGatewayAddress () {
        const { gatewayInfo } = this.props.store;
        axios.get('https://restapi.amap.com/v3/geocode/regeo?key=bac7bce511da6a257ac4cf2b24dd9e7e&location=' + gatewayInfo.longitude + ',' + gatewayInfo.latitude).then(location=>{
            if (location.data.regeocode){
                gatewayInfo.setDeviceAddress(location.data.regeocode.formatted_address);
            } else {
                gatewayInfo.setDeviceAddress('- -');
            }
        })
    }
    fetchGatewayData () {
        const { gateway } = this.state;
        http.get('/api/gateways_read?name=' + gateway).then(res=>{
            if (res.ok) {
                if (res.data.sn !== this.state.gateway) {
                    console.log('Delayed data arrived!!', res.data, this.state.gateway)
                    return
                }
                this.props.store.gatewayInfo.updateStatus(res.data);
            }
        })
    }
    fetchCharts () {
        const { gateway } = this.state;
        http.get(`/api/gateways_historical_data?sn=${gateway}&vsn=${gateway}&tag=cpuload&vt=float&start=-10m&value_method=raw&_=${new Date() * 1}`).then(res=>{
            let myCharts1 = this.refs.cpu
            if (myCharts1) {
                this.myFaultTypeChart1 = echarts.init(myCharts1);
                this.myFaultTypeChart1.setOption({
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross'
                        },
                        formatter: (params) => {
                            let time = echarts.format.formatTime('yyyy-MM-dd\nhh:mm:ss', params[0].data[0])
                            return `${time} <br />${params[0].seriesName}: ${params[0].data[1]}`
                        }
                    },
                    xAxis: {
                        type: 'time'
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: {
                        name: intl.get('common.number'),
                        type: 'line',
                        color: '#37A2DA',
                        data: res.data.map(item=>{
                            return [new Date(item.time), item.value]
                        })
                    }
                });
                window.addEventListener('resize', this.resize, 20);
                }
        })
        http.get(`/api/gateways_historical_data?sn=${gateway}&vsn=${gateway}&tag=mem_used&vt=int&start=-10m&value_method=raw&_=${new Date() * 1}`).then(res=>{
            let myCharts2 = this.refs.mem
            if (myCharts2) {
                this.myFaultTypeChart2 = echarts.init(myCharts2);
                this.myFaultTypeChart2.setOption({
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross'
                        },
                        formatter: (params) => {
                            let time = echarts.format.formatTime('yyyy-MM-dd\nhh:mm:ss', params[0].data[0])
                            return `${time} <br />${params[0].seriesName}: ${params[0].data[1]}`
                        }
                    },
                    xAxis: {
                        type: 'time'
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: {
                        name: intl.get('common.number'),
                        type: 'line',
                        color: '#37A2DA',
                        data: res.data.map(item=>{
                            return [new Date(item.time), item.value]
                        })
                    }
                });
                window.addEventListener('resize', this.resize, 20);
                }
        })
    }
    getAllData (){
        const { gateway } = this.state;
        http.get('/api/gateways_read?name=' + gateway).then(res=>{
            if (!res.ok) {
                message.error(res.error)
                return
            }
            this.props.store.gatewayInfo.updateStatus(res.data);
            this.setState({loading: false})
            this.fetchFreeIOEVersion()
            this.fetchSkynetVersion()
            this.fetchGatewayAddress()
        })
        this.fetchCharts()
    }
    onGatewayUpgrade (version, skynet_version) {
        if (version === undefined && skynet_version === undefined) {
            message.error(intl.get('gateway.bad_upgrade_request'))
            return
        }
        const { gatewayInfo } = this.props.store;
        this.setState({upgrading: true})
        const data = {
            name: gatewayInfo.sn,
            no_ack: 1,
            id: `sys_upgrade/${gatewayInfo.sn}/${new Date() * 1}`
        }
        if (version !== undefined) {
            data.version = version
        }
        if (skynet_version !== undefined) {
            data.skynet_version = skynet_version
        }
        http.post('/api/gateways_upgrade', data).then(res=>{
            if (res.ok) {
                this.setState({skynet_latest_version: undefined}, ()=>{
                    this.fetchSkynetVersion()
                })
                this.props.store.action.pushAction(res.data, intl.get('gateway.gateway_firmware_upgrade'), '', data, 10000,  (result)=> {
                    this.fetchSkynetVersion()
                    if (result.ok){
                        this.setState({showUpgrade: false, skynet_latest_version: undefined})
                    } else {
                        this.setState({upgrading: false})
                    }
                })
            } else {
                message.error(`${intl.get('gateway.gateway_firmware_upgrade')}${intl.get('common.fail')}! ${intl.get('common.error')}: ` + res.error)
                this.setState({upgrading: false})
            }
        }).catch((err)=>{
            message.error(`${intl.get('gateway.gateway_firmware_upgrade')}${intl.get('common.fail')}! ${intl.get('common.error')}: ` + err)
            this.setState({upgrading: false})
        })
    }
    render () {
        const { gatewayInfo } = this.props.store;
        const { upgrading, showUpgrade, showEdit, freeioe_version_list, skynet_version_list,
            loading, freeioe_latest_version, skynet_latest_version } = this.state;
        let version = gatewayInfo.data.version;
        let skynet_version = gatewayInfo.data.skynet_version;
        let freeioe_upgradable = version !== undefined && freeioe_latest_version !== undefined && version < freeioe_latest_version;
        let skynet_upgradable = skynet_version !== undefined && skynet_latest_version !== undefined && skynet_version < skynet_latest_version;
        return (
            <div className="settings">
                <div className={!showUpgrade && !showEdit ? 'show flex' : 'hide'}>
                    <div style={{ background: '#f0f2f5', padding: '20px' }}
                        className="linkstatus"
                    >
                        <div className="setbutton">
                            <span style={{padding: '0 5px'}}> </span>
                            <Button
                                disabled={!gatewayInfo.actionEnable}
                                onClick={()=>{
                                    this.setState({showEdit: true})
                                }}
                            >
                                <Icon type="setting"
                                    theme="filled"
                                />
                                {intl.get('gateway.advanced_setting')}
                            </Button>
                        </div>
                        <div className="border">
                            <Card title={
                                <div>
                                   | {intl.get('gateway.essential_information')} <Icon type="info-circle"/>
                                </div>
                                }
                                bordered={false}
                                style={{ width: '100%' }}
                                loading={loading}
                            >
                            <p><b>{intl.get('appdetails.serial_number')}:</b>{gatewayInfo.sn}</p>
                            <p><b>{intl.get('gateway.model')}:</b>{gatewayInfo.model}</p>
                            <p><b>{intl.get('common.name')}:</b>{gatewayInfo.dev_name}</p>
                            <p><b>{intl.get('common.desc')}:</b>{gatewayInfo.description}</p>
                            <p><b>{intl.get('dashboard.location')}:</b>{gatewayInfo.address} </p>
                            </Card>
                            <Card title={
                                <div>
                                    | {intl.get('gateway.configuration_information')} <Icon type="control" />
                                </div>
                                }
                                bordered={false}
                                style={{ width: '100%' }}
                                loading={loading}
                            >
                            <p><b>{intl.get('gateway.CPU_model')}:</b>{gatewayInfo.cpu}</p>
                            <p><b>{intl.get('gateway.memory_capacity')}:</b>{gatewayInfo.ram}</p>
                            <p><b>{intl.get('gateway.storage_capacity')}:</b>{gatewayInfo.rom}</p>
                            <p><b>{intl.get('gateway.operating_system')}:</b>{gatewayInfo.data.platform}</p>
                            <div className="setting_info"><b>{intl.get('gateway.business_software')}:</b>{gatewayInfo.data && gatewayInfo.data.version}
                            {
                                Number(gatewayInfo.data.version) !== 0
                                ? freeioe_upgradable
                                    ? <Tag color="red"
                                        style={{marginLeft: 15}}
                                        onClick={()=>{
                                            this.setState({showUpgrade: true})
                                        }}
                                      >{intl.get('gateway.new_version_found')}</Tag>
                                    : <Tag color="cyan"
                                        style={{marginLeft: 15}}
                                      >{intl.get('gateway.Its_the_latest_version')}</Tag>
                                : ''
                            }</div>
                            <div className="setting_info"><b>{intl.get('gateway.core_software')}:</b>{gatewayInfo.data && gatewayInfo.data.skynet_version}
                            {
                                Number(gatewayInfo.data.skynet_version) !== 0
                                ? skynet_upgradable
                                    ? <Tag color="red"
                                        style={{marginLeft: 15}}
                                        onClick={()=>{
                                            this.setState({showUpgrade: true})
                                        }}
                                      >{intl.get('gateway.new_version_found')}</Tag>
                                    : <Tag color="cyan"
                                        style={{marginLeft: 15}}
                                      >{intl.get('gateway.Its_the_latest_version')}</Tag>
                                : ''
                            }</div>
                            <p><b>{intl.get('gateway.debug_mode')}:</b>{gatewayInfo.data && gatewayInfo.data.enable_beta === 1 ? intl.get('gateway.open') : intl.get('gateway.close')}</p>
                            <p><b>{intl.get('gateway.data_upload')}:</b>{gatewayInfo.data && gatewayInfo.data.data_upload ? intl.get('gateway.open') : intl.get('gateway.close')}</p>
                            <p><b>{intl.get('gateway.statistical_upload')}:</b>{gatewayInfo.data && gatewayInfo.data.stat_upload ? intl.get('gateway.open') : intl.get('gateway.close')}</p>
                            <p><b>{intl.get('gateway.event_upload')}:</b>{gatewayInfo.data && gatewayInfo.data.event_upload}</p>
                            <div style={{height: '25px'}}> </div>
                            </Card>
                        </div>
                    </div>
                    <div className="rightecharts">
                        <Card className="border">
                            <p>{intl.get('gateway.CPU_load')}</p>
                            <div
                                style={{height: 280, width: '100%', minWidth: 300}}
                                id="CPU"
                                ref="cpu"
                            > </div>
                        </Card>
                        <p style={{height: '20px'}}> </p>
                        <Card className="border">
                            <p>{intl.get('gateway.memory_load')}</p>
                            <div
                                style={{height: 280, width: '100%', minWidth: 300}}
                                id="memory"
                                ref="mem"
                            > </div>
                        </Card>
                    </div>
                 </div>
                <div className={!showUpgrade && showEdit ? 'linkstatuswrap show' : 'linkstatuswrap hide'}>
                    <SettingsEdit
                        gatewayInfo={gatewayInfo}
                        gateway={this.state.gateway}
                        refreshGatewayData={this.fetchGatewayData}
                        onClose={()=>{
                            this.setState({showEdit: false}, ()=>{
                                this.fetchUpdate()
                            })
                        }}
                    />
            </div>
                <div className={showUpgrade && !showEdit ? 'upgrade show' : 'upgrade hide'}>
                    <Upgrade
                        gatewayInfo={gatewayInfo}
                        upgrading={upgrading}
                        freeioe_latest_version={freeioe_latest_version}
                        skynet_latest_version={skynet_latest_version}
                        version_data={freeioe_version_list}
                        skynet_version_data={skynet_version_list}
                        onUpgrade={(version, skynet_version)=>{
                            this.onGatewayUpgrade(version, skynet_version)
                        }}
                        onCheckUpgrade={()=>{
                            this.fetchUpdate()
                        }}
                        onClose={()=>{
                            this.setState({showUpgrade: false}, ()=>{
                                this.fetchUpdate()
                            })
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default GatewaySettings;