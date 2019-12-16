import React, { PureComponent } from 'react'
import {Form, Input, Button, message, Result, Skeleton} from 'antd';
import http from '../../utils/Server';
import './style.scss';
import { _getCookie } from '../../utils/Session';
const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 8 }
  };
  const formTailLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 8, offset: 4 }
  };
class DynamicRule extends PureComponent {
    constructor (props) {
        super(props)

        this.state = {
            checkNick: false,
            status: null,
            flag: false,
            loading: true
        }
    }
    componentDidMount () {
        if (Number(_getCookie('is_developer')) === 1) {
            this.props.history.go(-1)
        }
        http.get('/api/developers_requisition_list').then(res=>{
            if (res.ok) {
                if (res.data.length > 0) {
                    let status = null;
                    res.data.map(item=>{
                        if (item.docstatus === 0) {
                            status = 0;
                        }
                        if (item.docstatus === 2 && status !== 0) {
                            status = 2;
                        }
                    })
                    this.setState({
                        status,
                        loading: false
                    })
                } else {
                    this.setState({
                        flag: true,
                        loading: false
                    })
                }
            }
        })
    }
    check = () => {
        this.props.form.validateFields((err, values) => {
          if (!err) {
            console.info('success');
          }
          const data = {
            user: _getCookie('user_id'),
            nickname: values.username,
            id_card: values.idcardnumber,
            address: values.address
          }
          http.post('/api/developers_requisition_create', data).then(res=>{
              if (res.ok) {
                  message.success('申请成功！等待后台审核中，请耐心等候！')
              } else {
                  message.error('申请失败，错误信息:' + res.error)
              }
          })
        });
    };
    render () {
        const { getFieldDecorator } = this.props.form;
        const {loading, flag, status} = this.state;
    return (
      <div className="app_developer">
        <div className="app_developer_title">申请成为开发者</div>
        {
            loading
            ? <Skeleton active />
            : flag
                ? <div>
                <Form.Item
                    {...formItemLayout}
                    label="姓名"
                >
                    {getFieldDecorator('username', {
                        rules: [
                        {
                            required: true,
                            message: '请输入您的姓名'
                        }
                        ]
                    })(<Input placeholder="请输入您的姓名" />)}
                </Form.Item>
                <Form.Item
                    {...formItemLayout}
                    label="身份证号码"
                >
                    {getFieldDecorator('idcardnumber', {
                        rules: [
                        {
                            required: true,
                            message: '请输入正确的身份证号码',
                            pattern: /^[1-9]\d{5}(18|19|20|(3\d))\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
                        }
                        ]
                    })(<Input placeholder="请输入您的身份证号码" />)}
                </Form.Item>
                <Form.Item
                    {...formItemLayout}
                    label="地址"
                >
                    {getFieldDecorator('address', {
                        rules: [
                        {
                            required: true,
                            message: '请输入您的地址'
                        }
                        ]
                    })(<Input placeholder="请输入您的地址" />)}
                </Form.Item>
                <Form.Item
                    {...formItemLayout}
                    label="手机号"
                >
                    {getFieldDecorator('phone', {
                        rules: [
                        {
                            required: true,
                            message: '请输入您的手机号',
                            pattern: /^1([38][0-9]|4[579]|5[0-3,5-9]|6[6]|7[0135678]|9[89])\d{8}$/
                        }
                        ]
                    })(<Input placeholder="请输入您的电话" />)}
                </Form.Item>
                <Form.Item {...formTailLayout}>
                    <Button
                        type="primary"
                        onClick={this.check}
                    >
                        提交申请
                    </Button>
                </Form.Item>
            </div>
                : status !== null
                    ? <Result
                        title={status === 0 ? '您的申请正在处理中，请耐心等候...' : '您的申请已被拒绝,请重新提交资料后重试！'}
                        extra={
                            status !== 0
                            ? <Button
                                type="primary"
                                key="console"
                                onClick={()=>{
                                    this.setState({
                                        flag: true
                                    })
                                }}
                              >
                                  重新申请
                            </Button>
                        : ''
                        }
                      />
                    // status === 0
                    //     ? '申请中'
                    //     : '被拒绝'
                    : ''
        }
      </div>
    );
    }
}
const AppDeveloper = Form.create({ name: 'dynamic_rule' })(DynamicRule);
export default AppDeveloper