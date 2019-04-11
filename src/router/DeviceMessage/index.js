import React, { PureComponent } from 'react';
import { Table, Input, Select, Button, message } from 'antd'
import './style.scss'
import http from '../../utils/Server';
import {_getCookie} from '../../utils/Session';
import axios from 'axios/index';
const InputGroup = Input.Group;
const Option = Select.Option;
const disposed = {
    color: '#367fa9',
    fontWeight: '600'
};
const posed = {
    color: 'rgba(0, 0, 0, 0.65)',
    fontWeight: 'normal'
};

class DevicemMessage extends PureComponent {
    state = {
        category: '',
        user: '',
        start: 0,
        length: 100,
        filters: {},
        tableData: [],
        platformData: [],
        dataSource: [],
        selectValue: 'title',
        text: '',
        loading: false,
        selectRow: [],
        columns: [{
            title: '标题',
            dataIndex: 'title',
            width: '25%',
            render: (text, record) => (
                <span
                    style={record.disposed === 0 ? disposed : posed}
                >{text}
                </span>
            )
        }, {
            title: '网关序列号',
            dataIndex: 'device',
            width: '35%',
            render: (text, record) => (
                <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
            )
        }, {
            title: '发生时间',
            dataIndex: 'creation',
            width: '20%',
            render: (text, record) => (
                <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
            )
        }, {
            title: '消息类型',
            dataIndex: 'operation',
            width: '10%',
            render: (text, record) => (
                <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
            )
        }, {
            title: '消息类型',
            dataIndex: 'event_level',
            width: '10%',
            render: (text, record) => (
                <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
            )
        }]
    };
    componentDidMount (){
        let params = {
            category: 'user',
            name: _getCookie('user_id'),
            start: 0,
            limit: 100,
            filters: {}
        };
        this.setState({
            category: params.category,
            name: params.name,
            start: params.start,
            length: params.limit,
            filters: params.filters
        });
        this.getMessageList(params)
    }
    rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(selectedRows);
            this.setState({
                selectRow: selectedRows
            })
        },
        getCheckboxProps: record => ({
            disabled: record.name === 'Disabled User', // Column configuration not to be checked
            name: record.name
        })
    };
    //确认消息
    confMessage = (arr)=>{
        if (arr.length === 0) {
            message.warning('请您先选择要确认的消息！');
        } else {
            let params = {
                disposed: 1,
                activities: arr
            };
            http.postToken('/api/method/iot.user_api.device_event', params).then(res=>{
                console.log(res);
            });
        }
    };
    //确认消息
    confAllMessage = ()=>{
        message.warning('请您先选择要确认的消息！');
    };
    //获取消息列表
    getMessageList = (params)=>{
        this.setState({
            loading: true
        });
        axios({
            url: '/api/device_events_list',
            method: 'GET',
            params: params
        }).then(res=>{
            let sourceData = res.data.data.list.data;
            let data = [];
            let source = [];
            if (res.data.ok === true) {
                sourceData.map((v)=>{
                    let type = '';
                    if (v.event_type === 'EVENT') {
                        type = '设备'
                    } else {
                        type = v.event_type
                    }
                    data.push({
                        title: v.event_info,
                        device: v.event_source,
                        creation: v.creation.split('.')[0],
                        operation: type,
                        disposed: v.disposed,
                        name: v.name,
                        event_level: v.event_level
                    });
                    source.push(v.event_type);
                });
            } else {
                message.error('获取消息列表失败！')
            }
            this.setState({
                platformData: data,
                tableData: data,
                loading: false
            }, ()=>{
                console.log(this.state.tableData)
            })
        })
    };
    //时间戳转换
    timestampToTime = (timestamp)=>{
        let date = new Date(timestamp);
        let Y = date.getFullYear() + '-';
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        let D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + (date.getHours()) : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()) + ':';
        let s = '00';
        return Y + M + D + h + m + s;
    };
    //搜索框改变值
    getSelect = (text)=>{
        console.log(text);
        this.setState({
            selectValue: text
        })
    };
    tick = (text)=>{
        if (this.timer){
            clearTimeout(this.timer)
        }
        this.timer = setTimeout(() => {
            this.setState({
                text: text
            }, ()=>{
                console.log(this.state.text)
            })
        }, 1000);
    };
    search = (inpVal)=>{
        let text = event.target.value;
        this.tick(text);
        let newData = [];
        this.state.tableData.map((v)=>{
            if (v[inpVal].indexOf(text) !== -1) {
                newData.push(v)
            }
        });
        if (text) {
            this.setState({
                platformData: newData
            });
        } else {
            let data = this.state.tableData;
            this.setState({
                platformData: data
            })
        }
    };
    //最大记录数
    messageTotal = (value)=>{
        let num = `${value}`;
        let params = {
            category: this.state.category,
            name: this.state.name,
            start: this.state.start,
            limit: num,
            filters: this.state.filters
        };
        this.setState({
            length: params.limit
        });
        console.log(params);
        this.getMessageList(params);
    };
    //筛选消息类型
    messageChange = (value)=>{
        let data = [];
        if (`${value}`) {
            this.state.tableData.map((v)=>{
                if (v.operation === `${value}`) {
                    data.push(v);
                }
            });
            this.setState({
                platformData: data
            })
        } else {
            let data = this.state.tableData;
            this.setState({
                platformData: data
            })
        }
    };
    gradeChange = (value)=>{
        let data = [];
        if (`${value}`) {
            this.state.tableData.map((v)=>{
                if (v.event_level === parseInt(`${value}`)) {
                    data.push(v);
                }
            });
            this.setState({
                platformData: data
            })
        } else {
            let data = this.state.tableData;
            this.setState({
                platformData: data
            })
        }
    };
    //时间
    messageTime = (value)=>{
        console.log(`${value}`);
        let hours = Date.parse(new Date()) - `${value}` * 60 * 60 * 1000;
        let time = this.timestampToTime(hours);
        console.log(time)
        let params = {
            category: this.state.category,
            name: this.state.name,
            start: this.state.start,
            limit: this.state.length,
            filters: {
                'creation': [
                    '>',
                    time
                ]
            }
        };
        this.setState({
            filters: params.filters
        });
        this.getMessageList(params);
    };
    //表格
    onChange = (pagination, filters, sorter)=>{
        console.log('params', pagination, filters, sorter)
    };

    render () {
        let selectValue = this.state.selectValue;
        let selectRow = this.state.selectRow;
        return (
            <div className="deviceMessage">
                <div className="searchBox">
                    <Select defaultValue="消息类型"
                        style={{ width: 120 }}
                        onChange={this.messageChange}
                    >
                        <Option value="">全部消息类型</Option>
                        <Option value="通讯">通讯</Option>
                        <Option value="数据">数据</Option>
                        <Option value="应用">应用</Option>
                        <Option value="系统">系统</Option>
                        <Option value="EVENT">设备</Option>
                    </Select>
                    <Select defaultValue="等级"
                        style={{ width: 120 }}
                        onChange={this.gradeChange}
                    >
                        <Option value="">全部消息类型</Option>
                        <Option value="1">常规</Option>
                        <Option value="2">错误</Option>
                        <Option value="3">警告</Option>
                        <Option value="99">致命</Option>
                    </Select>
                    <Select defaultValue="记录数"
                        style={{ width: 120 }}
                        onChange={this.messageTotal}
                    >
                        <Option value="100">100</Option>
                        <Option value="300">300</Option>
                        <Option value="500">500</Option>
                    </Select>
                    <Select defaultValue="时间"
                        style={{ width: 120 }}
                        onChange={this.messageTime}
                    >
                        <Option value="1">1小时</Option>
                        <Option value="6">6小时</Option>
                        <Option value="24">24小时</Option>
                        <Option value="72">72小时</Option>
                    </Select>
                    <Button onClick={()=>{
                        this.confMessage(selectRow)
                    }}
                    >确认消息</Button>
                    <Button onClick={()=>{
                        this.confAllMessage()
                    }}
                    >确认所有消息</Button>
                    <div style={{
                        width: '340px',
                        position: 'absolute',
                        right: '0',
                        top: '0'
                    }}
                    >
                        <InputGroup compact>
                            <Select defaultValue="标题"
                                onChange={this.getSelect}
                                style={{width: '100px'}}
                            >
                                <Option value="title">标题</Option>
                                <Option value="device">序列号</Option>
                            </Select>
                            <Input
                                style={{ width: '70%' }}
                                placeholder="请输入关键字"
                                onChange={
                                    ()=>{
                                        this.search(selectValue)
                                    }
                                }
                            />
                        </InputGroup>
                    </div>
                </div>
                <Table
                    rowSelection={this.rowSelection}
                    columns={this.state.columns}
                    dataSource={this.state.platformData}
                    loading={this.state.loading}
                    onChange={this.onChange}
                    rowKey="name"
                />
            </div>
        );
    }
}
export default DevicemMessage;