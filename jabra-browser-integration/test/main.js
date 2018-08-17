/// <reference path="../../../jabra-browser-integration/src/JavaScriptLibrary/jabra.browser.integration-2.0.d.ts" />

// DOM loaded
document.addEventListener('DOMContentLoaded', function () {
  let initSDKBtn = document.getElementById('initSDKBtn');
  let unInitSDKBtn = document.getElementById('unInitSDKBtn');

  let devicesBtn = document.getElementById('devicesBtn');
  let deviceSelector = document.getElementById('deviceSelector');

  let methodSelector = document.getElementById('methodSelector');
  let invokeApiBtn = document.getElementById('invokeApiBtn');

  let txtParam1 = document.getElementById('txtParam1');
  let txtParam2 = document.getElementById('txtParam2');
  let txtParam3 = document.getElementById('txtParam3');
  let txtParam4 = document.getElementById('txtParam4');
  let txtParam5 = document.getElementById('txtParam5');
  let txtParam6 = document.getElementById('txtParam6');

  let clearMessageAreaBtn = document.getElementById('clearMessageAreaBtn');
  let clearEventsAreaBtn = document.getElementById('clearEventsAreaBtn');

  let messageArea = document.getElementById('messageArea');
  let eventsArea = document.getElementById('eventsArea');

  function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };
  
  let nonMethodSelectorMethods = ["init", "shutdown", "getUserDeviceMedia", "getUserDeviceMediaExt", "isDeviceSelectedForInput", "trySetDeviceOutput"];
  Object.entries(jabra).forEach(([key, value]) => {
    if (isFunction(value) && !key.startsWith("_") && !nonMethodSelectorMethods.includes(key)) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.innerHTML = key;
      methodSelector.appendChild(opt);
    }
  });

  initSDKBtn.onclick = () => {
    // Use the Jabra library
    jabra.init().then(() => {
      toastr.info("Jabra library initialized successfully");
      initSDKBtn.disabled = true;
      unInitSDKBtn.disabled = false;
      devicesBtn.disabled = false;
    }).catch((err) => {
      messageArea.value=err;

      // Add nodes to show the message
      var div = document.createElement("div");
      var att = document.createAttribute("class");
      att.value = "wrapper";
      div.setAttributeNode(att);
      div.innerHTML = msg;
      var br = document.createElement("br");
      var list = document.getElementById("section");
      list.insertBefore(br, list.childNodes[0]);
      list.insertBefore(div, list.childNodes[0]);
    });
  };

  jabra.addEventListener(/.*/, (event) => {
    messageArea.value = messageArea.value + "\n Received event: " + JSON.stringify(event);
  });

  unInitSDKBtn.onclick = () => {
    if (jabra.shutdown()) {
      initSDKBtn.disabled = false;
      unInitSDKBtn.disabled = true;
      devicesBtn.disabled = true;
      invokeApiBtn.disabled = true;
    }
  };

  devicesBtn.onclick = () => {
    while (deviceSelector.options.length > 0) {                
      deviceSelector.remove(0);
    }

    jabra.getDevices().then((devices) => {
      let devicesAry = devices.split(",");

      for (var i = 0; i < devicesAry.length; i += 2){
        var opt = document.createElement('option');
        opt.value = devicesAry[i];
        opt.innerHTML = devicesAry[i+1];
        deviceSelector.appendChild(opt);
      }

      invokeApiBtn.disabled = false;
    }).catch((error) => {
      messageArea.value="ERROR " + error;
    });
  };

  invokeApiBtn.onclick = () => {
    let apiFuncName = methodSelector.options[methodSelector.selectedIndex].value;
    let apiFunc = jabra[apiFuncName];
    let result = apiFunc.call(jabra, txtParam1.value, txtParam2.value, txtParam3.value, txtParam4.value, txtParam5.value);
    if (result && result instanceof Promise) {
      result.then((value) => {
        messageArea.value = JSON.stringify(value, null, 2);
      }).catch((error) => {
        messageArea.value = "ERROR " + error;
      });
    }
  };

  clearMessageAreaBtn.onclick = () => {
    messageArea.value="";
  };

  clearEventsAreaBtn.onclick = () => {
    eventsArea.value="";
  };

}, false);