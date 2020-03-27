import React, { PureComponent } from 'react';
import { Link, withRouter } from 'react-router-dom';
import {
    Form, Icon, Input, Button, Checkbox, message
} from 'antd';
import http  from '../../../utils/Server';
import { authenticateSuccess } from '../../../utils/Session';
import Cookies from 'js-cookie'
import OEM from '../../../assets/OEM';

@withRouter
class Sign extends PureComponent {
    componentDidMount () {
        const keys = document.cookie.match(/[^ =;]+(?==)/g)
        keys && keys.length > 0 && keys.map((item, key)=>{
            Cookies.remove(keys[key])
        })
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                http.postNoToken('/api/user_login', {
                    username: values.userName,
                    password: values.password
                }).then(res=>{
                    if (res.ok) {
                        authenticateSuccess(res.data)
                        message.success('登录成功，正在跳转, 请稍后...', 3).then(()=>{
                            location.href = '/dashboard';
                        })
                    } else {
                        if (res.message === 'Incorrect password') {
                            message.info('账号密码错误，请重新输入')
                            return false;
                        }
                        if (res.message === 'User disabled or missing') {
                            message.info('用户未注册或已被禁用，请重新输入')
                            return false;
                        } else {
                            message.error('用户名与密码不匹配！请重新输入！')
                        }
                    }
                }).catch(function (error){
                    if (error){
                        message.info('系统错误，请稍后重试')
                    }
                })
            }
        });
    }
    render () {
        const { getFieldDecorator } = this.props.form;
        return (
            <div>
                <p className="title">密码登录</p>
                <Form onSubmit={this.handleSubmit}
                    className="login-form"
                >
                    <Form.Item>
                        {getFieldDecorator('userName', {
                            rules: [{ required: true, message: '请输入用户名' }]
                        })(
                            <Input prefix={
                                <Icon type="user"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                placeholder="邮件地址或用户名"
                            />
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{ required: true, message: '请输入密码!' }]
                        })(
                            <Input prefix={
                                <Icon type="lock"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                type="password"
                                placeholder="密码"
                            />
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('remember', {
                            valuePropName: 'checked',
                            initialValue: true
                        })(
                            <Checkbox>记住我！</Checkbox>
                        )}
                        {
                            OEM.Title === '冬笋云'
                            ? <Link className="login-form-forgot"
                                style={{float: 'right'}}
                                to="/login/retrieve"
                              >忘记密码</Link>
                            : ''
                        }
                        <Button type="primary"
                            htmlType="submit"
                            className="login-form-button"
                            style={{width: '100%'}}
                        >登录</Button>
                        {
                            OEM.Title === '冬笋云'
                            ? <Link to="/login/register"
                                style={{display: OEM.Title === '冬笋云' ? 'block' : 'none', height: '60px', float: 'right'}}
                              >免费注册</Link>
                            : <div style={{height: '60px'}}></div>
                        }
                    </Form.Item>
                </Form>
            </div>

        );
    }
}
export default Form.create({ name: 'normal_login' })(Sign);