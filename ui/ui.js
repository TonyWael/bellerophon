/**
 * Created by arminhammer on 11/18/15.
 */

"use strict";

console.log('Loaded!');
//var P = require('bluebird');

var m = require('mithril');
var _ = require('lodash');


//console.log('Resource');
//console.log(Resource);

//var ipcRenderer = P.promisifyAll(require('electron').ipcRenderer);

// In renderer process (web page).
var ipcRenderer = require('electron').ipcRenderer;
//console.log(ipcRenderer.sendSync('synchronous-message', 'ping')); // prints "pong"

var log = function(msg, level) {
	if(!level) {
		level = 'info';
	}
	ipcRenderer.send('send-log', { from: 'UI:', level: level, msg: msg });
};

log('Initialized UI.');

function addToTemplate(resourceReq) {
	ipcRenderer.send('add-to-template-request', resourceReq);
}

/*
ipcRenderer.on('add-to-template-reply', function(event, res) {
	console.log('Added resource to template');
});
*/

function removeFromTemplate(resourceReq) {
	ipcRenderer.send('remove-from-template-request', resourceReq);
}

/*
ipcRenderer.on('remove-from-template-reply', function(event, res) {
	console.log('Removed resource from template');
});
*/

var resources = m.prop({});

ipcRenderer.send('update-resources', 'AWS::EC2::VPC');

ipcRenderer.on('update-resources', function(event, res) {
    m.startComputation();
	log('Updating resources');
	resources(res);
	console.log('Updating resources');
	console.log(resources());
	m.endComputation();
});

//console.log('Resources before');
//console.log(resources.vpcs);

ipcRenderer.on('get-resource-reply', function(event, res) {
	//console.log('Adding resources');
	m.startComputation();
	var params = {};
	switch(res.type) {
		case "AWS::EC2::VPC":
			params = { resBlock: res.Vpcs, constructor: Resource.AWS_EC2_VPC, name: "VpcId", targetBlock: resources.EC2.VPC };
			break;
		case "AWS::EC2::SUBNET":
			params = { resBlock: res.Subnets, constructor: Resource.AWS_EC2_SUBNET, name: "SubnetId", targetBlock: resources.EC2.Subnet };
			break;
		case "AWS::EC2::SECURITYGROUP":
			//console.log('SEC GROUP');
			//console.log(res);
			params = { resBlock: res.SecurityGroups, constructor: Resource.AWS_EC2_SECURITYGROUP, name: "GroupId", targetBlock: resources.EC2.SecurityGroup };
			break;
		default:
			console.log('Resource type not found.');
			break;
	}
	params.resBlock.forEach(function(r) {
		var newResource = new params.constructor(r[params.name], r);
		newResource.toggleInTemplate = function(setting) {
			newResource.inTemplate(setting);
			if(setting) {
				addToTemplate(newResource);
			} else {
				removeFromTemplate(newResource);
			}
		};
		params.targetBlock.push(newResource);
	});
	m.endComputation();
	//console.log('Added Resources!');
});

//ipcRenderer.send('get-resource-request', "AWS::EC2::VPC");
//ipcRenderer.send('get-resource-request', "AWS::EC2::SUBNET");
//ipcRenderer.send('get-resource-request', "AWS::EC2::SECURITYGROUP");

function openTemplateWindow() {
	//console.log('Clicked the button!');
	ipcRenderer.send('open-template-window');
}

var uiView = {
	controller: function() {
		this.resources = resources;
		this.openTemplateWindow = openTemplateWindow;
	},
	view: function(controller) {
		return m(".container-fluid", [
			m(".navbar.navbar-fixed-top", [
				m(".container", [
					m(".navbar-header", [
						m("a.navbar-brand[href='#']", "Bellerophon"),
						m("button.btn.btn-success.navbar-btn.navbar-right.pull-right#templateButton", { onclick: controller.openTemplateWindow }, "Show Template")
					])
				])
			]),
			m(".row.MainContent", [
				m("nav.col-xs-3.bs-docs-sidebar", [
					m("ul.nav.nav-stacked.fixed[id='sidebar']", [
						_.map(controller.resources(), function(resource, key) {
							return m("li", [
								m("a[href='#" + key + "']", key),
								m("ul.nav.nav-stacked", [
									_.map(controller.resources()[key], function(subResource, subKey) {
										if(controller.resources()[key][subKey].length > 0) {
											return m("li", [m("a[href='#" + key + subKey + "']", subKey)])
										}
									})
								])
							])
						})
					])
				]),
				m(".col-xs-9", [
					_.map(controller.resources(), function(group, key) {
						//console.log('prime');
						//console.log(group);
						//console.log(key);
						//console.log(controller.resources()[key]);
						return m("section.group[id='" + key + "']", [
							m("h3", key),
							_.map(controller.resources()[key], function(subResource, subKey) {
								//console.log('sub');
								//console.log(Object.keys(controller.resources()[key][subKey]).length);
								if(Object.keys(controller.resources()[key][subKey]).length > 0) {
									return m(".subgroup[id='" + key + subKey + "']", [
										m("h4", subKey),
										_.map(controller.resources()[key][subKey], function (resource) {
											//console.log('Looking');
											//console.log(resource);
											return m('div', [
												m('div', [
													m("input[type=checkbox]", {
														checked: resource.inTemplate,
														name: resource.id,
														onclick: m.withAttr("checked", function() {
															log('Checked ' + resource);
															if(resource.inTemplate) {
																removeFromTemplate({resource: resource, key: key, subKey: subKey});
															} else {
																addToTemplate({resource: resource, key: key, subKey: subKey});
															}
														})
													}),
													resource.id,
													resource.inTemplate
												]),
												m('div', [
													_.map(resource.body, function(bVal, bKey) {
														return m('div', [
															m('b', bKey + ': '),
															m('i', bVal)
														])
													})
												])
											])
										})
									])
								}
							})
						])
					})
				])
			])
		])
	}
};

m.mount(document.body,uiView);
