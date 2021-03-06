import React, {Fragment} from 'react';
import {Table, Input, Popconfirm, Form, Button, Modal, message} from 'antd';
import {inject, observer} from 'mobx-react';
import { withRouter } from 'react-router-dom';
import http from '../../../../../utils/Server';
import './style.scss';
import { _getCookie } from '../../../../../utils/Session';
const EditableContext = React.createContext();

class EditableCell extends React.Component {
    getInput = () => {
        const {dataIndex} = this.props;
        if (dataIndex === 'phone') {
            return <Input type="number"/>;
        }
        return <Input />;
    };


    renderCell = ({ getFieldDecorator }) => {
        const {
            editing,
            dataIndex,
            title,
            inputType,
            record,
            index,
            children,
            ...restProps
        } = this.props;
        index, inputType;
        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item style={{ margin: 0 }}>
                        {getFieldDecorator(dataIndex, {
                            rules: [
                                {
                                    required: true,
                                    message: `Please Input ${title}!`
                                }
                            ],
                            initialValue: record[dataIndex]
                        })(this.getInput())}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };

    render () {
        return <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>;
    }
}
@withRouter
@inject('store')
@observer
class EditableTable extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            data: [],
            user_list: [],
            record: {},
            loading: true,
            editingKey: '',
            visibleMember: false,
            visible: false,
            confirmDirty: false,
            type: 'text',
            password_visible: false,
            new_password: '',
            enter_new_password: '',
            user: ''
        };
        this.columns = [
            {
                title: '姓名',
                dataIndex: 'full_name',
                width: '15%',
                editable: true
            }, {
                title: '用户名',
                dataIndex: 'name',
                width: '25%',
                editable: true
            }, {
                title: '手机号',
                dataIndex: 'mobile_no',
                width: 150,
                editable: true
            },
            {
                title: '操作',
                dataIndex: 'operation',
                width: '180px',
                render: (text, record) => {
                    const { editingKey } = this.state;
                    const editable = this.isEditing(record);
                    return editable ? (
                        <span>
              <EditableContext.Consumer>
                {form => (
                    <Button
                        type="primary"
                        onClick={() => this.save(form, record.idx, record)}
                        style={{ marginRight: 8 }}
                    >
                        保存
                    </Button>
                )}
              </EditableContext.Consumer>
              <Popconfirm
                  title="Sure to cancel?"
                  onClick={() => this.cancel(record.key)}
              >
                <Button>取消</Button>
              </Popconfirm>
            </span>
                    ) : (
                        <Fragment style={{width: '150px'}}>
                            <Button
                                type="primary"
                                disabled={editingKey !== ''}
                                onClick={() => {
                                    // this.EditUser(record)
                                    // this.ChangeThePassword(record)
                                    this.setState({
                                        record: record,
                                        password_visible: true
                                    })
                                }}
                                style={{marginRight: '20px'}}
                            >
                                修改密码
                            </Button>
                            <Popconfirm
                                title="确定要从公司组移除此成员吗?"
                                onConfirm={() => this.delete(record)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="danger"
                                    disabled={editingKey !== ''}
                                >移除</Button>
                            </Popconfirm>
                        </Fragment>
                    );
                }
            }
        ];
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.empty && this.state.loading) {
            this.setState({
                loading: false
            })
        }
        if (nextProps.user_list !== this.props.user_list) {
            this.setState({
                loading: true
            })
            if (nextProps.user_list.length > 0) {
                this.mapGetUserinfo(nextProps.user_list, 0)
            } else {
                this.mapGetUserinfo([])
            }
        }
    }
    EditUser = (record) =>{
        this.setState({
            visibleMember: true,
            status: 'updateUser',
            record: record
        }, ()=>{
            this.props.form.setFieldsValue({
                name: undefined
            })
        })
    }
    mapGetUserinfo = (arr, index) => {
        let list = []
        if (index !== 0) {
            list = this.state.user_list
        }
        if (arr.length > 0) {
            if (index !== undefined && index < arr.length) {
                http.get('/api/companies_users_read?name=' + arr[index].user).then(res=>{
                    if (res.ok) {
                        list.push(res.data)
                        this.setState({
                            user_list: list
                        }, ()=>{
                            this.mapGetUserinfo(arr, index + 1)
                        })
                    }
                })
            } else {
                this.setState({
                    data: this.state.user_list,
                    loading: false
                })
            }
        } else {
            this.setState({
                data: [],
                loading: false
            })
        }
    }
    isEditing = record => record.name === this.state.editingKey;

    cancel = () => {
        this.setState({ editingKey: '' });
    };
    delete = (record) => {
        http.post('/api/companies_groups_remove_user', {
            name: this.props.activeKey,
            user: record.name
        }).then(res=>{
            if (res.ok) {
                this.props.getdata()
                message.success('删除用户成功！')
            }
        })
    };

    save (form, key, record) {
        form.validateFields((error, row) => {
            // if (error) {
            //     return;
            // }
            const data = {
                name: record.name,
                company: record.company,
                group_name: row.group_name,
                role: 'Admin',
                description: ''
            }
            data;
        });
    }

    edit (key) {
        this.setState({ editingKey: key });
    }
    handleOkMember = e => {
        e;
        this.setState({
            visibleMember: true
        });
    };
    handleCancelMember = e => {
        e;
        this.setState({
            visibleMember: false,
            status: '',
            type: 'text'
        }, ()=>{
            this.props.form.setFieldsValue({
                name: undefined
            })
        });
    };
    addMember=()=> {
        this.setState({
            visibleMember: true
        });
    };
    validateToNextPassword = (rule, value, callback) => {
        const { form } = this.props;
        if (value && this.state.confirmDirty) {
            form.validateFields(['confirm'], { force: true });
        }
        callback();
    };
    handleConfirmBlur = e => {
        const { value } = e.target;
        this.setState({ confirmDirty: this.state.confirmDirty || !!value });
    };

    compareToFirstPassword = (rule, value, callback) => {
        const { form } = this.props;
        if (value && value !== form.getFieldValue('password')) {
            callback('两次输入不一致!');
            this.errPassword = false
        } else {
            this.errPassword = true
            callback();
        }
    };
    setNewPassword = (e, name) => {
        const val = e.target.value;
        this.setState({
            [name]: val
        })
    }
    ChangeThePassword = () => {
        const {new_password, enter_new_password, record} = this.state;
        if (new_password !== enter_new_password) {
            message.error('两次密码输入不匹配！')
            return false;
        }
        if (new_password.length < 6) {
            message.error('请最少输入六位长度密码！')
        }
        const datas = {
            name: record.name,
            first_name: record.first_name,
            last_name: record.last_name,
            mobile_no: record.mobile_no,
            new_password
        }
        http.post('/api/companies_users_update', datas).then(res=>{
            this.setState({
                visibleMember: false,
                status: '',
                type: 'text',
                password_visible: false,
                new_password: '',
                enter_new_password: ''
            })
            if (res.ok) {
                message.success('修改用户密码成功！')
                // this.props.getdata()
            } else {
                message.error(res.error)
            }
        })
    }
    handleSubmit = e => {
        e.preventDefault();
        this.props.form.setFieldsValue({
            name: ''
        })
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values);
            }
                if (values.firstname !== undefined &&
                    values.lastname !== undefined &&
                    values.phone !== undefined &&
                    values.user !==  undefined &&
                    values.password !== undefined &&
                    values.confirm !== undefined &&
                    this.errPassword ) {
                    if (!this.props.activeKey) {
                        return false;
                    }
                    const data = {
                        user: values.user,
                        email: values.user,
                        mobile_no: values.phone,
                        first_name: values.firstname,
                        last_name: values.lastname,
                        new_password: values.password,
                        company: this.props.company
                    }
                    http.post('/api/companies_users_create', data).then(res=>{
                        if (res.ok) {
                            http.post('/api/companies_groups_add_user', {name: this.props.activeKey, user: res.data}).then(result=>{
                                if (result.ok) {
                                    message.success('创建用户成功！')
                                    this.props.getdata()
                                }
                            })
                        } else {
                            message.error(res.error)
                        }
                    })
                    this.setState({
                        visibleMember: false,
                        status: '',
                        type: 'text'
                    })
                }
        });
    };
    invitation = () => {
        const data = {
            company: _getCookie('companies'),
            user: this.state.user
        }
        if (this.state.user === _getCookie('user_id')){
            message.error('管理员已是组中成员!')
            return false;
        }
        http.post('/api/companies_employees_invite', data).then(res=>{
            if (res.ok) {
                message.success('邀请成功，请等待用户接受邀请！')
            }
            this.setState({
                visible: false
            })
        })
    }
    render () {
        const components = {
            body: {
                cell: EditableCell
            }
        };

        const columns = this.columns.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    inputType: 'text',
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: this.isEditing(record)
                })
            };
        });
        const { getFieldDecorator } = this.props.form;

        return (
            <div className="member_wrap">
                <Button
                    icon={this.state.loading ? 'loading' : 'loading-3-quarters'}
                    onClick={this.props.getdata}
                    className="member_wrap_update_button"
                    disabled={this.state.loading}
                >
                    刷新
                </Button>
                <Button
                    onClick={()=>{
                        this.setState({visibleMember: true})
                    }}
                    type="primary"
                    className="member_wrap_add_button"
                    // style={{
                    //     marginTop: '20px'
                    // }}
                    disabled={this.props.activeKey === ''}
                >
                    新建账户
                </Button>
                <Button
                    onClick={()=>{
                        this.setState({visible: true})
                    }}
                    type="primary"
                    className="member_wrap_invitation_button"
                    // style={{
                    //     marginTop: '20px'
                    // }}
                    disabled={this.props.activeKey === ''}
                >
                    邀请平台账户加入
                </Button>
                <EditableContext.Provider value={this.props.form}>
                    <Table
                        components={components}
                        bordered
                        loading={this.state.loading}
                        dataSource={this.state.data}
                        columns={columns}
                        rowClassName="editable-row"
                        rowKey="email"
                        // pagination={false}
                        size="small"
                    />
                </EditableContext.Provider>
                <Modal
                    title={(this.state.status === 'updateUser' ? '修改' : '添加') + '企业成员'}
                    visible={this.state.visibleMember}
                    onOk={this.handleOkMember}
                    onCancel={this.handleCancelMember}
                    footer={null}
                    maskClosable={false}
                    destroyOnClose
                >
                    <Form onSubmit={this.handleSubmit} >
                        <Form.Item label="用户">
                            {getFieldDecorator('user', {
                                initialValue: this.state.status === 'updateUser' ? this.state.record.name : '',
                                rules: [
                                    {
                                        required: this.state.status === 'updateUser' ? false : true,
                                        message: '请输入用户'
                                    }
                                ]
                            })(<Input disabled={this.state.status === 'updateUser'} />)}
                        </Form.Item>
                        <Form.Item label="姓">
                            {getFieldDecorator('firstname', {
                                initialValue: this.state.status === 'updateUser' ? this.state.record.first_name : '',
                                rules: [
                                    {
                                        required: this.state.status === 'updateUser' ? false : true,
                                        message: '请输入姓'
                                    }
                                ]
                            })(
                                <Input
                                    type="text"
                                    disabled={this.state.status === 'updateUser'}
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="名">
                            {getFieldDecorator('lastname', {
                                initialValue: this.state.status === 'updateUser' ? this.state.record.last_name : '',
                                rules: [
                                    {
                                        required: this.state.status === 'updateUser' ? false : true,
                                        message: '请输入名'
                                    }
                                ]
                            })(
                                <Input
                                    type="text"
                                    disabled={this.state.status === 'updateUser'}
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="手机号码">
                            {getFieldDecorator('phone', {
                                initialValue: this.state.status === 'updateUser' ? this.state.record.mobile_no : '',
                                rules: [
                                    {
                                        required: this.state.status === 'updateUser' ? false : true,
                                        message: '请输入手机号码'
                                    }
                                ]
                            })(
                                <Input
                                    type="number"
                                    disabled={this.state.status === 'updateUser'}
                                />
                            )}
                        </Form.Item>
                        <Form.Item
                            label="新密码"
                            hasFeedback
                        >
                            {getFieldDecorator('password', {
                                rules: [
                                    {
                                        required: this.state.status === 'updateUser' ? false : true,
                                        message: '请输入密码!'
                                    },
                                    {
                                        validator: this.validateToNextPassword
                                    }
                                ]
                            })(
                            <Input
                                type={this.state.type}
                                onClick={()=>{
                                    this.setState({
                                        type: 'password'
                                    })
                                }}
                            />
                                )}
                        </Form.Item>
                        <Form.Item
                            label="确认新密码"
                            hasFeedback
                        >
                            {getFieldDecorator('confirm', {
                                rules: [
                                    {
                                        required: this.state.status === 'updateUser' ? false : true,
                                        message: '请确认输入的密码'
                                    },
                                    {
                                        validator: this.compareToFirstPassword
                                    }
                                ]
                            })(
                            <Input
                                onBlur={this.handleConfirmBlur}
                                type={this.state.type}
                                onClick={()=>{
                                    this.setState({
                                        type: 'password'
                                    })
                                }}
                            />
                            )}
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{marginRight: '20px'}}
                            >
                                确认
                            </Button>
                            <Button onClick={this.handleCancelMember}>取消</Button>
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    visible={this.state.visible}
                    title="邀请用户加入公司组"
                    onOk={this.invitation}
                    onCancel={()=>{
                        this.setState({visible: false})
                    }}
                    okText="确定"
                    cancelText="放弃"
                    maskClosable={false}
                    destroyOnClose
                >
                    <span>用户名:</span>
                    <Input
                        placeholder="请输入要邀请的成员账户"
                        onChange={(e)=>{
                            this.setState({
                                user: e.target.value
                            })
                        }}
                    />
                </Modal>
                <Modal
                    visible={this.state.password_visible}
                    title={'修改企业成员：' + this.state.record.name + ' 的密码'}
                    onOk={this.ChangeThePassword}
                    onCancel={()=>{
                        this.setState({password_visible: false})
                    }}
                    okText="确定修改"
                    cancelText="放弃修改"
                    maskClosable={false}
                    destroyOnClose
                >
                    <div className="member_wrap_flex">
                        <span>请输入密码：</span>
                        <Input
                            type="password"
                            placeholder="请输入六位以上密码"
                            value={this.state.new_password}
                            onChange={e => {
                                this.setNewPassword(e, 'new_password')
                            }}
                        /></div>
                    <div className="member_wrap_flex">
                        <span>请再次输入密码：</span>
                        <Input
                            type="password"
                            placeholder="请再次输入密码"
                            value={this.state.enter_new_password}
                            onChange={e => {
                                this.setNewPassword(e, 'enter_new_password')
                            }}
                        /></div>
                </Modal>
            </div>

        );
    }
}

const EditableFormTable = Form.create()(EditableTable);

export default EditableFormTable