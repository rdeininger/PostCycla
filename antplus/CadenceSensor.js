var events = require("events"); 
var Ant = require("./ant.js"); 

/// <reference path="../typings/index.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};


var Messages = Ant.Messages;
    var Constants = Ant.Constants;
    var CadenceSensorState = (function () {
        function CadenceSensorState(deviceID) {
            this.DeviceID = deviceID;
        }
        return CadenceSensorState;
    }());
    var CadenceScanState = (function (_super) {
        __extends(CadenceScanState, _super);
        function CadenceScanState() {
            _super.apply(this, arguments);
        }
        return CadenceScanState;
    }(CadenceSensorState));
    var updateState = function (sensor, state, data) {
        //get old state for calculating cumulative values
        var oldCadenceTime = state.CadenceEventTime;
        var oldCadenceCount = state.CumulativeCadenceRevolutionCount;
		var startidx = 4;
        var cadenceTime = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA +startidx);		
        cadenceTime |= data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + startidx +1) << 8;
        var cadenceCount = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + startidx +2);
        cadenceCount |= data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + startidx +3) << 8;
        if (cadenceTime !== oldCadenceTime) {
            state.CadenceEventTime = cadenceTime;
            state.CumulativeCadenceRevolutionCount = cadenceCount;
            if (oldCadenceTime > cadenceTime) {
                cadenceTime += (1024 * 64);
            }
            var cadence = ((60 * (cadenceCount - oldCadenceCount) * 1024) / (cadenceTime - oldCadenceTime));
            state.CalculatedCadence = cadence;
            if (!isNaN(state.CalculatedCadence)) {
                sensor.emit('cadenceData', state);
            }
        }        
    };
    /*
     * ANT+ profile: https://www.thisisant.com/developer/ant-plus/device-profiles/#523_tab
     * Spec sheet: https://www.thisisant.com/resources/bicycle-speed-and-cadence/
     */
    var CadenceSensor = (function (_super) {
        __extends(CadenceSensor, _super);
        function CadenceSensor(stick) {
            _super.call(this, stick);         
            this.decodeDataCbk = this.decodeData.bind(this);
        }
        CadenceSensor.prototype.attach = function (channel, deviceID) {
            _super.prototype.attach.call(this, channel, 'receive', deviceID, CadenceSensor.deviceType, 0, 255, 8086);
            this.state = new CadenceSensorState(deviceID);
        };
        CadenceSensor.prototype.decodeData = function (data) {
            var channel = data.readUInt8(Messages.BUFFER_INDEX_CHANNEL_NUM);
            var type = data.readUInt8(Messages.BUFFER_INDEX_MSG_TYPE);
            if (channel !== this.channel) {
                return;
            }
            switch (type) {
                case Constants.MESSAGE_CHANNEL_BROADCAST_DATA:
                    if (this.deviceID === 0) {
                        this.write(Messages.requestMessage(this.channel, Constants.MESSAGE_CHANNEL_ID));
                    }
                    updateState(this, this.state, data);
                    break;
                case Constants.MESSAGE_CHANNEL_ID:
                    this.deviceID = data.readUInt16LE(Messages.BUFFER_INDEX_MSG_DATA);
                    this.transmissionType = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3);
                    this.state.DeviceID = this.deviceID;
                    break;
                default:
                    break;
            }
        };
        CadenceSensor.deviceType = 122;
        return CadenceSensor;
    }(Ant.AntPlusSensor));
    exports.CadenceSensor = CadenceSensor;
    var CadenceScanner = (function (_super) {
        __extends(CadenceScanner, _super);
        function CadenceScanner(stick) {
            _super.call(this, stick);            
            this.states = {};
            this.decodeDataCbk = this.decodeData.bind(this);
        }
        CadenceScanner.prototype.scan = function () {
            _super.prototype.scan.call(this, 'receive');
        };
        CadenceScanner.prototype.decodeData = function (data) {
            if (data.length <= Messages.BUFFER_INDEX_EXT_MSG_BEGIN || !(data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN) & 0x80)) {
                console.log('wrong message format');
                return;
            }
            var deviceId = data.readUInt16LE(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 1);
            var deviceType = data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 3);
            if (deviceType !== CadenceScanner.deviceType) {
                return;
            }
            if (!this.states[deviceId]) {
                this.states[deviceId] = new CadenceScanState(deviceId);
            }
            if (data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN) & 0x40) {
                if (data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 5) === 0x20) {
                    this.states[deviceId].Rssi = data.readInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 6);
                    this.states[deviceId].Threshold = data.readInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 7);
                }
            }
            switch (data.readUInt8(Messages.BUFFER_INDEX_MSG_TYPE)) {
                case Constants.MESSAGE_CHANNEL_BROADCAST_DATA:
                    updateState(this, this.states[deviceId], data);
                    break;
                default:
                    break;
            }
        };
        CadenceScanner.deviceType = 0x79;
        return CadenceScanner;
    }(Ant.AntPlusScanner));
    exports.CadenceScanner = CadenceScanner;