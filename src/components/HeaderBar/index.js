import React, { PureComponent } from 'react';
import { Icon, message, Menu, Dropdown } from 'antd';
import { withRouter, Link} from 'react-router-dom';
import { _getCookie, isAuthenticated, authenticateClear } from '../../utils/Session';
import http  from '../../utils/Server';
import path from '../../assets/path';

@withRouter
class HeaderBar extends PureComponent {
    state = {
        page: ''
    }
    componentDidMount () {
        if (this.props.location.pathname.indexOf('appstore') !== -1 || this.props.location.pathname.indexOf('appitems') !== -1) {
            this.setState({
                page: 'appstore'
            })
        }
        if (this.props.location.pathname.indexOf('enterprise') !== -1) {
            this.setState({
                page: 'enterprise'
            })
        }
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.location.pathname.indexOf('appstore') === -1 && nextProps.location.pathname.indexOf('enterprise') === -1) {
            this.setState({
                page: ''
            })
        }
        if (nextProps.location.pathname.indexOf('appitems') !== -1) {
            this.setState({
                page: 'appstore'
            })
        }
        if (!isAuthenticated()) {
            this.props.history.push('/login')
        }
    }
    render () {
        const {page} = this.state;
        const menu1 = (
            <Menu>
                <Menu.Item
                    key="16"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open(path.help_domain + '/guide/quick_start/', '_blank')
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
                            window.open(path.help_domain + '/guide/', '_blank')
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
                            window.open(path.help_domain + '/guide/user_guide/', '_blank')
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
                            window.open(path.help_domain + '/guide/admin_guide/ ', '_blank')
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
                            window.open(path.help_domain + '/app_api_book/', '_blank')
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
        const menu = (
            <Menu style={{width: 160}}>
                <Menu.Item
                    key="12"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            this.props.history.push('/account')
                        }
                    }
                >
                    <Icon type="setting"/>
                    <span>
                        个人设置
                    </span>
                </Menu.Item>
                <Menu.Item
                    key="13"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            this.props.history.push('/virtualgateways')
                        }
                    }
                >
                    <Icon type="laptop" />
                    <span>
                        虚拟网关
                    </span>
                </Menu.Item>

                <Menu.Item
                    key="14"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            this.props.history.push('/accesskeys')
                        }
                    }
                >
                    <Icon type="key" />
                    <span>
                        Accesskeys
                    </span>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    key="15"
                    style={{lineHeight: '30px'}}
                    onClick={()=>{
                        http.post('/api/user_logout').then(res=>{
                            res;
                            authenticateClear();
                            message.success('退出成功,即将跳转至登录页', 1.5).then(()=>{
                                location.href = '/'
                            })
                        }).catch(err=>{
                            err;
                            message.error('退出失败!!')
                        });
                    }}
                >
                    <Icon type="poweroff" />
                    <span>
                        退出登录
                    </span>
                </Menu.Item>
            </Menu>
        );
        return (
            <div className="headerUser">
                <Link
                    to="/appstore"
                    style={{marginRight: '15px'}}
                    className={page === 'appstore' ? 'the_selected' : ''}
                    onClick={()=>{
                        this.setState({
                            page: 'appstore'
                        })
                    }}
                ><Icon type="appstore"/>&nbsp;&nbsp;应用市场</Link>
                <Link
                    to="/enterprise/shared"
                    className={page === 'enterprise' ? 'the_selected' : ''}
                    onClick={()=>{
                        this.setState({
                            page: 'enterprise'
                        })
                    }}
                >
                    <span
                        className="ant-dropdown-link"
                        style={{padding: '10px', cursor: 'pointer'}}
                    >
                        <Icon
                            style={{padding: '0 4px', fontWeight: 800}}
                            type="global"
                        />
                        企业
                    </span>
                </Link>
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
                <Dropdown
                    overlay={menu}
                    placement="bottomRight"
                    style={{marginRight: 20}}
                >
                    <span
                        className="ant-dropdown-link"
                        style={{padding: '10px', cursor: 'pointer'}}
                    >
                        <Icon type="user"/>
                        {
                            decodeURI(_getCookie('full_name').split(' ')[0])
                        }
                    </span>
                </Dropdown>
            </div>
        );
    }
}
export default HeaderBar;