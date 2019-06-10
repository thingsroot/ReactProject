import React, { Component } from 'react';
import { withRouter} from 'react-router-dom';
import { Button, Alert, Input, Select } from 'antd';
import {inject, observer} from 'mobx-react';
import http from '../../../utils/Server';
import './style.scss';
import ReactList from 'react-list';
// import App from './action';
let data_len = 0;
const Search = Input.Search;
const Option = Select.Option;
@withRouter
@inject('store')
@observer
class Logviewer extends Component {
    state = {
        data: [],
        flag: true,
        searchflag: true,
        maxNum: false,
        value: '',
        connected: false,
        searchtype: 'content',
        type: '',
        title: ''
    }
    componentDidMount (){
        this.props.store.appStore.cleartime()
        this.t1 = setInterval(()=>this.tick(), 59000);
        this.props.store.appStore.isleave = false;
        this.props.store.appStore.lognum = 0;
        const pathname = this.props.location.pathname.toLowerCase();
        if (pathname.indexOf('message') !== -1){
            this.setState({
                title: '报文',
                type: '/comm'
            })
        } else {
            this.setState({
                title: '日志',
                type: '/log'
            })
        }
        if (this.props.match.params.sn !== this.props.store.appStore.mqttSN && this.props.store.appStore.mqttSN !== ''){
            this.props.store.appStore.client.end();
            this.props.store.appStore.flag =  true;
            this.props.store.appStore.data =  [];
            this.props.store.appStore.connected =  false;
            this.props.store.appStore.client = null;
            clearInterval(this.t1)
        }
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.location.pathname !== this.props.location.pathname){
            if (this.props.store.appStore.client) {
                this.props.store.appStore.client.end();
                this.props.store.appStore.flag =  true;
                this.props.store.appStore.data =  [];
                this.props.store.appStore.connected =  false;
                this.props.store.appStore.client = null;
                clearInterval(this.t1)
                this.tick('0')
            }
        }
    }
    componentDidUpdate () {
        if (data_len !== this.props.store.appStore.data.length) {
            data_len = this.props.store.appStore.data.length;
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
        this.tick(180)
        this.props.store.appStore.isleave = true;
        this.props.store.appStore.countdown();
    }
    tick (time){
            const data = {
                duration: time || 60,
                name: this.props.match.params.sn,
                id: `sys_enable_log/${this.props.match.params.sn}/${new Date() * 1}`
            }
            http.post('/api/gateways_enable_log', data)
    }
    handleChange = (value)=> {
        this.props.store.appStore.searchtype =  value.key
      }
    filter = (valu)=>{
        const value = valu.toLowerCase();
        if (value) {
            this.props.store.appStore.value = value;
            this.props.store.appStore.data = this.props.store.appStore.newdata.filter(item=>item[this.props.store.appStore.searchtype].toLowerCase().indexOf(value) !== -1)
        } else {
            this.props.store.appStore.value = '';
            this.props.store.appStore.data = this.props.store.appStore.newdata;
        }
    }
    closeEnableLog =()=>{
        const data = {
            duration: 0,
            name: this.props.match.params.sn,
            id: `sys_enable_log/${this.props.match.params.sn}/${new Date() * 1}`
        }
        http.post('/api/gateways_enable_log', data)
    }
    onClose = ()=>{
        this.setState({maxNum: false})
    }
    render () {
        const { data } = this.props.store.appStore;
        return (
            <div style={{position: 'relative'}}>
                <div className="opwrap">
                    {
                        this.props.store.appStore.flag
                        ? <Button type="primary"
                            onClick={()=>{
                                this.tick()
                                this.t1;
                                this.props.store.appStore.connect(this.props.match.params.sn, this.state.type)
                            }}
                          >订阅{this.state.title}</Button>
                    : <Button type="danger"
                        onClick={()=>{
                                this.closeEnableLog()
                                clearInterval(this.t1)
                                this.props.store.appStore.flag = true;
                                this.props.store.appStore.client.end()
                                this.props.store.appStore.connected = false;
                                // this.refs.content.innerHTML = '';
                        }}
                      >取消订阅</Button>
                    }
                    <span style={{padding: '0 5px'}} />
                    <Button type="danger"
                        onClick={()=>{
                            this.props.store.appStore.newdata = [];
                            this.props.store.appStore.arr = [];
                            this.props.store.appStore.data = [];
                        }}
                    >清除</Button>
                    <span style={{padding: '0 10px'}} >当前报文数量：{data.length}</span>
                </div>
                <div className="searwrap">
                    <Select
                        labelInValue
                        defaultValue={{ key: 'content' }}
                        style={{ width: 120 }}
                        onChange={this.handleChange}
                    >
                        <Option value="content">内容</Option>
                        <Option value="id">ID</Option>
                        <Option value="type">类型</Option>
                    </Select>
                    <span style={{padding: '0 5px'}} />
                    <Search
                        placeholder="input search text"
                        onSearch={this.filter}
                        enterButton
                    />
                </div>
                {
                    this.state.maxNum
                    ? <Alert
                        message="超出最大数量"
                        description="日志最大数量一千条，请清除后再重新订阅！"
                        type="error"
                        closable
                        onClose={this.onClose}
                      />
                    : ''
                }
                <div
                    ref="table"
                    className="logview"
                >
                    <div style={{width: '100%'}}>
                        <div className="tableHeaders">
                            <div>时间</div>
                            <div>类型</div>
                            <div>实例ID</div>
                            <div>内容</div>
                        </div>
                            <div
                                className="tableContent"
                                id="tbody"
                            >
                                <div
                                    style={{height: 600, overflowY: 'auto'}}
                                >
                                    <ReactList
                                        pageSize={1}
                                        ref="content"
                                        axis="y"
                                        type="simple"
                                        length={data.length}
                                        itemRenderer={(key)=>{
                                            return (<div key={key}>
                                                <div className="tableHeaders">
                                                    <div>{data[key].time}</div>
                                                    <div>{data[key].type}</div>
                                                    <div>{data[key].id}</div>
                                                    <div>{data[key].content}</div>
                                                </div>
                                            </div>)
                                        }}
                                    />
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Logviewer;