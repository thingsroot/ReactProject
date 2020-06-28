import React, { Component } from 'react';
import { Input, Select, Button, Table, message, Collapse } from 'antd';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import {_getCookie} from '../../../utils/Session';
import http from '../../../utils/Server';
import ServiceState from '../../../common/ServiceState';
import JSONPretty from 'react-json-pretty';
import './style.scss';
const Option = Select.Option;
const { Panel } = Collapse;
const columns = [{
    title: '服务名称',
    dataIndex: 'name',
    key: 'name',
    width: '150px'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '140px'
  }];
  @withRouter
  @inject('store')
  @observer
class VPN extends Component {
    state = {
        flag: true,
        tap_ip: undefined,
        arr: [],
        start_loading: false,
        stop_loading: false,
        bridge_run: '',
        router_run: '',
        bridge_config: '',
        router_config: '',
        status: 'ONLINE',
        agreement: 'tcp',
        model: 'bridge',
        port: '665',
        auth_code: '',
        ip: 'device ipaddress',
        node: 'hs.symgrid.com',
        netmask: '255.255.255.0',
        virtualIp: '',
        message: {},
        result: {},
        toggleFlag: true,
        gateStatus: '',
        chouldstatus: {},
        isShow: false,
        pingIP: '',
        timer: undefined
    }
    componentDidMount (){
        http.get('/api/user_token_read').then(res=>{
            this.setState({
                auth_code: res.data
            }, () => {
                this.props.mqtt.auth_code = res.data
            })
        })
        this.getStatus()
        this.timer = setInterval(() => {
            this.getStatus()
        }, 10000);
        this.timer1 = setInterval(() => {
            this.sendKeepAlive()
        }, 3000);
        const { mqtt } = this.props;
        mqtt.connect(this.props.gateway, 'v1/vnet/#', true)

    }
    componentWillUnmount (){
        this.props.mqtt.disconnect();
        clearInterval(this.timer)
        clearInterval(this.timer1)
    }
    startVnet = () =>{
        if (this.state.auth_code){
            const {mqtt} = this.props;
            const data = {
                id: 'start_vnet/' + new Date() * 1,
                vnet_cfg: {
                    net_mode: this.state.model,
                    net_protocol: this.state.agreement,
                    gate_sn: this.props.gateway,
                    tap_ip: this.state.tap_ip,
                    user_id: _getCookie('user_id'),
                    tap_netmask: this.state.netmask,
                    dest_ip: this.state.pingIP,
                    node: this.props.mqtt.vserial_channel.Proxy
                },
                frps_cfg: {
                    server_addr: this.props.mqtt.vserial_channel.Proxy
                }
            }
            console.log(data.vnet_cfg.net_mode, 'data')
            // const postData = {
            //     id: 'post_gate/' + new Date() * 1,
            //     auth_code: this.state.auth_code,
            //     output: 'vnet_config'
            // }
            mqtt && mqtt.client && mqtt.client.publish('v1/vnet/api/service_start', JSON.stringify(data))
            // setTimeout(() => {
            //     mqtt && mqtt.client && mqtt.client.publish('v1/vnet/api/post_gate', JSON.stringify(postData))
            // }, 5000);
        } else {
            message.warning('您的账户暂无AccessKey,将为您自动创建AccessKey。', 3)
            http.post('/api/user_token_create').then(res=>{
                if (res.ok){
                    this.setState({
                        auth_code: res.data
                    }, ()=>{
                        this.startVnet()
                    })
                } else {
                    this.setState({
                        start_loading: false,
                        stop_loading: false
                    })
                    message.error('AccessKey创建失败，请重试！')
                }
            })
        }
    }
    sendKeepAlive = () =>{
        const { mqtt } = this.props;
        const message = {
            id: 'keep_alive/' + new Date() * 1,
            enable_heartbeat: true,
            heartbeat_timeout: 60,
            gate_sn: this.props.gateway,
            auth_code: this.state.auth_code
        };
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/keep_alive', JSON.stringify(message))
    }
    getStatus = ()=>{
        const { mqtt } = this.props;
        if (mqtt.client) {
            mqtt.connect(this.props.gateway, 'v1/vnet/#', true)
        }
        const data = {
            id: 'checkenv' + new Date() * 1
        }
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/checkenv', JSON.stringify(data))
        http.get('/api/gateway_devf_data?gateway=' + this.props.gateway + '&name=' + this.props.gateway + '.freeioe_Vnet').then(res=>{
            if (res.ok){
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.name === 'lan_ip') {
                            if (!this.state.pingIP) {
                                this.setState({lan_ip: item.pv, pingIP: item.pv})
                            } else {
                                this.setState({lan_ip: item.pv})
                            }
                                if (!this.state.tap_ip){
                                    if (item.pv){
                                        const tap_ip = item.pv.split('.', 3).join('.') + '.' + parseInt(Math.random() * 200 + 10, 10)
                                        this.setState({
                                            tap_ip
                                        })
                                    }
                                }
                        }
                        if (item.name === 'router_run') {
                            this.setState({router_run: item.pv})
                        }
                        if (item.name === 'bridge_run') {
                            this.setState({bridge_run: item.pv})
                        }
                        if (item.name === 'bridge_config') {
                            this.setState({bridge_config: item.pv})
                        }
                        if (item.name === 'router_config') {
                            this.setState({router_config: item.pv})
                        }
                    })
                }
            }
        })
        if (mqtt.client && mqtt.vnet_channel.is_running) {
            setTimeout(() => {
                this.setState({stop_loading: false})
            }, 3000);
        }
        if (mqtt.client && !mqtt.vnet_channel.is_running) {
            setTimeout(() => {
                this.setState({start_loading: false})
            }, 3000);
        }
    }

    stopVnet () {
        const {mqtt} = this.props;
        const {vnet_config} = mqtt.vnet_channel;
        const data = {
            id: 'stop_vnet/' + new Date() * 1,
            vnet_cfg: {
                dest_ip: vnet_config.dest_ip,
                gate_sn: vnet_config.gate_sn,
                net_mode: vnet_config.net_mode,
                net_protocol: vnet_config.net_protocol,
                node: vnet_config.node,
                tap_ip: vnet_config.tap_ip,
                tap_netmask: vnet_config.tap_netmask
            }
        }
        const postData = {
            id: 'post_gate/' + new Date() * 1,
            auth_code: this.state.auth_code,
            output: 'vnet_stop'
        }
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/service_stop', JSON.stringify(data))
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/post_gate', JSON.stringify(postData))
    }
    getDate = (record) =>{
        if (record.id){
            const id = record.id;
            const timeStamp = Number(id.split('/')[1]);
            const date = new Date(timeStamp)
            const Hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
            const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
            const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
            const time = Hours + ':' + minutes + ':' + seconds;
            return time
        }
    }
    settimer = (val) =>{
        this.setState({
            timer: val
        })
    }
    render () {
        const { mqtt } = this.props;
        const { is_running } = this.props.mqtt.vnet_channel;
        const {start_loading, stop_loading, model, isShow} = this.state;
        return (
            <div className="VPN">
                <h2>远程编程-网络</h2>
                <div className="help_button">
                    <Button
                        icon="question-circle"
                        // style={{marginLeft: '27px', marginBottom: '4px'}}
                        onClick={()=>{
                            window.open('https://wiki.freeioe.org/doku.php?id=apps:APP00000135', '_blank')
                        }}
                    >帮助</Button>
                </div>
                <div className="vnetVserState">
                    <ServiceState
                        mqtt={this.props.mqtt}
                        gateway={this.props.match.params.sn}
                        settimer={this.settimer}
                    />
                </div>
                <div className="VPNLeft">
                    <p className="vnet_title">运行参数</p>
                    <div className="VPNlist">
                        <p>网关状态：</p>
                        <Input
                            value={this.props.store.gatewayInfo.device_status}
                        />
                    </div>
                    <div className="VPNlist">
                        <p>网络模式：</p>
                        <Button
                            type={this.state.model === 'bridge' ? 'primary' : ''}
                            disabled={is_running}
                            onClick={()=>{
                                if (this.state.tap_ip) {
                                    const Num = this.state.tap_ip.split('.', 3).join('.') + '.' + parseInt(Math.random() * 200 + 10, 10);
                                    this.setState({model: 'bridge', port: '665', tap_ip: Num})
                                }
                            }}
                        >桥接模式</Button>
                        <Button
                            type={this.state.model === 'router' ? 'primary' : ''}
                            disabled={is_running}
                            onClick={()=>{
                                if (this.state.tap_ip) {
                                    const Num = this.state.tap_ip.split('.', 3).join('.') + '.0';
                                    this.setState({model: 'router', port: '666', tap_ip: Num})
                                }
                            }}
                        >路由模式</Button>
                    </div>
                    <div className="VPNlist">
                        <p>传输协议：</p>
                        <Button
                            type={this.state.agreement === 'tcp' ? 'primary' : ''}
                            disabled={is_running}
                            onClick={()=>{
                                this.setState({agreement: 'tcp'})
                            }}
                        >tcp</Button>
                        <Button
                            type={this.state.agreement === 'kcp' ? 'primary' : ''}
                            disabled={is_running}
                            onClick={()=>{
                                this.setState({agreement: 'kcp'})
                            }}
                        >kcp</Button>
                    </div>
                    <div className="VPNlist">
                        <p>
                            {
                                model === 'bridge'
                                ? '虚拟网卡IP:'
                                : '目标主机网络'
                            }
                        </p>
                        <Input
                            ref="tap_ip"
                            value={this.state.tap_ip}
                            disabled={is_running}
                            className="shit1"
                            onChange={(record)=>{
                                this.setState({tap_ip: record.target.value})
                            }}
                        />
                    </div>
                    <div className="VPNlist">
                        <p>子网掩码:</p>
                        <Select
                            defaultValue="255.255.255.0"
                            disabled={is_running}
                            onChange={(value)=>{
                                this.setState({
                                    netmask: value
                                })
                            }}
                        >
                            <Option value="255.255.255.0">255.255.255.0</Option>
                            <Option value="255.255.254.0">255.255.254.0</Option>
                            <Option value="255.255.252.0">255.255.252.0</Option>
                            <Option value="255.255.128.0">255.255.128.0</Option>
                            <Option value="255.255.0.0">255.255.0.0</Option>
                        </Select>
                    </div>
                    <div className="VPNlist">
                        <p>网关IP：</p>
                        <Input
                            value={this.state.lan_ip}
                            disabled
                            style={{marginRight: 15}}
                        />
                    </div>
                    <div className="VPNlist">
                        <p>Ping目标IP：</p>
                        <Input
                            value={this.state.pingIP}
                            style={{marginRight: 15}}
                            disabled={is_running}
                            onChange={(record)=>{
                                this.setState({
                                    pingIP: record.target.value
                                })
                            }}
                        />
                    </div>
                    {
                        !is_running
                        ? <Button
                            className="btn"
                            type="primary"
                            loading={start_loading}
                            disabled={!(mqtt.vserial_channel.serviceNode && mqtt.vserial_channel.serviceNode.length > 0 && this.state.timer !== undefined && !this.state.timer)}
                            style={{fontSize: 24, height: 50}}
                            onClick={()=>{
                                this.setState({
                                    start_loading: true,
                                    stop_loading: false
                                }, ()=>{
                                    this.startVnet()
                                })
                            }}
                          >启动</Button>
                    : <Button
                        className="btn"
                        type="danger"
                        loading={stop_loading}
                        style={{fontSize: 24, height: 50}}
                        onClick={()=>{
                            this.setState({
                                start_loading: false,
                                stop_loading: true
                            }, ()=>{
                                this.stopVnet()
                            })
                        }}
                      >停止</Button>
                    }
                </div>
                <div className="VPNRight">
                    {/* <div className="VPNlist">
                        <p>
                            本地运行环境：
                        </p>
                        <span>{mqtt.connected ? '运行环境正常' : '运行环境异常'}</span>
                    </div> */}
                    <p className="vnet_title">运行状态</p>
                    <div className="VPNlist">
                        <p>
                            本地连接状态：
                        </p>
                        <span>{is_running ? '正常' : '------'}</span>
                        <div
                            className="statusDetail"
                            style={{cursor: 'pointer', color: '#ccc'}}
                            onMouseOver={()=>{
                                this.setState({isShow: true})
                            }}
                            onMouseOut={()=>{
                                this.setState({isShow: false})
                            }}
                        >详情</div>
                        <div
                            className="isShow"
                        >
                            {
                                isShow
                                ? <Table
                                    size="small"
                                    columns={columns}
                                    dataSource={this.props.mqtt.vnet_channel.Service}
                                    rowKey="name"
                                    pagination={false}
                                  />
                                : ''
                            }
                        </div>
                    </div>
                    <div className="VPNlist">
                        <p>
                            云端隧道状态：
                        </p>
                        <span>{
                            is_running ? mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.cur_conns && parseInt(mqtt.vnet_channel.serviceState.cur_conns) > 0 ? '正常' : '异常' : '------'
                            }</span>
                    </div>
                    {
                        model === 'bridge'
                        ? <div className="VPNlist">
                            <p>
                                网关隧道状态：
                            </p>
                            <span>{this.state.bridge_run === 'running' ? '正常' : '异常'}</span>
                        </div>
                        : <div className="VPNlist">
                            <p>
                            网关隧道状态：
                        </p>
                        <span>{this.state.router_run}</span>
                        </div>
                    }
                    <div className="VPNlist">
                        <p>
                            本次启动时间：
                        </p>
                        <span>{
                            is_running ? mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.last_start_time ? mqtt.vnet_channel.serviceState.last_start_time : '------' : '------'
                        }</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            今日流量消耗：
                        </p>
                        <span>{
                            is_running ? mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.today_traffic_in && mqtt.vnet_channel.serviceState.today_traffic_out ? Math.ceil((mqtt.vnet_channel.serviceState.today_traffic_in + mqtt.vnet_channel.serviceState.today_traffic_out) / 1024) + ' KB' : '0KB' : '------'
                        }</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            Ping目标IP状态：
                        </p>
                        <span>{is_running ? mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.message ? mqtt.vnet_channel.serviceState.message === 'online' ? '正常' : '异常' : '------' : '------'}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            Ping目标IP延迟：
                        </p>
                        <span>{is_running ? mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.delay ? mqtt.vnet_channel.serviceState.delay : '------' : '------'}</span>
                    </div>
                </div>
                <div className="vnet_message">
                    <p className="vnet_title">消息</p>
                    <span className="vnet_remove_message">
                        <Button
                            onClick={()=>{
                                mqtt.vnet_message = []
                            }}
                        >清除</Button>
                    </span>
                    <div>
                    <Collapse
                        expandIconPosition="right"
                    >
                        <Panel
                            header="消息列表"
                            key="1"
                        >
                        {
                            mqtt.vnet_message && mqtt.vnet_message.length > 0 && mqtt.vnet_message.map((item, key) => {
                                return (
                                    <div
                                        key={key}
                                        className="vnet_message_item"
                                    >
                                        时间:
                                        {this.getDate(item)}
                                        <br />
                                        内容:
                                        <JSONPretty
                                            id="json-pretty"
                                            data={JSON.stringify(item)}
                                        ></JSONPretty>
                                    </div>
                                )
                            })
                        }
                        </Panel>
                    </Collapse>
                    </div>
                </div>
            </div>
        );
    }
}

export default VPN;