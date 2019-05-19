import React, { Component } from 'react';
import { Button, Switch, Popconfirm, message, Modal, Input } from 'antd';
import http from '../../../../utils/Server';
import { withRouter } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import MyGatesAppsUpgrade from '../../../Upgrade';
import { _getCookie } from '../../../../utils/Session';
let timer;
function cancel () {
    message.error('You have canceled the update');
  }
@withRouter
@observer
@inject('store')
class Action extends Component {
    state = {
        visible: false,
        loading: false,
        setName: false
    }
    componentDidMount (){
        console.log(this.props)
    }
    componentWillUnmount (){
      clearInterval(this.t1);
      clearInterval(timer)
    }
    confirm = (record, sn)=>{
        console.log(this)
       if (!this.props.store.appStore.actionSwi) {
        const data = {
          gateway: sn,
          inst: record.device_name,
          id: `app_remove/${sn}/${record.device_name}/${new Date() * 1}`
        }
        http.postToken('/api/gateways_applications_remove', data).then(res=>{
          console.log(res)
          if (res.data){
            timer = setInterval(() => {
              http.get('/api/gateways_exec_result?id=' + res.data).then(result=>{
                if (result.ok) {
                  if (result.data) {
                    if (result.data.result) {
                      message.success('应用卸载成功,请稍后...')
                      clearInterval(timer)
                    } else if (result.data.result === false) {
                      message.error('应用卸载失败，请重试')
                      clearInterval(timer)
                    }
                  }
                }
              })
            }, 1000);
          }
        })
       }
      }
      handleCancel = e => {
        console.log(e);
        this.setState({
          visible: false
        });
      };
      showModal = (type) => {
        this.setState({
          [type]: true
        }, ()=>{
            console.log(this.state.visible)
        });
      }
      setAutoDisabled (record, props){
        const { sn } = this.props.match.params;
        let type = props ? 0 : 1;
        const data = {
          gateway: sn,
          inst: record.device_name,
          option: 'auto',
          value: type,
          id: `option/${sn}/${record.sn}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_option', data).then(res=>{
          if (res.ok){
            timer = setInterval(() => {
              http.get('/api/gateways_exec_result?id=' + res.data).then(result=>{
                if (result.ok) {
                  if (result.data.result){
                    message.success('设置设备自动' + (type === '1' ? '启动' : '停止') + '成功，请稍后...')
                    clearInterval(timer)
                  } else {
                    clearInterval(timer)
                    message.error(result.data.message)
                  }
                }
              })
            }, 3000);
          }
        })
      }
      handleOk = () => {
        const {record} = this.props;
        console.log(record)
        this.setState({ visible: true });
        const data = {
          gateway: this.props.match.params.sn,
          app: record.name,
          inst: record.device_name,
          version: record.latestVersion,
          conf: {},
          id: `sys_upgrade/${this.props.match.params.sn}/${new Date() * 1}`
        }
        http.postToken('/api/gateways_applications_upgrade', data).then(res=>{
          timer = setInterval(() => {
              http.get('/api/gateways_exec_result?id=' + res.data).then(res=>{
                  if (res.ok){
                      message.success('应用升级成功')
                      clearInterval(timer)
                  } else if (res.ok === false){
                      message.error('应用升级操作失败，请重试');
                      clearInterval(timer)
                  }
              })
          }, 3000);
      })
        setTimeout(() => {
          this.setState({ loading: false, visible: false });
        }, 3000);
      }
      appSwitch = (type) =>{
        let action = '';
        if (type === 'stop'){
          action = '关闭'
        } else if (type === 'start'){
          action = '开启'
        } else {
          action = '重启'
        }
          const data = type === 'stop' || type === 'restart' ? {
            gateway: this.props.match.params.sn,
            inst: this.props.record.device_name,
            reason: 'reason',
            id: `gateways/${type}/${this.props.match.params.sn}/${new Date() * 1}`
        } : {
            gateway: this.props.match.params.sn,
            inst: this.props.record.device_name,
            id: `gateways/${type}/${this.props.match.params.sn}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_' + type, data).then(res=>{
            if (res.ok) {
              this.t1 = setInterval(() => {
                http.get('/api/gateways_exec_result?id=' + res.data).then(result=>{
                  if (result.ok) {
                    if (result.data.result){
                      message.success(action + '应用成功，请稍后...')
                      clearInterval(this.t1)
                    } else {
                      clearInterval(this.t1)
                      message.error(result.data.message)
                    }
                  }
                })
              }, 3000);
            }
        })
      }
    render () {
        const { actionSwi } = this.props.store.appStore;
        console.log(this.props.record)
        const { record } = this.props;
        const { loading, visible, setName, nameValue } = this.state;
        return (
            <div style={{position: 'relative', paddingBottom: 50}}>
              <div style={{lineHeight: '30px', paddingLeft: 20}}>
                <div>
                  应用名称:{record.data && record.data.data.name || '本地应用'}
                </div>
                <div>
                  应用开发者：{record.data && record.data.data.owner || _getCookie('companies')}
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-around', marginTop: 20, minWidth: 840, position: 'absolute', right: 20, bottom: 15}}>
                <Button
                    disabled={actionSwi}
                    onClick={()=>{
                        this.showModal('setName')
                    }}
                >
                    更改名称
                </Button>
                <Button
                    disabled
                >
                    应用配置
                </Button>
                <Button
                    disabled
                >
                    应用调试
                </Button>
                <Button
                    disabled={record.latestVersion <= record.version || actionSwi}
                    onClick={()=>{
                        this.showModal('visible')
                    }}
                >
                    更新版本
                </Button>
                    <Button
                        onClick={()=>{
                          this.appSwitch('start')
                        }}
                        disabled={actionSwi}
                    >
                        启动应用
                      </Button>
                    <Button
                        disabled={actionSwi}
                        onClick={()=>{
                          this.appSwitch('stop')
                        }}
                    >
                        关闭应用
                      </Button>
                      <Button
                          onClick={()=>{
                            this.appSwitch('restart')
                          }}
                      >
                        重启应用
                      </Button>
                <div style={{paddingTop: 5}}>
                    <span>开机自启:</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Switch checkedChildren="ON"
                        unCheckedChildren="OFF"
                        defaultChecked={Number(record.auto) === 0 ? false : true}
                        disabled={actionSwi}
                        onChange={()=>{
                            this.setAutoDisabled(record, record.auto)
                        }}
                    />
                </div>
                <Popconfirm
                    disabled={actionSwi}
                    title="Are you sure update this app?"
                    onConfirm={()=>{
                        this.confirm(record, this.props.match.params.sn, this)
                    }}
                    onCancel={cancel}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button
                        disabled={actionSwi}
                        type="danger"
                    >应用卸载</Button>
                  </Popconfirm>
                    <Modal
                        visible={visible}
                        title="应用升级详情"
                        onOk={this.handleOk}
                        destroyOnClose
                        onCancel={this.handleCancel}
                        footer={[
                        <Button
                            key="back"
                            onClick={this.handleCancel}
                        >
                            取消
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={loading}
                            onClick={this.handleOk}
                        >
                            升级
                        </Button>
                        ]}
                    >
                    <MyGatesAppsUpgrade
                        version={record.version}
                        inst={record.device_name}
                        sn={this.props.match.params.sn}
                        app={record.name}
                    />
                    </Modal>
                    <Modal
                        visible={setName}
                        title="更改实例名"
                        onOk={()=>{
                            // this.setState({setName: false})
                            http.post('/api/gateways_applications_rename', {
                                gateway: this.props.match.params.sn,
                                inst: record.device_name,
                                new_name: nameValue,
                                id: `gateway/rename/${nameValue}/${new Date() * 1}`
                            })
                        }}
                        destroyOnClose
                        onCancel={()=>{
                            this.setState({setName: false})
                        }}
                    >
                        <span>实例名: </span>
                        <Input
                            defaultValue={record.device_name}
                            onChange={(e)=>{
                                this.setState({nameValue: e.target.value})
                            }}
                        />
                    </Modal>
              </div>
            </div>
        );
    }
}

export default Action;