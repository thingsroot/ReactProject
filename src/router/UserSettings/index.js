import React, { PureComponent } from 'react';
import { Button, message } from 'antd';
import './style.scss';
import http from '../../utils/Server';
import {_getCookie, _setCookie} from '../../utils/Session';
import ResetPasswordCreateForm from './resetPassword';
class UserSettings extends PureComponent {
    state = {
        info: {},
        company: '',
        isAdmin: '',
        visible: false
    };
    componentDidMount () {
        let isAdmin = _getCookie('isAdmin');
        let user = _getCookie('user_id');
        this.setState({
            isAdmin: isAdmin
        });
        http.get('/api/user_read?name=' + user).then(res=>{
            let role = '';
            let groups = res.data.groups;
            groups && groups.length > 0 && groups.map((v, key)=>{
                key;
                role = v.role;
            });
            this.setState({
                info: res.data,
                company: res.data.companies[0],
                isAdmin: role
            })
        })
    }
    showModal = () => {
        this.setState({ visible: true });
    };

    handleCancel = () => {
        this.setState({ visible: false });
    };

    handleCreate = () => {
        const form = this.formRef.props.form;
        form.validateFields((err, values) => {
            if (err) {
                return;
            }
            let data = {
                old_password: values.oldPassword,
                new_password: values.password
            };
            http.post('/api/user_update_password', data).then(res=>{
                res;
                message.success('修改密码成功，请重新登陆！', 1.5).then(()=>{
                    location.href = '/';
                })
                _setCookie('T&R_auth_token', '');
            }).catch(err=>{
                err;
                message.success('修改密码失败！')
            });
        });
    };

    saveFormRef = (formRef) => {
        this.formRef = formRef;
    };
    render () {
        const { info, company, isAdmin } = this.state;
        return (
            <div className="userSettings">
                <div>
                    <p><span>|</span>基本资料</p>
                    <p><span>账户全称：</span><span>{info.first_name}{info.last_name}</span></p>
                    <p><span>账户ID：</span><span>{info.name}</span></p>
                    <br/>
                    <Button
                        type="primary"
                        onClick={this.showModal}
                    >更改密码</Button>
                    <ResetPasswordCreateForm
                        wrappedComponentRef={this.saveFormRef}
                        visible={this.state.visible}
                        onCancel={this.handleCancel}
                        onCreate={this.handleCreate}
                    />
                </div>
                <div>
                    <p><span>|</span>联系信息</p>
                    <p><span>手机号：</span><span>{info.phone}</span></p>
                    <p><span>邮箱：</span><span>{info.name}</span></p>
                </div>
                <div>
                    <p><span>|</span>公司信息</p>
                    <p><span>所属公司：</span><span>{company}</span></p>
                    <p><span>身份角色：</span><span>{isAdmin ? '管理员' : '普通用户'}</span></p>
                </div>
            </div>
        );
    }
}
export default UserSettings;