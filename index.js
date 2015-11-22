'use strict';
const electron = require('electron');
const app = electron.app;
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
const P = require('bluebird');

//var ipcMain = P.promisifyAll(require('electron').ipcMain);

var ec2 = P.promisifyAll(new AWS.EC2());
console.log('ec2');

const ipcMain = require('electron').ipcMain;

ipcMain.on('vpc-request', function(event, arg) {
	ec2
		.describeVpcsAsync({})
		.then(function(data) {
			console.log('Sending data');
			event.sender.send('vpc-reply', data);
		})
		.catch(function(e) {
			console.log(e);
		});
});

//ipcMain.on('synchronous-message', function(event, arg) {
	//console.log(arg);  // prints "ping"
	//event.returnValue = 'pong';
//});

/*
ipcMain
	.onAsync('vpc')
	.then(function(data) {
		console.log('VPC');
		console.log(data);
		event.sender.send('vpc', 'pong');
	})
	.catch(function(event) {
		"use strict";
		console.log('VPC-E');
		//console.log(e);

	});
*/


// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;
//let sourceWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 1200,
		height: 800
	});

	win.loadURL(`file://${__dirname}/ui/index.html`);
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
	//if (process.platform !== 'darwin') {
	//	app.quit();
	//}
	app.quit();
});

app.on('activate-with-no-open-windows', () => {
	console.log('activate-with-no-open-windows');
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	console.log('Ready');
	mainWindow = createMainWindow();
	//sourceWindow = createMainWindow();
});