import React, { PureComponent } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import {Dropdown, Icon, Menu} from 'antd';
import { isAuthenticated } from '../../utils/Session';
import './login.scss'
import Background from '../../assets/images/background.png';
import Sign from './sign'
import Register from './register'
import Retrieve from './retrieve'
import Password from './password'
import OEM from '../../assets/OEM';
import PATH from '../../assets/path';

const sectionStyle = {
    posation: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage: `url(${Background})`,
    backgroundSize: '100% 100%'
};
@withRouter
class Login extends PureComponent {

    componentDidMount () {
        if (isAuthenticated()){
            this.props.history.push('/')
        }
    }
    render () {
        const help_url = PATH.help_domain;
        const menu1 = (
            <Menu>
                <Menu.Item
                    key="16"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open(help_url + '/guide/quick_start/', '_blank')
                        }
                    }
                >
                    <Icon type="monitor" />
                    <span>
                        快速入门
                    </span>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    key="17"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open(help_url + '/guide/', '_blank')
                        }
                    }
                >
                    <Icon type="read" />
                    <span>
                        产品介绍
                    </span>
                </Menu.Item>
                <Menu.Item
                    key="18"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open(help_url + '/guide/user_guide/', '_blank')
                        }
                    }
                >
                    <Icon type="read" />
                    <span>
                        用户指南
                    </span>
                </Menu.Item>
                <Menu.Item
                    key="19"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open(help_url + '/guide/admin_guide/', '_blank')
                        }
                    }
                >
                    <Icon type="read" />
                    <span>
                        管理员指南
                    </span>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    key="20"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open(help_url + '/app_api_book/', '_blank')
                        }
                    }
                >
                    <Icon type="read" />
                    <span>
                        应用开发指南
                    </span>
                </Menu.Item>

            </Menu>
        )
        const { path } = this.props.match;
        return (
            <div className="login"
                style={sectionStyle}
            >
                <div className="header">
                    <p>
                        <img src=""
                            alt=""
                        />
                        <span>{OEM.Title}</span>
                    </p>
                    <div className="help_link">
                        {
                        OEM.Title === '冬笋云'
                        ? <span>
                            <Dropdown
                                overlay={menu1}
                                placement="bottomRight"
                            >
                            <span
                                className="ant-dropdown-link"
                                style={{padding: '10px', cursor: 'pointer'}}
                            >
                                <Icon
                                    style={{padding: '0 4px', fontWeight: 800}}
                                    type="question-circle"
                                />帮助与文档
                            </span>
                        </Dropdown>
                        <span style={{padding: '0 5px'}}> </span>
                        <a onClick={()=>{
                            window.open('https://freeioe.org/', '_blank')
                        }}
                        >
                            <Icon
                                style={{padding: '0 4px', fontWeight: 800}}
                                type="message"
                            />

                            讨论
                        </a>
                        <span style={{padding: '0 5px'}}> </span>

                        <span style={{padding: '0 5px'}}> </span>
                        <a onClick={()=>{
                            window.open('https://wiki.freeioe.org/', '_blank')
                        }}
                        >
                            <Icon
                                style={{padding: '0 4px', fontWeight: 800}}
                                type="book"
                            />

                            知识库
                        </a>
                        <span style={{padding: '0 5px'}}> </span>
                        </span>

                        : ''
                    }
                    </div>
                </div>
                <div className="main">
                    <div className="tabs">
                        <Switch>
                            <Route path={`${path}/sign`}
                                component={Sign}
                                exact
                            />
                            <Route path={`${path}/register`}
                                component={Register}
                                exact
                            />
                            <Route path={`${path}/retrieve`}
                                component={Retrieve}
                                exact
                            />
                            <Route path={`${path}/password`}
                                component={Password}
                                exact
                            />
                            <Redirect
                                from={'/login'}
                                to={`${path}/sign`}
                            />
                        </Switch>
                    </div>
                </div>
                <div className="footer">
                    {OEM.Companies} 版权所有 2021
                    <a
                        style={{color: '#fff'}}
                        onClick={()=>{
                            window.open('http://beian.miit.gov.cn/', '_blank')
                    }}
                    >
                    {OEM.BeiAn}</a>
                </div>
            </div>
        );
    }
}
export default Login;