import React, { Component } from 'react';
import { Modal, Select, message, Input } from 'antd';
import { withRouter } from 'react-router-dom';
import { inject, observer} from 'mobx-react';
import FileTree from './FileTree';
import CodeEditor from './Editor';
import './style.scss';
import codeStore from './codeStore'

import http from '../../utils/Server';
const Option = Select.Option;
const { TextArea } = Input;

@withRouter
@inject('store')
@observer
class AppEditorCode extends Component {
    constructor (props){
        super(props);
        this.state = {
            codeStore: new codeStore(),
            app: '',
            appName: '',
            version: '',
            visible: false,
            newVersion: 0,
            isShow: false,
            versionList: [],
            comment: '',
            selectedFile: '',
            selectedFileType: '',
            isAddFileShow: false,
            isAddFolderShow: false,
            isEditorFileShow: false,
            fileNodes: [],
            currentNode: 1,
            selectedKeys: ['version'],
            treeNode: {}
        }
    }
    componentDidMount () {
        let app = this.props.match.params.app;
        let appName = this.props.match.params.name;
        this.setState({
            appName: appName,
            app: app
        }, () => {
            if (app !== '') {
                this.loadWorkspace()
            }
        });
    }

    componentWillUnmount () {
    }

    notifyVersionDiff () {
        //提示：当前工作区是基于版本initVersion,
        // 请将设备中的应用升级到版本initVersion，或者将工作区重置到之前版本。
        const {initVersion} = this.state
        this.info('版本提示',
            '当前工作区是基于版本' + initVersion,
            '请将设备中的应用升级到版本' + initVersion,
            '或者将工作区重置到之前版本.'
        );
    }

    checkVersionAndLoad () {
        const {version, app} = this.state
        http.get('/apis/api/method/app_center.api.get_latest_version?app=' + app + '&beta=' + 1)
        .then(data=>{
            let latestVersion = data.message;
            console.log(latestVersion);
            this.setState({latestVersion: latestVersion})
            if (latestVersion === undefined || latestVersion === 0){
                this.info('版本提示', '暂时还没有版本，请先上传!');
                return
            }

            if (version !== latestVersion) {
                if (version !== undefined && version !== 0) {
                    //提示当前工作区是会基于worksapceVersion，当前的最新版本为latest_version（弹框）
                    this.info('版本提示', '当前工作区是会基于版本    ' + version + '，当前的最新版本为    ' + latestVersion + '.');
                } else {
                    message.info('初始化工作区')
                    this.resetWorkspace(latestVersion)
                }
            } else if (version === latestVersion ) {
                this.loadVersionList()
                // TODO:
                //this.info('版本提示', '当前工作区是基于最新版本' + latestVersion + '.');
            }
        });
    }
    loadVersionList () {
        const {app} = this.state
        //应用版本列表
        http.get('/apis/api/method/app_center.api.get_versions?app=' + app + '&beta=1')
            .then(res=>{
                let data = [];
                res.message && res.message.length > 0 && res.message.map((v)=>{
                    data.push(v.version)
                });
                data.sort(function (a, b) {
                    return b - a;
                });
                this.setState({ versionList: data })
            });
    }
    resetWorkspace (version) {
        const {app} = this.state
        //初始化工作区域到最新版本
        http.get('/apis/api/method/app_center.editor.editor_init?app=' + app + '&version=' + version)
        .then(res=>{
            let version = res.message;
            // console.log(initVersion);
            this.setState({ version: version  });
            window.location.reload();
        })
    }

    loadWorkspace () {
        const {codeStore, app} = this.state
        codeStore.setShowFileName('version')
        //设备应用和平台应用对比
        http.get('/apis/api/method/app_center.editor.editor_workspace_version?app=' + app)
            .then(res=>{
                let worksapceVersion = res.message;
                this.setState({version: worksapceVersion ? worksapceVersion : 0}, () => {
                    this.checkVersionAndLoad()
                })
            });
    }


    //提示弹框
    info = (title, content)=>{
        Modal.info({
            title: title,
            content: (
                <div>
                    <p>{content}</p>
                </div>
            ),
            onOk () {}
        });
    };

    //发布新版本
    show = () => {
        this.setState({
            isShow: true
        });
    };
    hide = () => {
        this.setState({
            isShow: false
        });
    };
    versionChange = (e)=>{
        const { value } = e.target;
        this.setState({
            newVersion: value
        })
    };
    commentChange = (e)=>{
        const { value } = e.target;
        this.setState({
            comment: value
        })
    };
    newVersion = ()=>{
        const {codeStore} = this.state
        http.post('/apis/api/method/app_center.editor.editor_release?app=' + this.state.app +
            '&operation=set_content&version=' + this.state.newVersion +
            '&comment=' + this.state.comment)
            .then(res=>{
                message.success(res.message + ', 即将跳转到新版本！');
            });
        setTimeout(()=>{
            this.setState({
                isShow: false
            });
            codeStore.change();
            window.location.reload()
        }, 1500)
    };

    onSelect = (dataNode) => {
       this.setState({
           selectedFile: dataNode.key,
           selectedFileType: dataNode.type
       })
    };

    onContentChange () {
        console.log('changed')
    }

    render () {
        const {
            versionList,
            app,
            appName,
            selectedFile,
            selectedFileType,
            visiable,
            isShow,
            newVersion,
            comment
        } = this.state;
        return (
            <div className="appEditorCode">
                <div className="main">
                    <div className="tree">
                        <FileTree
                            app={app}
                            onSelect={this.onSelect}
                            appName={appName}
                        />
                    </div>
                    <div className="code">
                        <CodeEditor
                            app={app}
                            filePath={selectedFile}
                            fileType={selectedFileType}
                            onChange={this.onContentChange}
                        />
                    </div>
                </div>
                <Modal
                    title="重置编辑器工作区内容版本到"
                    visible={visiable}
                    onOk={this.resetVersion}
                    onCancel={this.hideModal}
                    okText="确认"
                    cancelText="取消"
                >
                    <span style={{padding: '0 20px'}}>版本</span>
                    <Select
                        defaultValue="请选择..."
                        style={{ width: 350 }}
                    >
                        {
                            versionList && versionList.length > 0 && versionList.map((v)=>{
                                return (
                                    <Option
                                        key={v}
                                        onClick={()=>{
                                            this.getVersion(v)
                                        }}
                                    >
                                        {v}
                                    </Option>
                                )
                            })
                        }
                    </Select>
                </Modal>
                <Modal
                    title="发布新版本"
                    visible={isShow}
                    onOk={this.newVersion}
                    onCancel={this.hide}
                    okText="确认"
                    cancelText="取消"
                >
                    <p style={{display: 'flex'}}>
                        <span style={{padding: '5px 20px'}}>填写版本</span>
                        <Input
                            type="text"
                            defaultValue={newVersion}
                            style={{width: '320px'}}
                            onChange={this.versionChange}
                        />
                    </p>
                    <br/>

                    <p style={{display: 'flex'}}>
                        <span style={{padding: '0 20px'}}>更新日志</span>
                        <TextArea
                            row={8}
                            style={{width: '320px'}}
                            defaultValue={comment}
                            onChange={this.commentChange}
                        />
                    </p>
                </Modal>
            </div>
        );
    }
}

export default AppEditorCode;