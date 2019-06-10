import {observable, action} from 'mobx'
import Cookie from 'mobx-cookie'
import mqtt from 'mqtt';
import {message} from 'antd'

function getLocalTime (nS) {
    return new Date(parseInt(nS) * 1000).toLocaleString();
}

function makeid () {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 8; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function success (){
    console.log('success')
    message.success('连接服务器成功')
}

function error (){
    console.log('error')
    message.success('连接服务器失败')
}

const newMessageChannel = (topic, max_count) => {
    var item = observable({
        // observable 属性:
        topic: topic,
        max_count: max_count,
        data: [],
        allData: [],
        filter: undefined,
        searchType: 'content',
        isShow: true,
        newArrive: 0,
        active: false,

        // 动作:
        setTopic (value) {
            this.topic = value;
        },
        pushData (value) {
            console.log(value)
            if (this.allData.length > this.max_count) {
                message.error('达到最大条数限制，丢弃信息')
                return
            }
            this.allData.push(value)
            if (this.filter === undefined) {
                this.data.push(value)
            } else {
                if (value[this.searchType].toLowerCase().indexOf(this.filter.toLowerCase()) !== -1) {
                    this.data.push(value)
                }
            }
            if (!this.isShow) {
                this.newArrive = this.newArrive + 1
            }
        },
        clearData () {
            this.data.clear()
            this.allData.clear()
            this.newArrive = 0
        },
        setFilter (value) {
            this.filter = value
            if (this.filter) {
                this.data = this.allData.filter(item=>item[this.searchType].toLowerCase().indexOf(this.filter.toLowerCase()) !== -1);
            }
        },
        clearFilter () {
            this.filter = undefined
        },
        setSearchType (value) {
            this.searchType = value
            if (this.filter) {
                this.data = this.allData.filter(item=>item[this.searchType].toLowerCase().indexOf(this.filter.toLowerCase()) !== -1);
            }
        },
        setShow (value) {
            this.isShow = value
            if (this.isShow) {
                this.newArrive = 0
            }
        },
        setActive (value) {
            this.active = value
        },

        get Data () {
            return this.data
        },
        get AllData () {
            return this.allData
        },
        get Filter () {
            return this.filter
        },
        get SearchType () {
            return this.searchType
        },
        get NewArrived ()  {
            return this.newArrive
        },
        get Active () {
            return this.active
        }
    }, {
        setTopic: action,
        pushData: action,
        clearData: action,
        setFilter: action,
        clearFilter: action,
        setShow: action,
        setActive: action
    });
    return item;
}

class GatewayMQTT {
    _sid = new Cookie('sid');
    _user_id = new Cookie('user_id');
    @observable timer = null;
    @observable die_time = 0;
    @observable localstor = [];
    @observable maxNum = false;
    @observable flag = true;
    @observable connected = false;
    @observable gateway = '';
    @observable comm_channel = newMessageChannel('/comm');
    @observable log_channel = newMessageChannel('/log');

    CharToHex (str) {
        var out, i, len, c, h;

        out = '';
        len = str.length;
        i = 0;
        while (i < len){
            c = str.charCodeAt(i++);
            h = c.toString(16);
            if (h.length < 2){
              h = '0' + h;
            }
            out += h + ' ';
            /*                out += "\\x" + h + " ";
                            if(i > 0 && i % 8 == 0)
                                out += "\r\n";*/
        }
        return out;
    }
    base64DecodeChars = new Array(
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
      52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
      -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
      15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
      -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

    base64decode (str) {
        var c1, c2, c3, c4;
        var i, len, out;

        len = str.length;
        i = 0;
        out = '';
        while (i < len) {
            /* c1 */
            do {
                c1 = this.base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c1 === -1);
            if (c1 === -1){
                break;
            }

            /* c2 */
            do {
                c2 = this.base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c2 === -1);
            if (c2 === -1){
                break;
            }

            out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

            /* c3 */
            do {
                c3 = str.charCodeAt(i++) & 0xff;
                if (c3 === 61){
                    return out;
                }
                c3 = this.base64DecodeChars[c3];
            } while (i < len && c3 === -1);
            if (c3 === -1){
                break;
            }

            out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

            /* c4 */
            do {
                c4 = str.charCodeAt(i++) & 0xff;
                if (c4 === 61){
                    return out;
                }
                c4 = this.base64DecodeChars[c4];
            } while (i < len && c4 === -1);
            if (c4 === -1){
                break;
            }
            out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
        }
        return out;
    }

    // Keep the connection for a time (in seconds)
    tick (time) {
        this.die_time = time + 10;
        // let's say post?
    }

    startTimer (){
        this.timer = setInterval(() => {
            this.die_time = this.die_time - 1
            if (this.die_time <= 0){
                this.disconnect()
            }
        }, 1000);
    }
    stopTimer () {
        if (this.timer !== null) {
            clearInterval(this.timer)
            this.timer = null
        }
    }

    onReceiveCommMsg = (msg) => {
        const obj = {
            time: getLocalTime(msg[1]),
            direction: msg[0].split('/')[1],
            id: msg[0].split('/')[0],
            content: this.CharToHex(this.base64decode(msg[2]))
        }
        this.comm_channel.pushData(obj)
    }
    onReceiveLogMsg = (msg) => {
        msg;
        const obj = {
            time: getLocalTime(msg[1]),
            type: msg[0],
            id: msg[2].split(']:')[0] + ']',
            content: msg[2].split(']:')[1]
        }
        this.log_channel.pushData(obj)
    }
    unsubscribe (topic) {
        const topic_real = this.gateway + topic;
        if (this.client && this.connected) {
            this.client.unsubscribe(topic_real)
        }
        if (topic === '/log') {
            this.log_channel.setActive(false)
        }
        if (topic === '/comm') {
            this.comm_channel.setActive(false)
        }
    }
    disconnect (clear_data) {
        this.stopTimer()
        this.gateway = ''
        this.die_time = 0
        if (this.client){
            this.client.end()
            this.client = null;
            this.connected = false;
            this.log_channel.setActive(false)
            this.comm_channel.setActive(false)
        }
        if (clear_data) {
            this.log_channel.clearData()
            this.comm_channel.clearData()
        }
    }
    connect (sn, topic){
        this.gateway = sn;
        this.die_time = 120; // 120 seconds
        const options = {
            connectTimeout: 4000, // 超时时间
            // 认证信息
            clientId: 'webclient-' + makeid(),
            username: this._user_id.value,
            password: this._sid.value,
            keepAlive: 6000,
            timeout: 3,
            onSuccess: success,
            onFailure: error
        }
        const topic_real = sn + topic;
        if (this.client && this.connected) {
            this.client.subscribe(topic_real, 1)
            if (topic === '/log') {
                this.log_channel.setActive(true)
            }
            if (topic === '/comm') {
                this.comm_channel.setActive(true)
            }
            return
        }

        this.client = mqtt.connect('ws://ioe.thingsroot.com:8083/mqtt', options)
        this.client.on('connect', ()=>{
            message.success('连接服务器成功')
            this.connected = true
            this.client.subscribe(topic_real, 1)
            if (topic === '/log') {
                this.log_channel.setActive(true)
            }
            if (topic === '/comm') {
                this.comm_channel.setActive(true)
            }
            this.startTimer()
        })

        this.client.on('message', (msg_topic, msg)=>{
            //console.log(topic, message)
            if (msg_topic === this.gateway + '/comm') {
                const data = JSON.parse(msg.toString());
                this.onReceiveCommMsg(data)
            }
            if (msg_topic === this.gateway + '/log') {
                const data = JSON.parse(msg.toString());
                this.onReceiveLogMsg(data)
            }
        })
    }
}

export default GatewayMQTT