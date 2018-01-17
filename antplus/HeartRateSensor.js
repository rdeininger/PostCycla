var events = require("events"); 
var Ant = require("./ant.js"); 

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

    var Constants = Ant.Constants;
    var Messages = Ant.Messages;
    var HeartRateSensorState = (function () {
        function HeartRateSensorState(deviceId) {
            this.DeviceID = deviceId;
        }
        return HeartRateSensorState;
    }());
    var HeartRateScannerState = (function (_super) {
        __extends(HeartRateScannerState, _super);
        function HeartRateScannerState() {
            _super.apply(this, arguments);
        }
        return HeartRateScannerState;
    }(HeartRateSensorState));
    var PageState;
    (function (PageState) {
        PageState[PageState["INIT_PAGE"] = 0] = "INIT_PAGE";
        PageState[PageState["STD_PAGE"] = 1] = "STD_PAGE";
        PageState[PageState["EXT_PAGE"] = 2] = "EXT_PAGE";
    })(PageState || (PageState = {}));
    var HeartRateSensor = (function (_super) {
        __extends(HeartRateSensor, _super);
        function HeartRateSensor(stick) {
            _super.call(this, stick);
            this.pageState = PageState.INIT_PAGE; // sets the state of the receiver - INIT, STD_PAGE, EXT_PAGE
            this.decodeDataCbk = this.decodeData.bind(this);
        }
        HeartRateSensor.prototype.attach = function (channel, deviceID) {
            _super.prototype.attach.call(this, channel, 'receive', deviceID, HeartRateSensor.deviceType, 0, 255, 8070);
            this.state = new HeartRateSensorState(deviceID);
        };
        HeartRateSensor.prototype.decodeData = function (data) {
            if (data.readUInt8(Messages.BUFFER_INDEX_CHANNEL_NUM) !== this.channel) {
                return;
            }
            switch (data.readUInt8(Messages.BUFFER_INDEX_MSG_TYPE)) {
                case Constants.MESSAGE_CHANNEL_BROADCAST_DATA:
                case Constants.MESSAGE_CHANNEL_ACKNOWLEDGED_DATA:
                case Constants.MESSAGE_CHANNEL_BURST_DATA:
                    if (this.deviceID === 0) {
                        this.write(Messages.requestMessage(this.channel, Constants.MESSAGE_CHANNEL_ID));
                    }
                    var page = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA);
                    if (this.pageState === PageState.INIT_PAGE) {
                        this.pageState = PageState.STD_PAGE; // change the state to STD_PAGE and allow the checking of old and new pages
                    }
                    else if ((page !== this.oldPage) || (this.pageState === PageState.EXT_PAGE)) {
                        this.pageState = PageState.EXT_PAGE; // set the state to use the extended page format
                        switch (page & ~HeartRateSensor.TOGGLE_MASK) {
                            case 1:
                                //decode the cumulative operating time
                                this.state.OperatingTime = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
                                this.state.OperatingTime |= data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 2) << 8;
                                this.state.OperatingTime |= data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3) << 16;
                                this.state.OperatingTime *= 2;
                                break;
                            case 2:
                                //decode the Manufacturer ID
                                this.state.ManId = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
                                //decode the 4 byte serial number
                                this.state.SerialNumber = this.deviceID;
                                this.state.SerialNumber |= data.readUInt16LE(Messages.BUFFER_INDEX_MSG_DATA + 2) << 16;
                                this.state.SerialNumber >>>= 0;
                                break;
                            case 3:
                                //decode HW version, SW version, and model number
                                this.state.HwVersion = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
                                this.state.SwVersion = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 2);
                                this.state.ModelNum = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3);
                                break;
                            case 4:
                                //decode the previous heart beat measurement time
                                this.state.PreviousBeat = data.readUInt16LE(Messages.BUFFER_INDEX_MSG_DATA + 2);
                                break;
                            default:
                                break;
                        }
                    }
                    // decode the last four bytes of the HRM format, the first byte of this message is the channel number
                    this.DecodeDefaultHRM(data.slice(Messages.BUFFER_INDEX_MSG_DATA + 4));
                    this.oldPage = page;
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
        HeartRateSensor.prototype.DecodeDefaultHRM = function (pucPayload) {
            // decode the measurement time data (two bytes)
            this.state.BeatTime = pucPayload.readUInt16LE(0);
            // decode the measurement count data
            this.state.BeatCount = pucPayload.readUInt8(2);
            // decode the measurement count data
            this.state.ComputedHeartRate = pucPayload.readUInt8(3);
            this.emit('hbdata', this.state);
        };
        HeartRateSensor.deviceType = 120;
        HeartRateSensor.TOGGLE_MASK = 0x80;
        return HeartRateSensor;
    }(Ant.AntPlusSensor));
    exports.HeartRateSensor = HeartRateSensor;
    var HeartRateScanner = (function (_super) {
        __extends(HeartRateScanner, _super);
        function HeartRateScanner(stick) {
            _super.call(this, stick);
            this.states = {};
            this.pageState = PageState.INIT_PAGE;
            this.decodeDataCbk = this.decodeData.bind(this);
        }
        HeartRateScanner.prototype.scan = function () {
            _super.prototype.scan.call(this, 'receive');
        };
        HeartRateScanner.prototype.decodeData = function (data) {
            if (data.length <= Messages.BUFFER_INDEX_EXT_MSG_BEGIN || !(data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN) & 0x80)) {
                console.log('wrong message format');
                return;
            }
            var deviceId = data.readUInt16LE(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 1);
            var deviceType = data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 3);
            if (deviceType !== HeartRateScanner.deviceType) {
                return;
            }
            if (!this.states[deviceId]) {
                this.states[deviceId] = new HeartRateScannerState(deviceId);
            }
            if (data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN) & 0x40) {
                if (data.readUInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 5) === 0x20) {
                    this.states[deviceId].Rssi = data.readInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 6);
                    this.states[deviceId].Threshold = data.readInt8(Messages.BUFFER_INDEX_EXT_MSG_BEGIN + 7);
                }
            }
            switch (data.readUInt8(Messages.BUFFER_INDEX_MSG_TYPE)) {
                case Constants.MESSAGE_CHANNEL_BROADCAST_DATA:
                case Constants.MESSAGE_CHANNEL_ACKNOWLEDGED_DATA:
                case Constants.MESSAGE_CHANNEL_BURST_DATA:
                    var page = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA);
                    if (this.pageState === PageState.INIT_PAGE) {
                        this.pageState = PageState.STD_PAGE; // change the state to STD_PAGE and allow the checking of old and new pages
                    }
                    else if ((page !== this.oldPage) || (this.pageState === PageState.EXT_PAGE)) {
                        this.pageState = PageState.EXT_PAGE; // set the state to use the extended page format
                        switch (page & ~HeartRateScanner.TOGGLE_MASK) {
                            case 1:
                                //decode the cumulative operating time
                                this.states[deviceId].OperatingTime = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
                                this.states[deviceId].OperatingTime |= data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 2) << 8;
                                this.states[deviceId].OperatingTime |= data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3) << 16;
                                this.states[deviceId].OperatingTime *= 2;
                                break;
                            case 2:
                                //decode the Manufacturer ID
                                this.states[deviceId].ManId = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
                                //decode the 4 byte serial number
                                this.states[deviceId].SerialNumber = this.deviceID;
                                this.states[deviceId].SerialNumber |= data.readUInt16LE(Messages.BUFFER_INDEX_MSG_DATA + 2) << 16;
                                this.states[deviceId].SerialNumber >>>= 0;
                                break;
                            case 3:
                                //decode HW version, SW version, and model number
                                this.states[deviceId].HwVersion = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
                                this.states[deviceId].SwVersion = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 2);
                                this.states[deviceId].ModelNum = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3);
                                break;
                            case 4:
                                //decode the previous heart beat measurement time
                                this.states[deviceId].PreviousBeat = data.readUInt16LE(Messages.BUFFER_INDEX_MSG_DATA + 2);
                                break;
                            default:
                                break;
                        }
                    }
                    // decode the last four bytes of the HRM format, the first byte of this message is the channel number
                    this.DecodeDefaultHRM(deviceId, data.slice(Messages.BUFFER_INDEX_MSG_DATA + 4));
                    this.oldPage = page;
                    break;
                default:
                    break;
            }
        };
        HeartRateScanner.prototype.DecodeDefaultHRM = function (deviceId, pucPayload) {
            // decode the measurement time data (two bytes)
            this.states[deviceId].BeatTime = pucPayload.readUInt16LE(0);
            // decode the measurement count data
            this.states[deviceId].BeatCount = pucPayload.readUInt8(2);
            // decode the measurement count data
            this.states[deviceId].ComputedHeartRate = pucPayload.readUInt8(3);
            this.emit('hbdata', this.states[deviceId]);
        };
        HeartRateScanner.deviceType = 120;
        HeartRateScanner.TOGGLE_MASK = 0x80;
        return HeartRateScanner;
    }(Ant.AntPlusScanner));
    exports.HeartRateScanner = HeartRateScanner;
