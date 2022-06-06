import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Icon } from 'antd';
import http from '../../utils/Server';
import './style.scss';
import OEM from '../../assets/OEM';
class MyVirtualGates extends React.Component {
    state = {
        columns: [
            {
                title: '虚拟网关序列号',
                dataIndex: 'sn'
            }, {
                title: '状态',
                dataIndex: 'device_status',
                render: (props)=>{
                    if (props === 'ONLINE'){
                        return (
                            <span className="online"><b></b>&nbsp;&nbsp;在线</span>
                        )
                    } else {
                        return (
                            <span className="offline"><b></b>&nbsp;&nbsp;未连接</span>
                        )
                    }
                }
            }, {
                title: '网关名称',
                dataIndex: 'name'
            }, {
                title: '网关描述',
                dataIndex: 'description',
                width: '400px'
            }, {
                title: '操作',
                dataIndex: 'action',
                render: (props, record)=>{
                    if (record.device_status !== 'ONLINE') {
                        return (
                            <span>--/--</span>
                        )
                    } else {
                        return (
                            <span>
                                <Link to={`/gateways/${record.sn}/devices`}>设备</Link>/
                                <Link to={`/gateways/${record.sn}/apps`}>应用</Link>
                            </span>
                        )
                    }
                }
            }
        ],
        data: []
    }
    componentDidMount (){
        this.virtual_gateways_list()
    }
    virtual_gateways_list = ()=>{
        http.get('/api/user_virtual_gateways_list').then(res=>{
            if (res.ok) {
                this.setState({
                    data: res.data
                })
            }
        })
    }
    render () {
        const { columns, data } = this.state;
        return (
            <div>
                <div
                    style={{position: 'relative', height: 40, textAlign: 'right'}}
                >
                    <Button
                        type="primary"
                        style={{
                            position: 'absolute',
                            right: 30,
                            top: 0,
                            zIndex: 999
                        }}
                        onClick={()=>{
                            http.post('/api/user_virtual_gateways_create').then(res=>{
                                if (res.ok) {
                                    this.virtual_gateways_list()
                                }
                            })
                        }}
                    >
                        申请虚拟网关
                    </Button>
                    <Icon
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 6,
                            zIndex: 999
                        }}
                        className="rollback"
                        type="rollback"
                        onClick={()=>{
                            this.props.history.go(-1)
                        }}
                    />
                </div>
                <Table
                    rowKey="name"
                    columns={columns}
                    dataSource={data}
                />
                <section>
                    <div className="virtual_help">
                        <h2>FreeIOE虚拟机</h2>
                        <p>FreeIOE的虚拟机地址如下:</p>
                        <p>点击下载
                            <b>
                                <a
                                    href="http://thingscloud.oss-cn-beijing.aliyuncs.com/download/freeioe.zip"
                                    style={{color: '#1890ff'}}
                                >FreeIOE虚拟机</a>
                            </b>
                        </p>
                        <h3>
                            <b>
                                <a
                                    href={OEM.HelpDomain + '/guide/user_guide/FreeIOE-VM.html'}
                                    target="_blank"
                                >FreeIOE虚拟机使用帮助</a>
                            </b>
                        </h3>
                    </div>
                </section>
            </div>
        )
    }
}
export default MyVirtualGates;