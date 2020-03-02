import React from 'react';
import './index.scss'
import { Row, Col} from 'antd'
import http from '../../utils/Server';
import Editable from './Editable/index'
import Edituser from './Edituser/index'
import { _getCookie } from '../../utils/Session';
import intl from 'react-intl-universal';

class ShareGroup extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            companies_list: [],
            user_list: [],
            activeKey: '',
            company: '',
            empty: false
        }
    }
    componentDidMount () {
        if (_getCookie('is_admin') !== '1') {
            this.props.history.push('/')
            return false;
        }
        this.getData()
    }
    getData = () => {
        http.get('/api/companies_list').then(res=>{
            if (res.ok) {
                if (res.data.length > 0) {
                    http.get('/api/companies_read?name=' + res.data[0]).then(data=>{
                        let arr = [];
                        http.get('/api/companies_groups_list?company=' + res.data[0]).then(groups_list=>{
                           if (groups_list.ok && groups_list.data.length > 0) {
                                data.data.groups_list = groups_list.data
                                arr.push(data.data)
                                this.setActiveKey(groups_list.data[0])
                                this.setState({
                                    companies_list: arr
                                })
                           }
                        })
                    })
                } else {
                    this.setState({
                        empty: true
                    })
                }
            }
        })
    }
    setActiveKey = (record) => {
        this.setState({
            activeKey: record.name,
            company: record.company,
            user_list: record.user_list
        })
    }
    render () {
        return (
            <div className="share-device">
                <p className="manage">{intl.get('header.Members_of_the_management')}</p>
                <Row>
                    <Col span={6}>
                        <Edituser
                            companies_list={this.state.companies_list}
                            setActiveKey={this.setActiveKey}
                            activeKey={this.state.activeKey}
                            getdata={this.getData}
                        />
                    </Col>
                    <Col span={1}/>
                    <Col span={17}>
                        <Editable
                            companies_list={this.state.companies_list}
                            activeKey={this.state.activeKey}
                            user_list={this.state.user_list}
                            getdata={this.getData}
                            company={this.state.company}
                            empty={this.state.empty}
                        />
                    </Col>
                </Row>
            </div>
        )
    }
}

export default ShareGroup