/// <reference path="../../JavaScriptLibrary/jabra.browser.integration-2.0.d.ts" />

const inputStatTitle = document.getElementById("inputStatTitle");
const outputStatTitle = document.getElementById("outputStatTitle");
const inputStat = document.getElementById("inputStat");
const outputStat = document.getElementById("outputStat");

const connectedDevices = document.getElementById("connectedDevices");
const connectedDevicesList = document.getElementById("connectedDevicesList");
const selectDevice = document.getElementById("selectDevice");

const localVideo = document.getElementById('localVideo');

const boomArmSection = document.getElementById('boomArmSection');
const backgroundNoiseSection = document.getElementById('backgroundNoiseSection');
const audioExposureSection = document.getElementById('audioExposureSection');
const callOveriewSection = document.getElementById('callOveriewSection');


const boomArmStatusText = document.getElementById('boomArmStatusText');
const boomArmKnown = document.getElementById('boomArmKnown');
const boomArmUnknown = document.getElementById('boomArmUnknown');
const noteBoomArmProblem = document.getElementById('noteBoomArmProblem');

const noiseBar = document.getElementById('noiseBar');
const noiseKnown = document.getElementById('NoiseKnown');
const noiseUnknown = document.getElementById('NoiseUnknown');

const exposureBar = document.getElementById('exposureBar');
const exposureKnown = document.getElementById('ExposureKnown');
const exposureUnknown = document.getElementById('ExposureUnknown');


const noiseChartContext = document.getElementById("noiseChart").getContext('2d');
const exposureChartContext = document.getElementById("exposureChart").getContext('2d');
const overviewChartContext = document.getElementById("overviewChart").getContext('2d');

const headSetSelectedContent = document.getElementById("headSetSelected");
const boomArmContent = document.getElementById("boomArm");
const exposureContent = document.getElementById("exposure");
const backgroundNoiseContent = document.getElementById("backgroundNoise");
const callOverviewContent = document.getElementById("callOverview");

const expandHeadSetSelected = document.getElementById('expandHeadSetSelected');
const collapseHeadSetSelected = document.getElementById('collapseHeadSetSelected');

const expandBoomArm = document.getElementById('expandBoomArm');
const collapseBoomArm = document.getElementById('collapseBoomArm');

const expandBackgroundNoise = document.getElementById('expandBackgroundNoise');
const collapseBackgroundNoise = document.getElementById('collapseBackgroundNoise');

const expandExposureNoise = document.getElementById('expandExposureNoise');
const collapseExposureNoise = document.getElementById('collapseExposureNoise');

const expandCallOverview = document.getElementById('expandCallOverview');
const collapseCallOverview = document.getElementById('collapseCallOverview');

const agentTalkingOff = document.getElementById('agentTalkingOff');
const agentTalkingOn = document.getElementById('agentTalkingOn');
const agentTalkingLabel = document.getElementById('agentTalkingLabel');

const contactTalkingOff = document.getElementById('contactTalkingOff');
const contactTalkingOn = document.getElementById('contactTalkingOn');
const contactLabel = document.getElementById('contactLabel');

const crossTalkOff = document.getElementById('crossTalkOff');
const crossTalkOn = document.getElementById('crossTalkOn');
const crossTalkLabel = document.getElementById('crossTalkLabel');

const silenceOff = document.getElementById('silenceOff');
const silenceOn = document.getElementById('silenceOn');
const silenceLabel = document.getElementById('silenceLabel');

/** @type {connect.Contact} */
let activeContact;

/** @type {connect.Agent} */
let activeAgent;

let activeDevice;

let hasFocus = false;

let lastNoiseDate;
let lastExposureDate;

let lastTxSpeechOrStart;
let lastRxSpeechOrStart;

let txSpeechStart;
let rxSpeechStart;
let crossTalkStart;
let silenceStart;

let txSpeechTotal = 0;
let rxSpeechTotal = 0;
let crossTalkTotal = 0;
let silenceTotal = 0;

let retry = 0;

let inCall;

const silenceMinDurationMs = 1000;

function webrtcSetup(deviceInfo) {
    // grab the room from the URL
    var room = location.search && location.search.split('?')[1];

    // Ask browser to use our jabra input device if it exists.
    var mediaConstraints = (deviceInfo && deviceInfo.browserAudioInputId) ? {
        audio: {
            deviceId: deviceInfo.browserAudioInputId
        },
        video: true
    } : {
        audio: true,
        video: true
    };
    
    // create our webrtc connection
    var webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false,
        media: mediaConstraints
    });
    
    // when it's ready, join if we got a room from the URL
    webrtc.on('readyToCall', function () {
        // you can name it anything
        if (room) {
            webrtc.joinRoom(room);
        }
    });
    
    function showVolume(el, volume) {
        if (!el) return;
        if (volume < -45) volume = -45; // -45 to -20 is
        if (volume > -20) volume = -20; // a good range
        el.value = volume;
    }
    
    // we got access to the camera
    webrtc.on('localStream', function (stream) {
        var button = document.querySelector('form>button');
        if (button) button.removeAttribute('disabled');
        
        if (deviceInfo && (deviceInfo.browserAudioInputId || deviceInfo.browserAudioOutputId)) {
            if(deviceInfo.deviceName === "Jabra Engage 50") {
                boomArmSection.style.display = "block";
                backgroundNoiseSection.style.display = "block";
                audioExposureSection.style.display = "block";
                callOveriewSection.style.display = "block";
            }
            
            if (jabra.isDeviceSelectedForInput(stream, deviceInfo)) {
                inputStatTitle.innerText = "Jabra input device selected successfully!";
                inputStat.innerText = deviceInfo.browserLabel;
            } else {
                inputStatTitle.innerText = "Jabra input device selection problem!";
                inputStat.innerText = "Jabra input device " + deviceInfo.browserLabel + " could not be selected automatically in your browser - please do manually";
            }
            //   inputStat.innerText = jabra.isDeviceSelectedForInput(stream, deviceInfo) ? "Jabra input device '" + deviceInfo.browserLabel + "' sucessfully selected" : "Input device selection problem: Jabra input device " + deviceInfo.browserLabel + " could not be selected automatically in your browser - please do manually";
            
            if (deviceInfo.deviceID) {
                activeDevice = deviceInfo.deviceID;
            }
            
            jabra.trySetDeviceOutput(localVideo, deviceInfo).then(success => {
                // outputStat.innerText = success ? "Jabra output device '" + deviceInfo.browserLabel + "' sucessfully selected" : "Output device selection problem: Jabra output device " + deviceInfo.browserLabel + " could not be selected automatically in your browser - please do manually"
                if (success) {
                    outputStatTitle.innerText = "Jabra output device selected!";
                    outputStat.innerText = deviceInfo.browserLabel;
                    deviceList();
                } else {
                    outputStatTitle.innerText = "Jabra output device selection problem!";
                    outputStat.innerText = "Jabra output device " + deviceInfo.browserLabel + " could not be selected automatically in your browser - please do manually";
                }
            }).catch(function (err) {
                outputStatTitle.innerText = "Jabra output device selection problem!";
                outputStat.innerText = "Jabra output device: " + deviceInfo.browserLabel + ",Error:- " + err.name + ": " + err.message;
                // outputStat.innerText = "Output device selection problem for " + deviceInfo.browserLabel + ": " + err.name + ": " + err.message;
            })
        } else {
            inputStatTitle.innerText = "Jabra input device";
            inputStat.innerText = "No Jabra device found";
            outputStatTitle.innerText = "Jabra output device";
            outputStat.innerText = "No Jabra device found";
        }
        
        $('#localVolume').show();
    });
    // we did not get access to the camera
    webrtc.on('localMediaError', function (err) {
    });
    
    
    // local screen obtained
    webrtc.on('localScreenAdded', function (video) {
        video.onclick = function () {
            video.style.width = video.videoWidth + 'px';
            video.style.height = video.videoHeight + 'px';
        };
        document.getElementById('localScreenContainer').appendChild(video);
        $('#localScreenContainer').show();
    });
    // local screen removed
    webrtc.on('localScreenRemoved', function (video) {
        document.getElementById('localScreenContainer').removeChild(video);
        $('#localScreenContainer').hide();
    });
    
    // a peer video has been added
    webrtc.on('videoAdded', function (video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var container = document.createElement('div');
            container.className = 'videoContainer';
            container.id = 'container_' + webrtc.getDomId(peer);
            container.appendChild(video);
            
            // suppress contextmenu
            video.oncontextmenu = function () { return false; };
            
            // resize the video on click
            video.onclick = function () {
                container.style.width = video.videoWidth + 'px';
                container.style.height = video.videoHeight + 'px';
            };
            
            // show the remote volume
            var vol = document.createElement('meter');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume';
            vol.min = -45;
            vol.max = -20;
            vol.low = -40;
            vol.high = -25;
            container.appendChild(vol);
            
            // show the ice connection state
            if (peer && peer.pc) {
                var connstate = document.createElement('div');
                connstate.className = 'connectionstate';
                container.appendChild(connstate);
                peer.pc.on('iceConnectionStateChange', function (event) {
                    switch (peer.pc.iceConnectionState) {
                        case 'checking':
                        connstate.innerText = 'Connecting to peer...';
                        break;
                        case 'connected':
                        case 'completed': // on caller side
                        $(vol).show();
                        connstate.innerText = 'Connection established.';
                        inCall = true;
                        selectDevice.disabled = true; // device selection is disabled when on call.
                        break;
                        case 'disconnected':
                        connstate.innerText = 'Disconnected.';
                        selectDevice.disabled = false;
                        break;
                        case 'failed':
                        connstate.innerText = 'Connection failed.';
                        break;
                        case 'closed':
                        connstate.innerText = 'Connection closed.';
                        break;
                    }
                });
            }
            remotes.appendChild(container);
        }
    });
    // a peer was removed
    webrtc.on('videoRemoved', function (video, peer) {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });
    
    // local volume has changed
    webrtc.on('volumeChange', function (volume, treshold) {
        showVolume(document.getElementById('localVolume'), volume);
    });
    // remote volume has changed
    webrtc.on('remoteVolumeChange', function (peer, volume) {
        showVolume(document.getElementById('volume_' + peer.id), volume);
    });
    
    // local p2p/ice failure
    webrtc.on('iceFailed', function (peer) {
        var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
        console.log('local fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
            fileinput.disabled = 'disabled';
        }
    });
    
    // remote p2p/ice failure
    webrtc.on('connectivityError', function (peer) {
        var connstate = document.querySelector('#container_' + webrtc.getDomId(peer) + ' .connectionstate');
        console.log('remote fail', connstate);
        if (connstate) {
            connstate.innerText = 'Connection failed.';
            fileinput.disabled = 'disabled';
        }
    });
    
    // Since we use this twice we put it here
    function setRoom(name) {
        if (document.querySelector('form')) {
            document.querySelector('form').remove();
            document.getElementById('title').innerText = 'WebRTC Call Id: ' + name;
            document.getElementById('subTitle1').innerText =  'Link to join: ' + location.href;
            document.getElementById('subTitle2').innerText = 'Use the buttons on your Jabra device to mute/unmute/end-call';
            $('body').addClass('active');
            
            jabra.offHook();
            $("#mute").show();
        }
    }
    
    if (room) {
        setRoom(room);
    } else {
        $('form').submit(function () {
            var val = $('#sessionInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
            webrtc.createRoom(val, function (err, name) {
                console.log(' create room cb', arguments);
                
                var newUrl = location.pathname + '?' + name;
                if (!err) {
                    history.replaceState({foo: 'bar'}, null, newUrl);
                    setRoom(name);
                } else {
                    console.log(err);
                }
            });
            return false;
        });
    }
    
    return webrtc;
}


// Update the list of devices connected to the system
function deviceList() {
    jabra.getDevices(true).then((devices) => {
        console.log(devices.length);
        if (devices.length === 0) {
            inputStatTitle.innerText = "Jabra input device";
            inputStat.innerText = "No Jabra device found";
            outputStatTitle.innerText = "Jabra output device";
            outputStat.innerText = "No Jabra device found";
            connectedDevices.style.display = "none";
            activeDevice = undefined;
        }
        if (devices.length > 1) {
            connectedDevices.style.display = "block";
            // connectedDevicesList
            let devicesListHtml = "";
            devices.map((device) => {
                if (device.deviceID === activeDevice) {
                    devicesListHtml += "<option value='"+device.deviceID+"'>"+device.deviceName+" : Connected</option>";
                } else {
                    devicesListHtml += "<option value='"+device.deviceID+"'>"+device.deviceName+"</option>";
                }
            });
            connectedDevicesList.innerHTML = devicesListHtml;
            if (!activeDevice) {

            }
            selectedDeviceCheck();
        }
    }).catch((err) => {
        console.log('error in devices', err);
    });
}

// select button is disabled if the selected device from the dropdown is same as active device
function selectedDeviceCheck() {
    const selectedDevice = parseInt(document.getElementById("connectedDevicesList").value);
    if (selectedDevice === activeDevice) {
        selectDevice.disabled = true;
    } else {
        selectDevice.disabled = false;
    }
}

// select the device as active device from the dropdown
function selectActiveDevice() {
    const selectedDevice = parseInt(document.getElementById("connectedDevicesList").value);
    jabra.setActiveDeviceId(selectedDevice)
    .then(() => {
        activeDevice = selectedDevice;
        jabra.getActiveDevice(true).then((deviceInfo) => { 
            // Now that we have the IDs of our jabra device, startup webrtc
            // webrtc = self.webrtcSetup(deviceInfo);
            location.reload(); // page reloaded as he new device is selected as the active device
        });
    })
    .catch((err) => {
        alert('Not able to select the device due to ' + err.message + "");
    });
}

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOMContentLoaded");
    
    // http://stackoverflow.com/a/4723302/600559
    // Require secure connection
    if (location.protocol != 'https:') {
        location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
    }
    
    var webrtc = null;
    
    //Set mute/unmute icon and inform other peers about mute state...
    function SetMute(mute) {
        if (webrtc) {
            if (mute) {
                $('#mute').removeClass('unmuted').addClass('muted');
                webrtc.sendDirectlyToAll('jabra', 'peer_muted', { mute: true });
            } else {
                $('#mute').removeClass('muted').addClass('unmuted');
                webrtc.sendDirectlyToAll('jabra', 'peer_muted', { mute: false });
            }
        } else {
            console.error("Webrtc not initialized");
        }
    };
    
    // Boom Arm Position notification update (Engage 50 device only)...
    function updateBoomArm(boomArm) {
        boomArmStatusText.innerText = boomArm ? "Well positioned for best quality" : "Badly positioned";
        noteBoomArmProblem.style.display = boomArm ? "none" : "inline-block";
        
        boomArmUnknown.style.display = "none";
        boomArmKnown.style.display = "inline-block";
    }
    // Data for Audio Exposure notification update (Engage 50 device only)...
    let exposureData = {
        labels: [],
        datasets: [{
            data: [],
            borderColor: 'white',
            borderWidth: 1,
            fill: false,
        }]
    }
    
    // Audio Exposure notification update Chart (Engage 50 device only)...
    let exposureChart = new Chart(exposureChartContext, {
        type: 'line',
        maintainAspectRatio: false,
        data: exposureData,
        options: {
            responsive: false,
            showLines: true,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: true,
                    gridLines: { 
                        display:false,
                        color: 'white'
                    },
                    ticks: {
                        display: false,
                        fontColor: "white",
                        fontSize: 10,
                        defaultFontFamily: "'GNElliotWeb-Regular'",
                        maxRotation: 90,
                        minRotation: 90,
                        callback: function (date) {
                            return date.toLocaleTimeString();                       
                        }
                    },
                    scaleLabel: {
                        display: false,
                    },
                }],
                yAxes: [{
                    display: true,
                    gridLines: { 
                        display:false,
                        color: 'white'
                    },
                    ticks: {
                        suggestedMin: 30,
                        suggestedMax: 80,
                        beginAtZero: false,
                        fontColor: "white",
                        defaultFontFamily: "'GNElliotWeb-Regular'",
                        fontSize: 10,
                        callback: function (value) {
                            return value + " db";
                        }
                    },
                    scaleLabel: {
                        display: false,
                    }
                }]
            },
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            }
        }
    });
    
    const maxExposureData = 15;
    
    // Audio Exposure notification update (Engage 50 device only)...
    function updateExposure(exposureDb) {
        let exposurePct;
        if (exposureDb<=30) {
            exposurePct = 1;
        } else if (exposureDb>90) {
            exposurePct = 100;           
        } else {
            exposurePct =  Math.round(100.0*(exposureDb-30)/90.0);
        }
        
        exposureBar.style.width = exposurePct + '%';
        
        exposureBar.style.backgroundColor = "white";
        
        let date = new Date();
        lastExposureDate = exposureData.labels[noiseData.labels.length - 1];
        if (!lastExposureDate || (date.getTime()-lastExposureDate.getTime())>=5000) {
            const dataset = exposureData.datasets[0];
            if (exposureData.labels.length >= maxExposureData) {
                dataset.data.shift();
                exposureData.labels.shift();
            }
            dataset.data.push(exposureDb);
            exposureData.labels.push(date);
            exposureChart.update();
            
            lastExposureDate = date;
        }
        
        exposureUnknown.style.display = "none";
        exposureKnown.style.display = "inline-block";
    }
    
    // Data for Background Noise notification update (Engage 50 device only)...
    let noiseData = {
        labels: [],
        datasets: [{
            data: [],
            borderColor: 'grey',
            borderWidth: 1,
            pointBackgroundColor: [],
            pointBorderColor: [],
            fill: false,
        }]
    }
    
    // Background Noise notification update Chart (Engage 50 device only)...
    let noiseChart = new Chart(noiseChartContext, {
        type: 'line',
        maintainAspectRatio: false,
        data: noiseData,
        options: {
            responsive: false,
            showLines: true,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: true,
                    gridLines: { 
                        display:false,
                        color: 'white'
                    },
                    ticks: {
                        display: false,
                        fontColor: "white",
                        fontSize: 10,
                        defaultFontFamily: "'GNElliotWeb-Regular'",
                        maxRotation: 90,
                        minRotation: 90,
                        callback: function (date) {
                            return date.toLocaleTimeString();                       
                        }
                    },
                    scaleLabel: {
                        display: false,
                    },
                }],
                yAxes: [{
                    display: true,
                    gridLines: { 
                        display:false,
                        color: 'white'
                    },
                    ticks: {
                        suggestedMin: 30,
                        suggestedMax: 80,
                        beginAtZero: false,
                        fontColor: "white",
                        defaultFontFamily: "'GNElliotWeb-Regular'",
                        fontSize: 10,
                        callback: function (value) {
                            return value + " db";
                        }
                    },
                    scaleLabel: {
                        display: false,
                    }
                }]
            },
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            }
        }
    });
    
    const maxNoiseData = 15;
    
    // Background Noise notification Update (Engage 50 device only)...
    function updateNoise(noiseDb) {
        let noisePct;
        if (noiseDb<=30) {
            noisePct = 1;
        } else if (noiseDb>90) {
            noisePct = 100;           
        } else {
            noisePct =  Math.round(100.0*(noiseDb-30)/90.0);
        }
        
        noiseBar.style.width = noisePct + '%';
        
        let color;
        let problem;
        if (noiseDb<40) {
            problem = false;
            color = "00ff00";
        } else if (noiseDb>=40 && noiseDb<=45) {
            problem = false;
            color = "ffff00";
        } else if (noiseDb>45 && noiseDb<70) {
            problem = true;
            color = "8b0000";
        } else {
            problem = true;
            color = "ff0000";
        }
        
        noteNoiseProblem.style.display = problem ? "inline-block" : "none";
        
        noiseBar.style.backgroundColor = "#"+color;
        
        let date = new Date();
        lastNoiseDate = noiseData.labels[noiseData.labels.length - 1];
        if (!lastNoiseDate || (date.getTime()-lastNoiseDate.getTime())>=5000) {
            const dataset = noiseData.datasets[0];
            if (noiseData.labels.length >= maxNoiseData) {
                dataset.data.shift();
                dataset.pointBackgroundColor.shift();
                dataset.pointBorderColor.shift();
                noiseData.labels.shift();
            }
            dataset.data.push(noiseDb);
            dataset.pointBackgroundColor.push("#"+color);
            dataset.pointBorderColor.push("#"+color);
            noiseData.labels.push(date);
            noiseChart.update();
            
            lastNoiseDate = date;
        }
        
        // jabra.setRemoteMmiLightAction(jabra.RemoteMmiType.MMI_TYPE_DOT3, color, jabra.RemoteMmiSequence.MMI_LED_SEQUENCE_ON);
        
        noiseUnknown.style.display = "none";
        noiseKnown.style.display = "inline-block";
    }
    
    
    // Data for Call Overview notification update (Engage 50 device only)...
    let overviewData = {
        labels: [],
        datasets: [{
            data: [0,0,0,0], // cross talk, agent talking, contact talking, silence.
            borderColor: 'grey',
            borderWidth: 1,
            backgroundColor: [
                '#eb5757', "#ffd100", "#27AE60", "#808080"
            ]
        }]
    }
    
    // Call Overview notification update chart (Engage 50 device only)...
    let overviewChart = new Chart(overviewChartContext, {
        type: 'doughnut',
        maintainAspectRatio: true,
        data: overviewData,
        options: {
            responsive: false,
            legend: {
                display: false
            },       
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                }
            },
            cutoutPercentage: 65
        }
    });
    
    // Make sure we also update overview when there is no devlog events fired (to record silence):
    setInterval(() => {
        if (inCall) {
            updateOverview(new Date().getTime(), undefined, undefined);
        }
    }, 500);
    
    // Update call overview - works only in-call because of last[Tx/Rx]SpeechOrStart needs to be set.
    function updateOverview(timestamp, txSpeech, rxSpeech, silenceOverride = undefined) 
    {
        // Calculate historic tx/rx status.
        const currentTxSpeechTime = txSpeechStart ? Math.abs((timestamp - txSpeechStart)/1000) : 0;
        if (!txSpeechStart && txSpeech) {
            txSpeechStart = timestamp;
        } else if (txSpeech === false && txSpeechStart !== undefined) {
            txSpeechTotal += currentTxSpeechTime;
            txSpeechStart = undefined;
        }
        
        const currentRxSpeechTime = rxSpeechStart ? Math.abs((timestamp - rxSpeechStart)/1000) : 0;
        if (!rxSpeechStart && rxSpeech) {
            rxSpeechStart = timestamp;
        } else if (rxSpeech === false && rxSpeechStart !== undefined) {
            rxSpeechTotal += currentRxSpeechTime;
            rxSpeechStart = undefined;
        }
        
        // Calculate derived dynamic status:
        let crossTalk;
        if (txSpeechStart && rxSpeechStart) {
            crossTalk = true;
        } else if (txSpeechStart !== undefined || rxSpeechStart !== undefined) {
            crossTalk = false;
        } else {
            crossTalk = undefined;
        }
        
        let silence = silenceOverride;
        if (silenceOverride === undefined) {
            if ((!txSpeechStart && !rxSpeechStart)) {
                silence = (Math.abs(timestamp-lastTxSpeechOrStart)>=silenceMinDurationMs && Math.abs(timestamp-lastRxSpeechOrStart)>=silenceMinDurationMs)
            } else if (txSpeechStart || rxSpeechStart) {
                silence = false;
            } else {
                silence = undefined;
            }
        }
        
        // Calculate derived historic status:
        const currentCrossTalkTime = crossTalkStart ? Math.abs((timestamp - crossTalkStart)/1000) : 0;
        if (!crossTalkStart && crossTalk) {
            crossTalkStart = timestamp;
        } else if (crossTalk === false && crossTalkStart !== undefined) {
            crossTalkTotal += currentCrossTalkTime;
            crossTalkStart = undefined;
        }
        
        const currentSilenceTime = silenceStart ? Math.abs((timestamp - silenceStart)/1000) : 0;
        if (!silenceStart && silence) {
            silenceStart = timestamp;
        } else if (!silence && silenceStart !== undefined) {
            silenceTotal += currentSilenceTime;
            silenceStart = undefined;
        }
        
        // Update dynamic status:
        if (txSpeech !== undefined) {
            agentTalkingOn.style.display = txSpeech ? "inline" : "none";
            agentTalkingOff.style.display = !txSpeech ? "inline" : "none"
            agentTalkingLabel.style.fontFamily = txSpeech ? "GNElliotWeb-Bold" : "GNElliotWeb-Regular";
        }
        
        if (rxSpeech !== undefined) {
            contactTalkingOn.style.display = rxSpeech ? "inline" : "none";
            contactTalkingOff.style.display = !rxSpeech ? "inline" : "none"
            contactLabel.style.fontFamily = rxSpeech ? "GNElliotWeb-Bold" : "GNElliotWeb-Regular";
        }
        
        if (crossTalk !== undefined) {
            crossTalkOn.style.display = crossTalk ? "inline" : "none";
            crossTalkOff.style.display = !crossTalk ? "inline" : "none"
            crossTalkLabel.style.fontFamily = crossTalk ? "GNElliotWeb-Bold" : "GNElliotWeb-Regular";
        }
        
        if (silence !== undefined) {
            silenceOn.style.display = silence ? "inline" : "none";
            silenceOff.style.display = !silence ? "inline" : "none";
            silenceLabel.style.fontFamily = silence ? "GNElliotWeb-Bold" : "GNElliotWeb-Regular";
        }
        
        // Update chart:
        overviewData.datasets[0].data = [crossTalkTotal+currentCrossTalkTime,
            txSpeechTotal+currentTxSpeechTime,
            rxSpeechTotal+currentRxSpeechTime,
            silenceTotal+currentSilenceTime];
            overviewChart.update();
            
            // Update when there was last tx/rx activity for next time use:
            if (txSpeech) {
                lastTxSpeechOrStart = timestamp;
            }
            
            if (rxSpeech) {
                lastRxSpeechOrStart = timestamp;
            }
        }
        
        
        function showError(err) {
            let msg;
            if (err.name === "CommandError" && err.errmessage === "Unknown cmd" && err.command === "getinstallinfo" ) {
                msg = "Could not lookup installation info - Your installation is incomplete, out of date or corrupted.";
            } else if (err instanceof Error) {
                msg = err.toString();
            } else if ((typeof err === 'string') || (err instanceof String)) {
                msg = err; 
            } else {
                msg = JSON.stringify(err);
            }
            
            // Add nodes to show the message
            var div = document.createElement("div");
            var att = document.createAttribute("class");
            att.value = "wrapper";
            div.setAttributeNode(att);
            div.innerHTML = msg;
            var br = document.createElement("br");
            var list = document.getElementById("subTitles");
            list.insertBefore(br, list.childNodes[0]);
            list.insertBefore(div, list.childNodes[0]);
        }
        
        // Use the Jabra library - to be sure of the installation we also check it and report errors
        // This installation check is optional but is there to reduce support issues.
        jabra.init().then(() => jabra.getInstallInfo()).then( (installInfo) => {
            if (installInfo.installationOk) {
                jabra.addEventListener("mute", (event) => {
                    SetMute(true);
                    jabra.mute();
                });
                
                jabra.addEventListener("unmute", (event) => {
                    SetMute(false);
                    jabra.unmute();
                });

                // handle the list of devices when a device is attached
                jabra.addEventListener('device attached', (device) => {
                    jabra.getDevices(true)
                        .then((devices) => {
                            if (!activeDevice && activeDevice !== 0) {
                                // select the device as active device if no device is auto selected
                                jabra.setActiveDeviceId(device.data.deviceID)
                                .then(() => {
                                    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((dummyStream) => {
                                        // Shutdown initial dummy stream (not sure it is really required but let's be nice).
                                        dummyStream.getTracks().forEach((track) => {
                                            track.stop();
                                        });
                                        detectDevice();
                                    }).catch((err) => {
                                        inputStatTitle.innerText = "Jabra input device problem"
                                        if (err.name === "NotFoundError") {
                                            inputStat.innerText = "Input device not accessible/found";
                                        } else {
                                            inputStat.innerText = "Input device selection problem: " + err.name + ": " + err.message;
                                        }
                                    });
                                })
                                .catch((err) => {
                                    alert('Not able to select the device due to ' + err.message + "");
                                })
                            } else {
                                deviceList();
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        })
                });
                
                // handle the list of devices when a device is detached
                jabra.addEventListener('device detached', (device) => {
                    jabra.getDevices(true)
                        .then((devices) => {
                            if (devices.length === 0) {
                                inputStatTitle.innerText = "Jabra input device";
                                inputStat.innerText = "No Jabra device found";
                                outputStatTitle.innerText = "Jabra output device";
                                outputStat.innerText = "No Jabra device found";
                                connectedDevices.style.display = "none";
                                activeDevice = undefined;
                            } else {
                                if (devices.length === 1) {
                                    connectedDevices.style.display = "none";
                                } else {
                                    deviceList();
                                }
                                jabra.setActiveDeviceId(devices[0].deviceID)
                                    .then(() => {
                                        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((dummyStream) => {
                                            // Shutdown initial dummy stream (not sure it is really required but let's be nice).
                                            console.log(dummyStream);
                                            dummyStream.getTracks().forEach((track) => {
                                                track.stop();
                                            });
                                            detectDevice();
                                        }).catch((err) => {
                                            inputStatTitle.innerText = "Jabra input device problem"
                                            if (err.name === "NotFoundError") {
                                                inputStat.innerText = "Input device not accessible/found";
                                            } else {
                                                inputStat.innerText = "Input device selection problem: " + err.name + ": " + err.message;
                                            }
                                        });
                                    })
                                    .catch((err) => {
                                        alert('Not able to select the device due to ' + err.message + "");
                                    });
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                });
                
                jabra.addEventListener("devlog", (event) => {
                    console.log("Got devlog event " + JSON.stringify(event));
                    
                    let boomArm = undefined;
                    let boomArmEvent = event.data["Boom Position Guidance OK"];
                    if (boomArmEvent !== undefined) {
                        boomArm = (boomArmEvent.toString().toLowerCase() === "true");
                        updateBoomArm(boomArm);
                    }
                    
                    let txDb = undefined;
                    let txLevelEvent = event.data["TX Acoustic Logging Level"];
                    if (txLevelEvent !== undefined) {
                        txDb = parseInt(txLevelEvent);
                        updateNoise(txDb);
                    }
                    
                    let txPeakDb = undefined;
                    let txPeakLevelEvent = event.data["TX Acoustic Logging Peak"];
                    if (txPeakLevelEvent !== undefined) {
                        txPeakDb = parseInt(txPeakLevelEvent);
                    }
                    
                    let rxDb = undefined;
                    let rxLevelEvent = event.data["RX Acoustic Logging Level"];
                    if (rxLevelEvent !== undefined) {
                        rxDb = parseInt(rxLevelEvent);
                        updateExposure(rxDb);
                    }
                    
                    let rxPeakDb = undefined;
                    let rxPeakLevelEvent = event.data["RX Acoustic Logging Peak"];
                    if (rxPeakLevelEvent !== undefined) {
                        rxPeakDb = parseInt(rxPeakLevelEvent);
                    }
                    
                    let txSpeech = undefined;
                    let txSpeechEvent = event.data["Speech_Analysis_TX"];
                    if (txSpeechEvent !== undefined) {
                        txSpeech = (txSpeechEvent.toString().toLowerCase() === "true");
                    }
                    
                    let rxSpeech = undefined;
                    let rxSpeechEvent = event.data["Speech_Analysis_RX"];
                    if (rxSpeechEvent !== undefined) {
                        rxSpeech = (rxSpeechEvent.toString().toLowerCase() === "true");
                    }
                    
                    if (inCall) {
                        let timeStamp = new Date(event.data["TimeStampMs"]);
                        updateOverview(timeStamp, txSpeech, rxSpeech);
                    }
                });
                
                jabra.addEventListener("endcall", (event) => {
                    if (webrtc) {
                        webrtc.leaveRoom();
                    } else {
                        console.error("Webrtc not initialized");
                    }
                    jabra.onHook();
                    setTimeout(function () {
                        location.href = window.location.origin + window.location.pathname;
                    }, 1 * 1000);
                });
                
                $('#mute').click(function () {
                    if ($('#mute').hasClass('muted')) {
                        SetMute(false);
                        jabra.unmute();
                    } else {
                        SetMute(true);
                        jabra.mute();
                    }
                });
                
                // First find the jabra input device, then use this to initialize webrtc.
                // Note this involves asking for access to user media in advance (producing
                // a dummy stream that we throw away), as required by getDeviceInfo(true) because 
                // of browser security rules.
                navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((dummyStream) => {
                    // Shutdown initial dummy stream (not sure it is really required but let's be nice).
                    dummyStream.getTracks().forEach((track) => {
                        track.stop();
                    });
                    
                    // Important to call getActiveDevice with true argument to get browser media information:
                    return jabra.getActiveDevice(true).then((deviceInfo) => { 
                        // Now that we have the IDs of our jabra device, startup webrtc
                        webrtc = self.webrtcSetup(deviceInfo);
                    });
                }).catch((err) => {
                    if (err.name === "NotFoundError") {
                        inputStat.innerText = "Input device not accessible/found";
                    } else {
                        inputStat.innerText = "Input device selection problem: " + err.name + ": " + err.message;
                    }
                });
            } else { // Installation not ok:
                showError("Installation not ok - Your installation is incomplete, out of date or corrupted.");
            }
        }).catch( (err) => {
            showError(err);
        });
    }, false);


function detectDevice() {
    var webrtc = null;
    // Important to call getActiveDevice with true argument to get browser media information:
    return jabra.getActiveDevice(true).then((deviceInfo) => { 
        // Now that we have the IDs of our jabra device, startup webrtc
        console.log(deviceInfo);
        if (deviceInfo.browserAudioInputId) {
            activeDevice = deviceInfo.deviceID;
            // webrtc = self.webrtcSetup(deviceInfo);
            location.reload();
            retry = 0;
        } else {
            retry += 1;
            if (retry <=3 ) {
                setTimeout(() => {
                    detectDevice();
                }, 1000);
            }
        }
    });
}
    