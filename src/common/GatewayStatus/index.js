import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Icon, Tooltip } from 'antd';
import http from '../../utils/Server';
import { Link, withRouter } from 'react-router-dom';
import './style.scss';

@withRouter
@inject('store')
@observer
class Status extends Component {
    constructor (props){
        super(props);
        this.timer = undefined
        this.state = {
            gateway: ''
        }
    }
    componentDidMount (){
        this.setState({gateway: this.props.gateway}, () => {
            this.gatewayRead()
            this.startTimer()
        })
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.gateway !== this.state.gateway) {
            this.setState({gateway: nextProps.gateway}, () => {
                this.gatewayRead()
            })
        }
    }
    componentWillUnmount (){
        clearInterval(this.timer);
    }
    startTimer (){
        this.timer = setInterval(() => {
            const {gateStatusLast, gateStatusGap, gateStatusNoGapTime} = this.props.store.timer;
            let now = new Date().getTime()
            if (now < gateStatusNoGapTime) {
                this.props.store.timer.setGateStatusLast(now)
                this.gatewayRead()
            } else if (now > gateStatusGap + gateStatusLast) {
                this.props.store.timer.setGateStatusLast(now)
                this.gatewayRead()
            }
        }, 1000);
    }
    gatewayRead (){
        if (this.state.gateway === undefined || this.state.gateway === '') {
            return
        }
        http.get('/api/gateways_read?name=' + this.state.gateway).then(res=>{
            if (res.ok) {
                if (res.data.sn !== this.state.gateway) {
                    console.log('Delayed data arrived!!', res.data, this.state.gateway)
                    return
                }
                this.props.store.gatewayInfo.updateStatus(res.data);
            }
        });
    }
    render () {
        const { device_status, dev_name, description, data } = this.props.store.gatewayInfo;
        return (
            <div className="GatesStatusWrap">
                <div>
                    <Tooltip title="在线状态" >
                        {/* <span className={device_status === 'ONLINE' ? 'online' : 'offline'}><b></b></span>
                        <span style={{padding: '0 5px'}} /> */}
                        <Icon
                            style={{fontSize: 22, color: device_status === 'ONLINE' ? '#3c763d' : '#f39c12'}}
                            type={device_status === 'ONLINE' ? 'link' : 'disconnect'}
                        />
                    </Tooltip>
                    {
                        device_status === 'ONLINE' ? (
                            <span>
                                <span style={{padding: '0 10px'}} />
                                <Tooltip title="数据上传" >
                                    <Icon
                                        style={{fontSize: 22, color: data.data_upload ? '#3c763d' : '#f39c12'}}
                                        type={data.data_upload  ? 'cloud-upload' : 'cloud'}
                                    />
                                </Tooltip>
                                <span style={{padding: '0 5px'}} />
                                {
                                    data.enable_beta
                                    ? <Tooltip title="调试模式" >
                                        <Icon
                                            style={{fontSize: 22, color: '#f39c12'}}
                                            type="warning"
                                        />
                                    </Tooltip>  : null
                                }
                            </span>
                        ) : null
                    }
                    
                </div>
                <div>
                    <div className="positon"><span></span></div>
                    &nbsp;名称: {dev_name ? dev_name : ''}
                </div>
                <div>
                    <div className="positon"><span></span></div>
                    &nbsp;描述: {description ? description : ''}
                </div>
                <div>
                    <div className="positon"><span></span></div>
                    &nbsp;序号: {this.state.gateway}
                </div>
                    {
                        this.props.location.pathname.indexOf('/gateway/') !== -1
                        ? <div
                            onClick={()=>{
                                localStorage.setItem('url', this.props.location.pathname)
                            }}
                          >
                            <Link to={`/appsinstall/${this.state.gateway}`}>
                                安装新应用
                            </Link>
                        </div>
                        : ''
                    }
            </div>
        );
    }
}
export default Status;