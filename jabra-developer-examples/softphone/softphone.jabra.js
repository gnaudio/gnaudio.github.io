/// <reference path="jabra.browser.integration-3.0.d.ts" />

// This file contains the jabra integration logic towards a softhone.

// Jabra initialization (and most other commands) return a promise
// that must be resolve before we can proceed.
jabra.init().then(() => {
  softphone_enable();
}).catch((e) => {
  // Remembe error handling in case Jabra SDK is not installed etc.
  showError(e);
});

// Synchronize softphone with java device initiated button presses:
// 
// Note this is only 1/2 of the typical 2-way synchronization. The softphone
// also need to react to softphone button (GUI) presses and update the Jabra
// device (see softphone stub for this).

jabra.addEventListener("mute", (e) => {
  // Mute is now requested by the device but not yet in effect.
  // Inform the softphone which will in turn perform 
  // the real mute using a jabra.mute() instruction. 
  softphone_mute();
});

jabra.addEventListener("unmute", (e) => {
  // Unmute is now requested by the device but not yet in effect.
  // Inform the softphone which will in turn perform 
  // the real mute using a jabra.unmute() instruction. 
  softphone_unmute();
});

jabra.addEventListener("acceptcall", (e) => {
  // Call acceptance is now requested by the device but not yet in effect.
  // Inform the softphone which will in turn issue a jabra.offHook()
  // instruction as part of answering.
  softphone_answerIncommingCall();
});

jabra.addEventListener("endcall", (e) => {
  // Call completion is now requested by the device but not yet in effect.
  // Inform the softphone which will in turn issue a jabra.onHook()
  // instruction as part of ending the call.
  softphone_hangup();
});

jabra.addEventListener("reject", (e) => {
  // Call rejection is now requested by the device but not yet in effect.
  // Inform the softphone which will in turn issue a jabra.onHook()
  // instruction as part of rejecting the call.
  softphone_rejectIncommingCall();
});

jabra.addEventListener("flash", (e) => {
  // A hold or resume state switch is now requested by the device 
  // but not yet in effect. Inform the softphone which will in turn 
  // issue a jabra.hold() + jabra.onHook() OR jabra.offHook() + jabra.resume().
  softphone_holdOrResume();
});

// Watch for Jabra device being connected / unconnected:

jabra.addEventListener("device attached", (e) => {
  // If our softphone allowed us to change Jabra device,
  // we could inform the softphone that a new choice is
  // available here for display in a dropdown etc.

  // For this simple demo however, we do nothing.
});

jabra.addEventListener("device detached", (e) => {
  // If our softphone allowed us to change Jabra device,
  // we could inform the softphone that a choice is
  // removed. Also we should watch out if the device
  // that we are currently using is being removed.

  // For this simple demo however, we do nothing.
});



