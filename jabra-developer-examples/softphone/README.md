# Jabra Softphone example (BETA)

## About this example
This simple example shows how to add web based softphone support for a Jabra device using the [Jabra browser SDK](https://github.com/gnaudio/jabra-browser-integration).

The example softphone shows Jabra integration with the following features:
* Can run directly in Chrome with no additional installation steps apart from the [Jabra browser SDK](https://github.com/gnaudio/jabra-browser-integration).
* Support for outgoing and incomming calls.
* Support for mute and hold.
* Real audio experience using playback/loopback... You will only be talking to - and hearing - yourself in calls :-) 
* Extensive ringer with both Jabra device indication + sound in speakers.
* Two-way synchronization between softphone GUI and Jabra device when changing state. For example, when you select mute on either the softphone OR the Jabra device, both softphone and the Jabra device will be updated accordingly regardless of how it was initiated.
* Automatic selection of Jabra device microphone and speakers (user does not have to manually select the Jabra device in the browser and OS). This is important, as speaking using a device that is not selected is typically the number ONE support issue for most softphone users.

*WARNING: This example is a BETA release - it has not been fully tested.*

# Pre-requisites

The [Jabra browser SDK](https://github.com/gnaudio/jabra-browser-integration) must be installed for this example to run.

Optional step if you want to run the example locally on your own PC when developing: For this you need a tool like [local-web-server](https://www.npmjs.com/package/local-web-server) (or similar) to serve pages locally under https.

To install the suggested local-web-server tool type ```npm install -g local-web-server```. 

# Run the sample

## Run pre-hosted version (recommended)

TODO: ...

## Run locally (for development)

Using the above mentioned local-web-server tool you can run this project locally with the following command (after chosing this project directory in your shell):

```ws --https``` 

Subsequently, open your browser with the address ```https://127.0.0.1:8000```

*You may get SSL security warnings in the browser when you run locally. These can be ignored.*

## Source code
For simplicity, the softphone example is written in plain javascript files (no modules) but we include the Jabra [typescript](https://www.typescriptlang.org/) declarations on top of most source files for better editor support. 

However, for non-trival softphones integrations we suggest you use [typescript](https://www.typescriptlang.org/), proper modularity and our npm module [@gnaudio/jabra-browser-integration](https://www.npmjs.com/package/@gnaudio/jabra-browser-integration).

The two most important source code files to look at are:
* ```softphone.stub.js``` that shows how to control a Jabra device from a fictive softphone.
* ```softphone.jabra.js``` that shows how to initialize the Jabra browser sdk and inform a softphone of key Jabra device events.

