import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Input, Rate, Icon, Button, message, notification  } from 'antd';
import { inject, observer} from 'mobx-react';
import Status from '../../common/status';
import http from '../../utils/Server';
import marked from 'marked';
import highlight from 'highlight.js';
import 'highlight.js/styles/github.css';
import './style.scss';
import Nav from './Nav';
import AppConfig from './AppConfig'
const Search = Input.Search;
const openNotification = (title, message) => {
    notification.open({
        message: title,
        description: message,
        placement: 'buttonRight'
    });
};

@withRouter
@inject('store')
@observer
class MyGatesAppsInstall extends Component {
    state = {
        app: '',
        vendor: [],
        agreement: [],
        type: [],
        data: [],
        flag: true,
        item: {},
        detail: true,
        filter: {
            ventor: '',
            agreement: '',
            type: ''
        },
        instName: null,
        config: [],
        isTemplateShow: false,
        addTempList: [],
        showTempList: [],
        deviceList: [],
        object: {},
        editingKey: '',
        deviceColumns: [],
        deviceSource: [],
        SourceCode: [],
        dataSourceCode: [],
        errorMessage: '',
        keys: [],
        selectSection: 'socket',
        tcp: [
            {
                'name': 'ip',
                'desc': 'IP地址',
                'type': 'text',
                'value': '192.168.1.132'
            },
            {
                'name': 'host',
                'desc': '端口',
                'type': 'number',
                'value': 502
            },
            {
                'name': 'nodelay',
                'desc': 'Nodelay',
                'type': 'boolean',
                'value': true
            }
        ],
        serial: [
            {
                'name': 'tty',
                'desc': '端口',
                'type': 'dropdown',
                'value': ['ttymcx0', 'ttymcx1']
            },
            {
                'name': 'baudrate',
                'desc': '波特率',
                'type': 'dropdown',
                'value': [4800, 9600, 115200, 19200]
            },
            {
                'name': 'stop_bits',
                'desc': '停止位',
                'type': 'dropdown',
                'value': [1, 2]
            },
            {
                'name': 'data_bits',
                'desc': '数据位',
                'type': 'dropdown',
                'value': [8, 7]
            },
            {
                'name': 'flow_control',
                'desc': '流控',
                'type': 'boolean',
                'value': false
            },
            {
                'name': 'parity',
                'desc': '校验',
                'type': 'dropdown',
                'value': ['None', 'Even', 'Odd']
            }
        ]
    };

    componentDidMount (){
        if (this.props.match.params.type === '1') {
            http.get('/api/store_list').then(res=>{
                this.setState({
                    data: res.data,
                    filterdata: res.data
                })
            });
            marked.setOptions({
                renderer: new marked.Renderer(),
                gfm: true,
                tables: true,
                breaks: false,
                pedantic: false,
                sanitize: false,
                smartLists: true,
                smartypants: false,
                xhtml: false,
                highlight: (code) =>  highlight.highlightAuto(code).value // 这段代码
            });
        } else if (this.props.match.params.type === '2') {
            http.get('/api/applications_details?name=' + this.props.match.params.app).then(res=>{
                this.getConfig(res.data)
            })

        }
    }

    shouldComponentUpdate (nextProps, nextState){
        if (nextState.item.description && nextState.item.description !== null){
            document.getElementById('box').innerHTML = marked(nextState.item.description)
        }
        return true;
    }

    searchApp (value){
        let { filterdata } = this.state;
        let newdata = [];
        newdata = filterdata.filter((item)=>item.app_name.indexOf(value) !== -1);
        this.setState({
            data: newdata
        })
    }

    onChange = (newValue)=>{
        this.props.store.codeStore.setInstallConfiguration(newValue)
    };
    //添加模板
    templateShow = ()=>{
        this.setState({
            isTemplateShow: true
        });
    };

    handleCancelAddTempList = ()=>{
        this.setState({
            isTemplateShow: false
        })
    };

    protocolChange = (val)=>{   //通讯
        if (val === 'serial') {
            this.setState({
                selectSection: 'serial'
            });
        } else if (val === 'socket') {
            this.setState({
                selectSection: val
            });
        }
    };

    getConfig = (val)=>{
        this.props.store.codeStore.setActiveKey('1');
        this.props.store.codeStore.setErrorCode();
        this.props.store.codeStore.setInstallConfiguration('{}');
        this.props.store.codeStore.setInstNames('');
        let config = [];
        if (val.conf_template) {
            let con = val.conf_template.replace(/[\r\n]/g, '');
            let cons = con.replace(/\s+/g, '');
            config = JSON.parse(cons);
        }
        let deviceColumns = [];
        let tableName = [];  //存放表名
        let dataSource = {};
        let keys = [];
        config && config.length > 0 && config.map((v, key)=>{
            keys.push(v);
            key;
            if (v.type !== 'templates' ||
                v.type !== 'table' ||
                v.type !== 'text' ||
                v.type !== 'number' ||
                v.type !== 'dropdown'
            ) {
                this.props.store.codeStore.setReadOnly(false);
                this.props.store.codeStore.setErrorCode()
            }
            if (v.child === undefined) {
                this.props.store.codeStore.setErrorCode();
                this.props.store.codeStore.setReadOnly(false)
            }
            if (v.name === 'device_section') {
                let tableNameData = {};
                v.child && v.child.length && v.child.map((w, key1)=>{
                    tableNameData[w.name] = [];
                    key1;
                    let arr = [];
                    w.cols.map((i, key2)=>{
                        key2;
                        arr.push({
                            key: key2,
                            name: i.name,
                            desc: i.desc,
                            type: i.type
                        });
                    });
                    tableName.push(w.name);
                    deviceColumns.push({
                        [w.name]: arr
                    })
                });
                this.props.store.codeStore.setAllTableData(tableNameData);
            }
        });
        //设置store存储数据
        tableName && tableName.length > 0 && tableName.map((w)=>{
            dataSource[w] = [];
        });
        this.props.store.codeStore.setDataSource(dataSource);
        let columnsArr = [];
        deviceColumns && deviceColumns.length > 0 && deviceColumns.map((v, key)=>{
            key;
            let data = [];
            let name = tableName[key];
            v[name].map((w, indexW)=>{
                data.push({
                    key: indexW,
                    id: w.type,
                    title: w.desc,
                    dataIndex: w.name,
                    editable: true
                });
            });
            columnsArr.push({[tableName[key]]: data})
        });
        let obj = {};
        columnsArr.map((item)=>{
            obj[Object.keys(item)] = Object.values(item)
        });
        http.get('/api/application_configurations_list?app=' + val.name + '&conf_type=Template').then(res=>{
            console.log(res);
            this.setState({
                addTempList: res.data
            })
        });
        console.log(obj)
        this.setState({
            flag: false,
            item: val,
            detail: true,
            config: config,
            deviceColumns: obj,
            keys: keys,
            app: val.name
        });
        if (this.props.match.params.type === '2') {
            this.setState({
                flag: false,
                detail: false
            });
            this.props.store.codeStore.setActiveKey('2')
        }
        this.props.store.codeStore.setInstallConfiguration(val.pre_configuration);
        console.log(val.pre_configuration);
    };

    getData = ()=>{
        const { tcp, serial, selectSection, keys } = this.state;
        let sourceCodeData = {};
        keys.map((item, key)=>{
            key;
            if (item.name === 'Link_type') {
                let data = [];
                if (selectSection === 'socket') {
                    tcp.map((v, key)=>{
                        key;
                        data.push({
                            [v.name]: this.refs[v.name].value === undefined ? v.value : this.refs[v.name].value
                        })
                    });
                    sourceCodeData['socket'] = data;
                } else if (selectSection === 'serial') {
                    serial.map((v, key)=>{
                        key;
                        if (v.value[0] === undefined) {
                            data.push({
                                [v.name]: this.refs[v.name].value === undefined ? v.value : this.refs[v.name].value
                            })
                        } else {
                            data.push({
                                [v.name]: this.refs[v.name].value === undefined ? v.value[0] : this.refs[v.name].value
                            })
                        }
                    });
                    sourceCodeData['serial'] = data;
                }
            } else if (item.type === 'table') {
                sourceCodeData[item.name] = this.props.store.codeStore.allTableData;
            } else if (item.type === 'templates') {
                sourceCodeData[item.name] = {};
            } else if (item.type === 'dropdown') {
                sourceCodeData[item.name] = this.refs[item.name].value === undefined ? item.value[0] : this.refs[item.name].value;
            } else if (item.type === 'number' || item.type === 'text') {
                sourceCodeData[item.name] = this.refs[item.name].value === undefined ? item.value : this.refs[item.name].value
            }
        });
        if (JSON.stringify(sourceCodeData) !== '{}') {
            this.props.store.codeStore.setInstallConfiguration(JSON.stringify(sourceCodeData))
        }

    };

    submitData = ()=>{
        this.getData();
        let { app } = this.state;
        let sn = this.props.match.params.sn;
        let version = 0;
        console.log(this.props.store.codeStore.userBeta);
        let url = '';
        if (this.props.store.codeStore.userBeta === 1) {
            url = '/api/applications_versions_latest?beta=1&app='
        } else {
            url = '/api/applications_versions_latest?app='
        }
        http.get(url + app).then(res=>{
            version = res.data;
            if (version > 0) {
                let params = {
                    gateway: sn,
                    inst: this.props.store.codeStore.instNames,
                    app: app,
                    version: version,
                    conf: this.props.store.codeStore.installConfiguration,
                    id: 'app_install/' + sn + '/' + this.props.store.codeStore.instNames + '/' + app
                };
                if (this.props.store.codeStore.instNames === '' || this.props.store.codeStore.instNames === undefined) {
                    message.error('实例名不能为空！')
                }
                http.post('/api/gateways_applications_install', params).then(res=>{
                    openNotification('提交任务成功', '网关' + sn + '安装' + this.props.store.codeStore.instNames + '应用.');
                    setTimeout(()=>{
                        this.setState({
                            details: true
                        })
                    }, 1000);
                    let max = 18000;
                    let min = 0;
                    if (res.ok === true) {
                        if (min > max) {
                            openNotification('安装应用' + this.props.store.codeStore.instNames + '失败', '错误：' + res.data.message)
                        } else {
                                let timer = setInterval(()=>{
                                    min += 5000;
                                    setTimeout(()=>{
                                        http.get('/api/gateways_exec_result?id=' + res.data.data)
                                            .then(res=>{
                                                if (JSON.stringify(res) !== '{}') {
                                                    if (res.data.result === true) {
                                                        openNotification('安装应用' + this.props.store.codeStore.instNames + '成功', '' + res.data.id);
                                                        clearInterval(timer);
                                                    } else if (res.data.result === false) {
                                                        openNotification('安装应用' + this.props.store.codeStore.instNames + '失败', '' + res.data.message);
                                                        clearInterval(timer);
                                                    }
                                                }
                                            })
                                    }, 1000)
                                }, 5000)
                            }
                    } else {
                        openNotification('安装应用' + this.refs.inst.value + '失败', '' + res.data.message);
                    }
                })
            } else {
                if (this.props.store.codeStore.userBeta === 1) {
                    message.error('应用暂时没有正式版本，无法安装！')
                } else {
                    message.error('应用暂时没有正式版本，无法安装！')
                }
            }
        });
    };

    callback = (key)=>{
        const { errorCode } = this.props.store.codeStore;
        if (key === '1') {
            this.props.store.codeStore.setActiveKey(key);
        } else if (key === '2') {
            this.props.store.codeStore.setActiveKey(key);
        }

        if (errorCode === true || this.state.config.length === 0) {
            this.props.store.codeStore.setReadOnly(false);
        } else if (this.state.config && this.state.config.length > 0 || errorCode === false) {
            this.getData();
        }
    };

    render () {
        const { data, flag, item, detail, config, deviceColumns, selectSection, tcp, serial } = this.state;

        return (<div>
            <Status />
                <div className="AppInstall">
                    <Nav />
                    <div className={flag ? 'hide appsdetail' : 'show appsdetail'}>
                    <Button
                        className="installbtn"
                        type="primary"
                        onClick={()=>{
                            this.setState({detail: !detail})
                        }}
                    >
                        {
                            detail ? '安装到网关' : '查看应用描述'
                        }
                    </Button>
                        <Icon
                            type="rollback"
                            className="back"
                            onClick={()=>{
                                this.props.store.codeStore.setActiveKey('1');
                                this.props.store.codeStore.setInstallConfiguration('{}');
                                this.setState({
                                    flag: true
                                })
                        }}
                        />
                        <h2 style={{borderBottom: '1px solid #ccc', padding: 10}}>{item.app_name}</h2>
                        <div className={detail ? 'show' : 'hide'}>
                            <div style={{display: 'flex' }}>
                                {
                                    item.icon_image
                                    ? <img src={'http://ioe.thingsroot.com/' + item.icon_image}
                                        alt=""
                                        style={{width: 128, height: 128}}
                                      />
                                    : ''
                                }
                                <div style={{display: 'flex', paddingTop: 20, paddingLeft: 20}}>
                                    <div style={{width: 500}}
                                        className="detail"
                                    >
                                        <p>发布者： {item.app_name_unique}</p>
                                        <p>通讯协议: {item.protocol}</p>
                                        <p>适配型号： {item.device_serial}</p>
                                    </div>
                                    <div  className="detail">
                                        <p>应用分类： {item.category}</p>
                                        <p>设备厂家: {item.device_supplier}</p>
                                        <p>应用价格： 免费</p>
                                    </div>
                                </div>
                            </div>
                            <div
                                id="box"
                                style={{marginTop: 20}}
                            >
                                markdown
                            </div>
                        </div>
                        <div className={detail ? 'installapp hide' : 'installapp show'}>
                            <AppConfig
                                tcp={tcp}
                                serial={serial}
                                selectSection={selectSection}
                                config={config}
                                configuration={this.props.store.codeStore.installConfiguration}
                                deviceColumns={deviceColumns}
                                submitData={this.submitData}
                            />
                        </div>
                    </div>
                    <div className={flag ? 'show' : 'hide'}>
                        <div className="installheader">
                           <div className="searchlist">
                               <Search
                                   key="33"
                                   placeholder="搜索应用名"
                                   onSearch={(value)=>{
                                       this.searchApp(value)
                                   }}
                                   style={{ width: 200 }}
                               />
                               <Icon
                                   className="rollback"
                                   type="rollback"
                                   onClick={()=>{
                                       this.props.history.go(-1)
                                   }}
                               />
                           </div>
                       </div>
                       <div className="installcontent">
                           {
                               data && data.length > 0 && data.map((val, ind)=>{
                                   return (
                                       <div key={ind}
                                           className="item"
                                       >
                                           <img src={`http://ioe.thingsroot.com/${val.icon_image}`}
                                               alt="logo"
                                               onClick={()=>{
                                                   this.getConfig(val);
                                               }}
                                           />
                                           <div className="apptitle">
                                               <p>{val.app_name}</p>
                                               <div>
                                                   <Rate disabled
                                                       defaultValue={val.star}
                                                       size="small"
                                                   />
                                                   <span onClick={()=>{
                                                       this.setState({
                                                           flag: false,
                                                           detail: false,
                                                           item: val
                                                       })
                                                   }}
                                                   ><Icon type="cloud-download" /></span>
                                               </div>
                                           </div>
                                        </div>)
                               })
                           }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default MyGatesAppsInstall;