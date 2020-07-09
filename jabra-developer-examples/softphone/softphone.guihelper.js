// This file contains general GUI related declarations and utilities. 

/** @type { HTMLDivElement } */
const statusMessage = document.getElementById("statusMessage");

/** @type { HTMLAudioElement } */
const player = document.getElementById("player");

/** @type { HTMLButtonElement } */
const startOutgoingCallBtn = document.getElementById('startOutgoingCall');

/** @type { HTMLButtonElement } */
const simulateIncommingCallBtn = document.getElementById('simulateIncommingCall');

/** @type { HTMLButtonElement } */
const answerIncommingCallBtn = document.getElementById('answerIncommingCall');

/** @type { HTMLButtonElement } */
const rejectIncommingCallBtn = document.getElementById('rejectIncommingCall');

/** @type { HTMLButtonElement } */
const muteUnmuteBtn = document.getElementById('muteUnmute');

/** @type { HTMLButtonElement } */
const holdResumeBtn = document.getElementById('holdResume');

/** @type { HTMLButtonElement } */
const hangUpBtn = document.getElementById('hangUp');

/** Show specified error in GUI
 * 
 * @param { Error|string } err - The error.
 */
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
  