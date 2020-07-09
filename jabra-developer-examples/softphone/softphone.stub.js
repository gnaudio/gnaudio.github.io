/// <reference path="jabra.browser.integration-3.0.d.ts" />

// This file contains a general code stub that represents a 
// simple ("dummy") softphone that can make and receive 
// calls. However in this stub, you will only be talking to 
// yourself in calls :-) 

// Our softphone sub consist of a service methods that updates GUI
// and Jabra device states when called. 

function softphone_enable()
{
    simulateIncommingCallBtn.disabled = false;  
    startOutgoingCallBtn.disabled = false;
}

function softphone_startOutgoingCall() {
    simulateIncommingCallBtn.disabled = true;
    startOutgoingCallBtn.disabled = true;
    _softphone_do_call_starting();
}

function softphone_startIncommingCall() {
   simulateIncommingCallBtn.disabled = true;
    startOutgoingCallBtn.disabled = true;

    answerIncommingCallBtn.style.display = "inline";
    rejectIncommingCallBtn.style.display = "inline";

    muteUnmuteBtn.style.display = "none";
    holdResumeBtn.style.display = "none";
    hangUpBtn.style.display = "none";

    // Indicate on the device that it is ringing (flashing light).
    // Nb. Later undone automatically with a offHook or onHook.
    jabra.ring();

    // Optional extra ringing:
    // Also play an actual ringtone in active jabra device speakers:
    // To be sure we are ringing in the right (Jabra) speakers,
    // we need to identify the current jabra device and setup
    // the audio player to use it.
    // Nb. requires https to work because of chrome requirements.
    jabra.getActiveDevice(true).then((deviceInfo) => {
      return jabra.trySetDeviceOutput(player, deviceInfo).then((success) => {
        return success ? deviceInfo : Promise.reject("Unable to set output");
      });
    }).then((deviceInfo) => {
      player.srcObject = undefined;
      player.type= 'audio/mpeg';
      player.src= './assets/Ringtone.mp3';
      player.muted = false;
      statusMessage.innerText = "Ringing using Jabra device '" + deviceInfo.deviceName + "' speakers.";
    }).catch((err) => {
      console.error(err);
      statusMessage.innerText = "Sorry. Could not select a Jabra device for ringing audio. You must select the right device manually.";
    });
}

function softphone_answerIncommingCall() {
    statusMessage.innerText = "";
    _softphone_do_call_starting();
}

function softphone_rejectIncommingCall() {
    statusMessage.innerText = "";

    answerIncommingCallBtn.style.display = "none";
    rejectIncommingCallBtn.style.display = "none";

    simulateIncommingCallBtn.disabled = false;
    startOutgoingCallBtn.disabled = false;

    jabra.onHook();

    // Stop playing ringer now that we rejected the call.
    player.muted = true;
}

function softphone_mute() {
  jabra.mute();
  muteUnmuteBtn.innerText = "UNMUTE";
}

function softphone_unmute() {
  jabra.unmute();
  muteUnmuteBtn.innerText = "MUTE";
}

function softphone_hold() {
  jabra.hold();
  jabra.onHook();
  holdResumeBtn.innerText = "RESUME";

  // Stop playing audio now that call is on hold.
  player.muted = true;
}

function softphone_resume() {
  jabra.offHook();
  jabra.resume();
  holdResumeBtn.innerText = "HOLD";

  // Restart playing audio now that call is resumed.
  player.muted = false;
}

function softphone_holdOrResume() {
  if (holdResumeBtn.innerText === "HOLD") {
    softphone_hold();
  } else {
    softphone_resume();
  }
}

function softphone_hangup() {
    startOutgoingCallBtn.disabled = false;
    simulateIncommingCallBtn.disabled = false;

    answerIncommingCallBtn.style.display = "none";
    rejectIncommingCallBtn.style.display = "none";

    muteUnmuteBtn.style.display = "none";
    holdResumeBtn.style.display = "none";
    hangUpBtn.style.display = "none";

    statusMessage.innerText = "";

    // Stop playing audio once call is ended.
    player.muted = true;

    // Tell active Jabra device that we are no longer in a call!
    jabra.onHook(); 
}

function _softphone_do_call_starting()
{
    answerIncommingCallBtn.style.display = "none";
    rejectIncommingCallBtn.style.display = "none";

    // Code to execute when auto selection completes:
    function doStartCall() {
      muteUnmuteBtn.style.display = "inline";
      holdResumeBtn.style.display = "inline";
      hangUpBtn.style.display = "inline";
  
      muteUnmuteBtn.innerText = "MUTE";
      holdResumeBtn.innerText = "HOLD";

      // Start audio:
      player.muted = false;

      // Tell active Jabra device that we are now in a call!
      jabra.offHook();
    }

    // Connect microphone with audio player element, so we can have our
    // playback/loopback effect (we hear what we say).
    //
    // However, to be sure microphone and speakers are using the right 
    // (Jabra) speakers, we need to setup the audio player correctly.
    // Nb. requires https to work because of chrome requirements.
    jabra.getUserDeviceMediaExt({}).then(({stream, deviceInfo}) => {
      player.src = undefined;
      player.srcObject = stream; // Loopback audio stream.

      return jabra.trySetDeviceOutput(player, deviceInfo).then((success) => {
        if (!success) {
          return Promise.reject("Unable to set output");
        }

        if (!jabra.isDeviceSelectedForInput(stream, deviceInfo)) {
          return Pomise.reject("Unable to set input");
        }

        return deviceInfo;
      });
    }).then((deviceInfo) => {
      statusMessage.innerText = "Call started using Jabra device '" + deviceInfo.deviceName + "' microphone and speakers.";

      // Succes, so lets start our call using our Jabra device.
      doStartCall();
    }).catch((e) => {
      console.error(err);
      statusMessage.innerText = "Sorry. Could not select a Jabra device for input and output. You must select the right device manually";

      // Jabra auto-selection failed but the call can proceed (possibly using wrong device).
      doStartCall();
    });
}

// Hookup softphone buttons to service methods above:

// Note this is only 1/2 of the typical 2-way synchronization. The softphone
// also need to react to jabra device buttons (see jabra integration code for this).

startOutgoingCallBtn.addEventListener('click', function() {
  softphone_startOutgoingCall();
});

simulateIncommingCallBtn.addEventListener('click', function() {
  softphone_startIncommingCall();
});
  
answerIncommingCallBtn.addEventListener('click', function() {
  softphone_answerIncommingCall();
});

rejectIncommingCallBtn.addEventListener('click', function() {
  softphone_rejectIncommingCall();
});

muteUnmuteBtn.addEventListener('click', function() {
  if (muteUnmuteBtn.innerText === "MUTE") {
    softphone_mute();
  } else {
    softphone_unmute();
  }
});

holdResumeBtn.addEventListener('click', function() {
  if (holdResumeBtn.innerText === "HOLD") {
    softphone_hold();
  } else {
    softphone_resume();
  }
});

hangUpBtn.addEventListener('click', function() {
  softphone_hangup();
}); 

