import React from 'react';
import http from '../../../utils/Server';
import {inject, observer} from 'mobx-react';

@inject('store')
@observer
class SonTable extends React.Component {
    componentDidMount () {
        let name = this.props.data.name;
        let arr = [];
        arr.push(name);
        let params = {
            category: this.props.category,
            activities: arr,
            disposed: 1
        };
        console.log(params);
        // http.post('/api/activities_dispose', params).then(res=>{
        //     console.log(res.data)
        // });
        http.post('/api/activities_dispose', params).then(res=>{
            console.log(res);
        }).catch(err=>{
            console.log(err)
        });
        //过滤数据
        let data = this.props.store.codeStore.tableData;
        data && data.length > 0 && data.map((v, key)=>{
            key;
            if (v.name === name) {
                v.disposed = 1
            }
        });
        this.props.store.codeStore.setPlatformData(data);
        this.props.store.codeStore.setTableData(data);
    }

    render () {
        const { data } = this.props;
        return (
            <div className="SonTable">
                <ul>
                    <li><span>标题：</span>{data.title}</li>
                    <li><span>所属设备序列号：</span>{data.device}</li>
                    <li><span>发生时间：</span>{data.creation}</li>
                    <li><span>触发用户名：</span>{data.fullName}</li>
                    <li><span>执行结果：</span>{data.status}</li>
                    <li><span>记录类型：</span>{data.operation}</li>
                    <li><span>详情信息：</span>{data.message}</li>
                    {/*<li><span>是否确认消息：</span>{data.dieposed}</li>*/}
                    <li><span>确认消息用户：</span>{data.disposed_by ? data.disposed_by : this.props.store.session.user_id}</li>
                </ul>
            </div>
        )
    }
}
export default SonTable;