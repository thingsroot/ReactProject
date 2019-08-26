import React, { Component } from 'react';
import { Input, Select, Button, Table } from 'antd';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import http from '../../../utils/Server';
import ServiceState from '../../../common/ServiceState';
// import { apply_AccessKey } from '../../../utils/Session';
import './style.scss';
const Option = Select.Option;
const columns = [{
    title: '服务名称',
    dataIndex: 'name',
    key: 'name'
  }, {
    title: '描述',
    dataIndex: 'desc',
    key: 'desc'
  }, {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  }];
  @withRouter
  @inject('store')
  @observer
class VPN extends Component {
    state = {
        flag: true,
        tap_ip: '192.168.0.' + Math.floor(Math.random() * 256),
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
        chouldstatus: {}
    }
    componentDidMount (){
        this.getStatus()
        this.timer = setInterval(() => {
            this.getStatus()
        }, 10000);
        const { mqtt } = this.props;
        mqtt.connect(this.props.gateway, 'v1/vnet/#', true)

    }
    componentWillUnmount (){
        this.props.mqtt.disconnect();
        clearInterval(this.timer)
    }
    startVnet = () =>{
        const {mqtt} = this.props;
        const data = {
            id: 'start_vnet/' + new Date() * 1,
            vnet_cfg: {
                net_mode: this.state.model,
                net_protocol: this.state.agreement,
                gate_sn: this.props.gateway,
                tap_ip: this.state.tap_ip,
                tap_netmask: this.state.netmask,
                dest_ip: this.state.lan_ip,
                node: this.props.mqtt.vserial_channel.Proxy
            },
            frps_cfg: {
                server_addr: this.props.mqtt.vserial_channel.Proxy
            }
        }
        const postData = {
            id: 'post_gate/' + new Date() * 1,
            auth_code: mqtt.auth_code,
            output: 'vnet_config'
        }
        mqtt && mqtt.client && mqtt.client.publish('v1/vnet/api/service_start', JSON.stringify(data))
        mqtt && mqtt.client && mqtt.client.publish('v1/vnet/api/post_gate', JSON.stringify(postData))
    }
    getStatus = ()=>{
        const message = {
            id: 'keep_alive/' + new Date() * 1,
            enable_heartbeat: true,
            heartbeat_timeout: 60,
            gate_sn: this.props.gateway,
            auth_code: this.props.mqtt.auth_code
        };
        const { mqtt } = this.props;
        if (mqtt.client) {
            mqtt.connect(this.props.gateway, 'v1/vnet/#', true)
        }
        const data = {
            id: 'checkenv' + new Date() * 1
        }
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/checkenv', JSON.stringify(data))
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/keep_alive', JSON.stringify(message))
        http.get('/api/gateway_devf_data?gateway=' + this.props.gateway + '&name=' + this.props.gateway + '.freeioe_Vnet').then(res=>{
            if (res.ok){
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.name === 'lan_ip') {
                            this.setState({lan_ip: item.pv})
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
            this.setState({stop_loading: false})
        }
        if (mqtt.client && !mqtt.vnet_channel.is_running) {
            this.setState({start_loading: false})
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
            auth_code: mqtt.auth_code,
            output: 'vnet_stop'
        }
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/service_stop', JSON.stringify(data))
        mqtt && mqtt.client && mqtt.client.connected && mqtt.client.publish('v1/vnet/api/post_gate', JSON.stringify(postData))
    }
    render () {
        const { mqtt } = this.props;
        const { is_running } = this.props.mqtt.vnet_channel;
        const {start_loading, stop_loading} = this.state;
        return (
            <div className="VPN">
                <div className="vnetVserState">
                    <ServiceState
                        mqtt={this.props.mqtt}
                    />
                </div>
                <div className="VPNLeft">
                    <div className="VPNlist">
                        <p>网关状态：</p>
                        <Input
                            value={this.props.store.gatewayInfo.device_status}
                        />
                    </div>
                    <div className="VPNlist">
                        <p>虚拟网卡IP：</p>
                        <Input
                            value={this.state.tap_ip}
                            disabled={is_running}
                        />
                    </div>
                    <div className="VPNlist">
                        <p>虚拟网卡netmask：</p>
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
                        <p>传输协议：</p>
                        <Button
                            type={this.state.agreement === 'tcp' ? 'primary' : ''}
                            // disabled={flag}
                            onClick={()=>{
                                this.setState({agreement: 'tcp'})
                            }}
                        >tcp</Button>
                        <Button
                            type={this.state.agreement === 'kcp' ? 'primary' : ''}
                            // disabled={flag}
                            onClick={()=>{
                                this.setState({agreement: 'kcp'})
                            }}
                        >kcp</Button>
                    </div>
                    <div className="VPNlist">
                        <p>网络模式：</p>
                        <Button
                            type={this.state.model === 'bridge' ? 'primary' : ''}
                            // disabled={flag}
                            onClick={()=>{
                                const Num = Math.floor(Math.random() * 256);
                                this.setState({model: 'bridge', port: '665', tap_ip: '192.168.0.' + Num})
                            }}
                        >桥接模式</Button>
                        <Button
                            type={this.state.model === 'router' ? 'primary' : ''}
                            // disabled={flag}
                            onClick={()=>{
                                this.setState({model: 'router', port: '666'})
                            }}
                        >路由模式</Button>
                    </div>
                    {
                        !is_running
                        ? <Button
                            className="btn"
                            type="primary"
                            loading={start_loading}
                            disabled={!(mqtt.vserial_channel.serviceNode && mqtt.vserial_channel.serviceNode.length > 0)}
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
                    <div className="VPNlist">
                        <p>
                            本地运行环境：
                        </p>
                        <span>{mqtt.connected ? '运行环境正常' : '运行环境异常'}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            本地连接状态：
                        </p>
                        <span>{is_running ? 'running' : '------'}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            云端隧道状态：
                        </p>
                        <span>{mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.cur_conns && mqtt.vnet_channel.serviceState.cur_conns > 0 ? 'connected' : 'disconnected'}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            网关桥接隧道状态：
                        </p>
                        <span>{this.state.bridge_run}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            网关路由隧道状态：
                        </p>
                        <span>{this.state.router_run}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            本次启动时间：
                        </p>
                        <span>{mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.last_start_time ? mqtt.vnet_channel.serviceState.last_start_time : '------'}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            今日流量消耗：
                        </p>
                        <span>{
                            mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.today_traffic_in && mqtt.vnet_channel.serviceState.today_traffic_out ? Math.ceil((mqtt.vnet_channel.serviceState.today_traffic_in + mqtt.vnet_channel.serviceState.today_traffic_out) / 1024) + ' KB' : '------'
                        }</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            Ping网关IP状态：
                        </p>
                        <span>{mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.message ? mqtt.vnet_channel.serviceState.message : '------'}</span>
                    </div>
                    <div className="VPNlist">
                        <p>
                            Ping网关IP延迟：
                        </p>
                        <span>{mqtt.vnet_channel.serviceState && mqtt.vnet_channel.serviceState.delay ? mqtt.vnet_channel.serviceState.delay : '------'}</span>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={this.props.mqtt.vnet_channel.Service}
                        rowKey="name"
                    />
                </div>
            </div>
        );
    }
}

export default VPN;