// grab the room from the URL
var room = location.search && location.search.split('?')[1];

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
  autoAdjustMic: false
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
            break;
          case 'disconnected':
            connstate.innerText = 'Disconnected.';
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
  document.querySelector('form').remove();
  document.getElementById('title').innerText = 'WebRTC Call Id: ' + name;
  document.getElementById('subTitle1').innerText =  'Link to join: ' + location.href;
  document.getElementById('subTitle2').innerText = 'Use the buttons on your Jabra device to mute/unmute/end-call';
  $('body').addClass('active');

  jabra.offHook();
  $("#mute").show();
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

//Set mute/unmute icon and inform other peers about mute state...
function SetMute(mute) {
  //peers.local.micMuted = mute;
  if (mute) {
    $('#mute').removeClass('unmuted').addClass('muted');
    webrtc.sendDirectlyToAll('jabra', 'peer_muted', { mute: true });
  } else {
    $('#mute').removeClass('muted').addClass('unmuted');
    webrtc.sendDirectlyToAll('jabra', 'peer_muted', { mute: false });
  }
};

// DOM loaded
document.addEventListener('DOMContentLoaded', function () {

  console.log("DOMContentLoaded");

  // http://stackoverflow.com/a/4723302/600559
  // Require secure connection
  if (location.protocol != 'https:') {
    location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
  }

  // Use the Jabra library
  jabra.init(
    function() {
    },
    function(msg) {
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
    },
    function(req) {
      if (req == jabra.requestEnum.mute) {
        SetMute(true);
        jabra.mute();
      } else if (req == jabra.requestEnum.unmute) {
        SetMute(false);
        jabra.unmute();
      } else if (req == jabra.requestEnum.deviceAttached) {
        //toastr.info("Callback: A device was attached");
      } else if (req == jabra.requestEnum.deviceDetached) {
        //toastr.info("Callback: A device was detached");
      } else if (req == jabra.requestEnum.acceptCall) {
        //toastr.info("Callback: Accept call from the device");
      } else if (req == jabra.requestEnum.rejectCall) {
        //toastr.info("Callback: Reject call from the device");
      } else if (req == jabra.requestEnum.endCall) {
        webrtc.leaveRoom();
        jabra.onHook();
        setTimeout(function () {
          location.href = "https://jabra-browser-sdk.azurewebsites.net/webrtc/";
        }, 1 * 1000);

        //toastr.info("Callback: End call from the device");
      } else if (req == jabra.requestEnum.flash) {
        //toastr.info("Callback: Flash from the device");
      }
    }
  );


  $('#mute').click(function () {
    if ($('#mute').hasClass('muted')) {
      SetMute(false);
      jabra.unmute();
    } else {
      SetMute(true);
      jabra.mute();
    }
  });


}, false);