/// <reference path="../../../jabra-browser-integration/src/JavaScriptLibrary/jabra.browser.integration-2.0.d.ts" />

// DOM loaded
document.addEventListener('DOMContentLoaded', function () {
  let initSDKBtn = document.getElementById('initSDKBtn');
  let unInitSDKBtn = document.getElementById('unInitSDKBtn');

  let devicesBtn = document.getElementById('devicesBtn');
  let deviceSelector = document.getElementById('deviceSelector');
  let changeActiveDeviceBtn = document.getElementById('changeActiveDeviceBtn');

  let methodSelector = document.getElementById('methodSelector');
  let invokeApiBtn = document.getElementById('invokeApiBtn');

  let txtParam1 = document.getElementById('txtParam1');
  let txtParam2 = document.getElementById('txtParam2');
  let txtParam3 = document.getElementById('txtParam3');
  let txtParam4 = document.getElementById('txtParam4');
  let txtParam5 = document.getElementById('txtParam5');

  let clearMessageAreaBtn = document.getElementById('clearMessageAreaBtn');
  let clearErrorAreaBtn = document.getElementById('clearErrorAreaBtn');

  let messageArea = document.getElementById('messageArea');
  let errorArea = document.getElementById('errorArea');

  function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };
  
  let nonMethodSelectorMethods = ["init", "shutdown", 
                                  "getUserDeviceMedia", "getUserDeviceMediaExt", 
                                  "isDeviceSelectedForInput", "trySetDeviceOutput",
                                  "addEventListener", "removeEventListener"
                                 ];
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
      addStatusMessage("Jabra library initialized successfully")
      toastr.info("Jabra library initialized successfully");
      initSDKBtn.disabled = true;
      unInitSDKBtn.disabled = false;
      devicesBtn.disabled = false;
      invokeApiBtn.disabled = false;
    }).catch((err) => {
      addError(err);
    });
  };

  jabra.addEventListener(/.*/, (event) => {
    if (event.error) {
       addError(event);
    } else {
       addEventMessage(event);
    }
  });

  unInitSDKBtn.onclick = () => {
    if (jabra.shutdown()) {
      initSDKBtn.disabled = false;
      unInitSDKBtn.disabled = true;
      devicesBtn.disabled = true;
      invokeApiBtn.disabled = true;
      changeActiveDeviceBtn.disabled = true;
      while (deviceSelector.options.length > 0) {                
        deviceSelector.remove(0);
      }
    }
  };

  devicesBtn.onclick = () => {
    jabra.getDevices().then((devices) => {
      while (deviceSelector.options.length > 0) {
        deviceSelector.remove(0);
      }

      Object.entries(devices).forEach(([key, value]) => {
        var opt = document.createElement('option');
        opt.value = key;
        opt.innerHTML = value;
        deviceSelector.appendChild(opt);
      });

      if (deviceSelector.options.length == 0) {
        addError("No devices found");
      } else {
        changeActiveDeviceBtn.disabled = false;
      }
    }).catch((error) => {
      addError(error);
    });
  };
  
  changeActiveDeviceBtn.onclick = () => {
    let id = deviceSelector.value;
    jabra.setActiveDevice(id);
  };

  invokeApiBtn.onclick = () => {
    let apiFuncName = methodSelector.options[methodSelector.selectedIndex].value;
    let apiFunc = jabra[apiFuncName];
    let result = apiFunc.call(jabra, txtParam1.value, txtParam2.value, txtParam3.value, txtParam4.value, txtParam5.value);
    if (result && result instanceof Promise) {
      result.then((value) => {
        addResponseMessage(value);
      }).catch((error) => {
        addError(error);
      });
    }
  };

  clearMessageAreaBtn.onclick = () => {
    messageArea.value="";
  };

  clearErrorAreaBtn.onclick = () => {
    errorArea.value="";
  };

  function addError(err) {  
    let txt = (typeof err === 'string' || err instanceof String) ? "errorstring: " + err : "error object: " + JSON.stringify(err, null, 2);
    errorArea.value = errorArea.value + "\n" + txt;
  }

  function addStatusMessage(msg) {
    let txt = (typeof msg === 'string' || msg instanceof String) ? msg : "Status: " + JSON.stringify(msg, null, 2);
    messageArea.value = messageArea.value + "\n" + txt;
  }

  function addResponseMessage(msg) {
    let txt = (typeof msg === 'string' || msg instanceof String) ? "response string: " + msg : "response object: " + JSON.stringify(msg, null, 2);
    messageArea.value = messageArea.value + "\n" + txt;
  }

  function addEventMessage(msg) {
    let txt = (typeof msg === 'string' || msg instanceof String) ? "event string: " + msg : "event object: " + JSON.stringify(msg, null, 2);
    messageArea.value = messageArea.value + "\n" + txt;
  }

}, false);