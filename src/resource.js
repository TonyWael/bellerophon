/**
 * Created by arminhammer on 11/24/15.
 */

'use strict';
var _ = require('lodash');

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var P = require('bluebird');

var ec2 = P.promisifyAll(new AWS.EC2());
var ASG = P.promisifyAll(new AWS.AutoScaling());
var S3 = P.promisifyAll(new AWS.S3());
var cloudfront = P.promisifyAll(new AWS.CloudFront());

var buildName = function(name) {
	name = name.replace( /\W/g , '');
	return name + 'Resource';
};

function baseConstruct(obj, name, body) {
	obj.inTemplate = false;
	obj.templateParams = {};
	obj.id = name;
	obj.name = buildName(name);
	obj.body = body;
}

var Resource = {
	resources: {
		AutoScaling: {
			AutoScalingGroup: {
				call: function() { return ASG.describeAutoScalingGroupsAsync({}) },
				resBlock: 'AutoScalingGroups',
				rName: 'AutoScalingGroupName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::AutoScaling::AutoScalingGroup',
						'Properties': {
							'AvailabilityZones': [],
							'Cooldown': 'String',
							'DesiredCapacity': 'String',
							'HealthCheckGracePeriod': 'Integer',
							'HealthCheckType': 'String',
							'InstanceId': 'String',
							'LaunchConfigurationName': 'String',
							'LoadBalancerNames': [],
							'MaxSize': 'String',
							'MetricsCollection': [],
							'MinSize': 'String',
							'NotificationConfigurations': [],
							'PlacementGroup': 'String',
							'Tags': [],
							'TerminationPolicies': [],
							'VPCZoneIdentifier': []
						}
					};
				}
			},
			LaunchConfiguration: {
				call: function() { return ASG.describeLaunchConfigurationsAsync({}) },
				resBlock: 'LaunchConfigurations',
				rName: 'LaunchConfigurationName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::AutoScaling::LaunchConfiguration',
						'Properties': {
							'AssociatePublicIpAddress': 'Boolean',
							'BlockDeviceMappings': [],
							'ClassicLinkVPCId': 'String',
							'ClassicLinkVPCSecurityGroups': [],
							'EbsOptimized': 'Boolean',
							'IamInstanceProfile': 'String',
							'ImageId': 'String',
							'InstanceId': 'String',
							'InstanceMonitoring': 'Boolean',
							'InstanceType': 'String',
							'KernelId': 'String',
							'KeyName': 'String',
							'PlacementTenancy': 'String',
							'RamDiskId': 'String',
							'SecurityGroups': [],
							'SpotPrice': 'String',
							'UserData': 'String'
						}
					}
				}
			},
			LifecycleHook: {
				call: function () {
					return ASG
						.describeAutoScalingGroupsAsync({})
						.then(function (data) {
							return P.map(data.AutoScalingGroups, function (group) {
								return ASG.describeLifecycleHooksAsync({AutoScalingGroupName: group.AutoScalingGroupName});
							});
						})
				},
				resBlock: 'LifecycleHooks',
				rName: 'LifecycleHookName',
				preHook: function (data) {
					var cycles = [];
					_.each(data, function (hook) {
						cycles = cycles.concat(hook.LifecycleHooks)
					});
					return {LifecycleHooks: cycles};
				},
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::AutoScaling::LifecycleHook',
						'Properties': {
							'AutoScalingGroupName': 'String',
							'DefaultResult': 'String',
							'HeartbeatTimeout': 'Integer',
							'LifecycleTransition': 'String',
							'NotificationMetadata': 'String',
							'NotificationTargetARN': 'String',
							'RoleARN': 'String'
						}
					}
				}
			},
			ScalingPolicy: {
				call: function() { return ASG.describePoliciesAsync({}) },
				resBlock: 'ScalingPolicies',
				rName: 'PolicyName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::AutoScaling::ScalingPolicy',
						'Properties': {
							'AdjustmentType': 'String',
							'AutoScalingGroupName': 'String',
							'Cooldown': 'String',
							'EstimatedInstanceWarmup': 'Integer',
							'MetricAggregationType': 'String',
							'MinAdjustmentMagnitude': 'Integer',
							'PolicyType': 'String',
							'ScalingAdjustment': 'String',
							'StepAdjustments': []
						}
					}
				}
			},
			ScheduledAction: {
				call: function() { return ASG.describeScheduledActionsAsync({}) },
				resBlock: 'ScheduledUpdateGroupActions',
				rName: 'ScheduledActionName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::AutoScaling::ScheduledAction',
						'Properties': {
							'AutoScalingGroupName': 'String',
							'DesiredCapacity': 'Integer',
							'EndTime': 'Time stamp',
							'MaxSize': 'Integer',
							'MinSize': 'Integer',
							'Recurrence': 'String',
							'StartTime': 'Time stamp'
						}
					}
				}
			}
		},
		CloudFormation : {
			//AWS::CloudFormation::Authentication
			//AWS::CloudFormation::CustomResource
			//AWS::CloudFormation::Init
			//AWS::CloudFormation::Interface
			//AWS::CloudFormation::Stack
			//AWS::CloudFormation::WaitCondition
			//AWS::CloudFormation::WaitConditionHandle
		},
		CloudFront: {
			Distribution: {
				call: function() {
					return cloudfront
						.listDistributionsAsync({})
				},
				resBlock: 'Items',
				rName: 'Id',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						"Type" : "AWS::CloudFront::Distribution",
						"Properties" : {
							"DistributionConfig" : {
								"Aliases" : [],
								"CacheBehaviors" : [],
								"Comment" : 'String',
								"CustomErrorResponses" : [],
								"DefaultCacheBehavior" : 'String',
								"DefaultRootObject" : 'String',
								"Enabled" : 'Boolean',
								"Logging" : 'String',
								"Origins" : [],
								"PriceClass" : 'String',
								"Restrictions" : 'Restriction',
								"ViewerCertificate" : 'ViewerCertificate',
								"WebACLId" : 'String'
							}
						}
					}
				}
			}

		},
		CloudTrail: {
			//AWS::CloudTrail::Trail
		},
		CloudWatch: {
			//AWS::CloudWatch::Alarm
		},
		CodeDeploy: {
			//AWS::CodeDeploy::Application
			//AWS::CodeDeploy::DeploymentConfig
			//AWS::CodeDeploy::DeploymentGroup
		},
		CodePipeline: {
			//AWS::CodePipeline::CustomActionType
			//AWS::CodePipeline::Pipeline
		},
		Config: {
			//AWS::Config::ConfigRule
			//AWS::Config::ConfigurationRecorder
			//AWS::Config::DeliveryChannel
		},
		DataPipeline: {
			//AWS::DataPipeline::Pipeline
		},
		DirectoryService: {
			//AWS::DirectoryService::MicrosoftAD
			//AWS::DirectoryService::SimpleAD
		},
		DynamoDB: {
			//AWS::DynamoDB::Table
		},
		EC2: {
			CustomerGateway: {
				call: function() { return ec2.describeCustomerGatewaysAsync({}) },
				resBlock: 'CustomerGateways',
				rName: 'CustomerGatewayId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::CustomerGateway',
						'Properties': {
							'BgpAsn': 'Number',
							'IpAddress': 'String',
							'Tags': [],
							'Type': 'String'
						}
					};
				}
			},
			DHCPOptions: {
				call: function() { return ec2.describeDhcpOptionsAsync({}) },
				resBlock: 'DhcpOptions',
				rName: 'DhcpOptionsId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::DHCPOptions',
						'Properties': {
							'DomainName': 'String',
							'DomainNameServers': [],
							'NetbiosNameServers': [],
							'NetbiosNodeType': 'Number',
							'NtpServers': [],
							'Tags': []
						}
					};
				}
			},
			EIP: {
				call: function() { return ec2.describeAddressesAsync({}) },
				resBlock: 'Addresses',
				rName: 'PublicIp',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::EIP',
						'Properties': {
							'InstanceId': 'String',
							'Domain': 'String'
						}
					};
				}
			},
			//EIPAssociation : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			Instance: {
				call: function() { return ec2.describeInstancesAsync({}) },
				resBlock: 'Instances',
				rName: 'InstanceId',
				preHook: function (data) {
					var returnInstances = [];
					_.each(data.Reservations, function (reservation) {
						_.each(reservation.Instances, function (instance) {
							returnInstances.push(instance);
						});
					});
					return {Instances: returnInstances};
				},
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::Instance',
						'Properties': {
							'AvailabilityZone': 'String',
							'BlockDeviceMappings': [],
							'DisableApiTermination': 'Boolean',
							'EbsOptimized': 'Boolean',
							'IamInstanceProfile': 'String',
							'ImageId': 'String',
							'InstanceInitiatedShutdownBehavior': 'String',
							'InstanceType': 'String',
							'KernelId': 'String',
							'KeyName': 'String',
							'Monitoring': 'Boolean',
							'NetworkInterfaces': [],
							'PlacementGroupName': 'String',
							'PrivateIpAddress': 'String',
							'RamdiskId': 'String',
							'SecurityGroupIds': ['String'],
							'SecurityGroups': ['String'],
							'SourceDestCheck': 'Boolean',
							'SsmAssociations': [],
							'SubnetId': 'String',
							'Tags': [],
							'Tenancy': 'String',
							'UserData': 'String',
							'Volumes': [],
							'AdditionalInfo': 'String'
						}
					};
				}
			},
			InternetGateway: {
				call: function() { return ec2.describeInternetGatewaysAsync({}) },
				resBlock: 'InternetGateways',
				rName: 'InternetGatewayId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::InternetGateway',
						'Properties': {
							'Tags': []
						}
					};
				}
			},
			NetworkAcl: {
				call: function() { return ec2.describeNetworkAclsAsync({}) },
				resBlock: 'NetworkAcls',
				rName: 'NetworkAclId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::NetworkAcl',
						'Properties': {
							'Tags': [],
							'VpcId': 'String'
						}
					};
				}
			},
			//NetworkAclEntry : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			NetworkInterface: {
				call: function() { return ec2.describeNetworkInterfacesAsync({}) },
				resBlock: 'NetworkInterfaces',
				rName: 'NetworkInterfaceId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::NetworkInterface',
						'Properties': {
							'Description': 'String',
							'GroupSet': ['String'],
							'PrivateIpAddress': 'String',
							'PrivateIpAddresses': [],
							'SecondaryPrivateIpAddressCount': 'Integer',
							'SourceDestCheck': 'Boolean',
							'SubnetId': 'String',
							'Tags': []
						}
					};
				}
			},
			//NetworkInterfaceAttachment : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {
			//};
			//}
			//},
			PlacementGroup: {
				call: function() { return ec2.describePlacementGroupsAsync({}) },
				resBlock: 'PlacementGroups',
				rName: 'GroupName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::PlacementGroup',
						'Properties': {
							'Strategy': 'String'
						}
					};
				}
			},
			//Route: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			RouteTable: {
				call: function() { return ec2.describeRouteTablesAsync({}) },
				resBlock: 'RouteTables',
				rName: 'RouteTableId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::RouteTable',
						'Properties': {
							'VpcId': 'String',
							'Tags': []
						}
					};
				}
			},
			SecurityGroup: {
				call: function() { return ec2.describeSecurityGroupsAsync({}) },
				resBlock: 'SecurityGroups',
				rName: 'GroupId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::SecurityGroup',
						'Properties': {
							'GroupDescription': 'String',
							'SecurityGroupEgress': [],
							'SecurityGroupIngress': [],
							'Tags': [],
							'VpcId': 'String'
						}
					};
				}
			},
			//SecurityGroupEgress: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			// }
			//},
			//SecurityGroupIngress: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			SpotFleet: {
				call: function() { return ec2.describeSpotFleetRequestsAsync({}) },
				resBlock: 'SpotFleetRequestConfigs',
				rName: 'SpotFleetRequestId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::SpotFleet',
						'Properties': {
							'SpotFleetRequestConfigData': 'SpotFleetRequestConfigData'
						}
					};
				}
			},
			Subnet: {
				call: function() { return ec2.describeSubnetsAsync({}) },
				resBlock: 'Subnets',
				rName: 'SubnetId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::Subnet',
						'Properties': {
							'AvailabilityZone': 'String',
							'CidrBlock': 'String',
							'MapPublicIpOnLaunch': 'Boolean',
							'Tags': [],
							'VpcId': {'Ref': 'String'}

						}
					};
				}
			},
			//SubnetNetworkAclAssociation: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			//SubnetRouteTableAssociation: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			Volume: {
				call: function() { return ec2.describeVolumesAsync({}) },
				resBlock: 'Volumes',
				rName: 'VolumeId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::Volume',
						'Properties': {
							'AutoEnableIO': 'Boolean',
							'AvailabilityZone': 'String',
							'Encrypted': 'Boolean',
							'Iops': 'Number',
							'KmsKeyId': 'String',
							'Size': 'String',
							'SnapshotId': 'String',
							'Tags': [],
							'VolumeType': 'String'
						}
					};
				}
			},
			//VolumeAttachment: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPC: {
				call: function() { return ec2.describeVpcsAsync({}) },
				resBlock: 'Vpcs',
				rName: 'VpcId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::VPC',
						'Properties': {
							'CidrBlock': 'String',
							'EnableDnsSupport': 'Boolean',
							'EnableDnsHostnames': 'Boolean',
							'InstanceTenancy': 'String',
							'Tags': []
						}
					};
				}
			},
			//VPCDHCPOptionsAssociation : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPCEndpoint: {
				call: function() { return ec2.describeVpcEndpointsAsync({}) },
				resBlock: 'VpcEndpoints',
				rName: 'VpcEndpointId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::VPCEndpoint',
						'Properties': {
							'PolicyDocument': {},
							'RouteTableIds': [],
							'ServiceName': 'String',
							'VpcId': 'String'
						}
					};
				}
			},
			//VPCGatewayAttachment: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPCPeeringConnection: {
				call: function() { return ec2.describeVpcPeeringConnectionsAsync({}) },
				resBlock: 'VpcPeeringConnections',
				rName: 'VpcPeeringConnectionId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::VPCPeeringConnection',
						'Properties': {
							'PeerVpcId': 'String',
							'Tags': [],
							'VpcId': 'String'
						}
					};
				}
			},
			VPNConnection: {
				call: function() { return ec2.describeVpnConnectionsAsync({}) },
				resBlock: 'VpnConnections',
				rName: 'VpnConnectionId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::VPNConnection',
						'Properties': {
							'Type': 'String',
							'CustomerGatewayId': 'GatewayID',
							'StaticRoutesOnly': 'Boolean',
							'Tags': [],
							'VpnGatewayId': 'GatewayID'
						}
					};
				}
			},
			//VPNConnectionRoute: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPNGateway: {
				call: function() { return ec2.describeVpnGatewaysAsync({}) },
				resBlock: 'VpnGateways',
				rName: 'VpnGatewayId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::EC2::VPNGateway',
						'Properties': {
							'Type': 'String',
							'Tags': []
						}
					};
				}
			}
			//VPNGatewayRoutePropagation: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//}
		},
		ECS: {
			//AWS::ECS::Cluster
			//AWS::ECS::Service
			//AWS::ECS::TaskDefinition
		},
		EFS: {
			//AWS::EFS::FileSystem
			//AWS::EFS::MountTarget
		},
		ElastiCache: {
			//AWS::ElastiCache::CacheCluster
			//AWS::ElastiCache::ParameterGroup
			//AWS::ElastiCache::ReplicationGroup
			//AWS::ElastiCache::SecurityGroup
			//AWS::ElastiCache::SecurityGroupIngress
			//AWS::ElastiCache::SubnetGroup
		},
		ElasticBeanstalk: {
			//AWS::ElasticBeanstalk::Application
			//AWS::ElasticBeanstalk::ApplicationVersion
			//AWS::ElasticBeanstalk::ConfigurationTemplate
			//AWS::ElasticBeanstalk::Environment
		},
		ElasticLoadBalancing: {
			//AWS::ElasticLoadBalancing::LoadBalancer
		},
		IAM: {
			//AWS::IAM::AccessKey
			//AWS::IAM::Group
			//AWS::IAM::InstanceProfile
			//AWS::IAM::ManagedPolicy
			//AWS::IAM::Policy
			//AWS::IAM::Role
			//AWS::IAM::User
			//AWS::IAM::UserToGroupAddition
		},
		Kinesis: {
			//AWS::Kinesis::Stream
		},
		KMS: {
			//AWS::KMS::Key
		},
		Lambda: {
			//AWS::Lambda::EventSourceMapping
			//AWS::Lambda::Function
			//AWS::Lambda::Permission
		},
		Logs: {
			//AWS::Logs::Destination
			//AWS::Logs::LogGroup
			//AWS::Logs::LogStream
			//AWS::Logs::MetricFilter
			//AWS::Logs::SubscriptionFilter
		},
		OpsWorks: {
			//AWS::OpsWorks::App
			//AWS::OpsWorks::ElasticLoadBalancerAttachment
			//AWS::OpsWorks::Instance
			//AWS::OpsWorks::Layer
			//AWS::OpsWorks::Stack
		},
		RDS: {
			//AWS::RDS::DBCluster
			//AWS::RDS::DBClusterParameterGroup
			//AWS::RDS::DBInstance
			//AWS::RDS::DBParameterGroup
			//AWS::RDS::DBSecurityGroup
			//AWS::RDS::DBSecurityGroupIngress
			//AWS::RDS::DBSubnetGroup
			//AWS::RDS::EventSubscription
			//AWS::RDS::OptionGroup
		},
		Redshift: {
			//AWS::Redshift::Cluster
			//AWS::Redshift::ClusterParameterGroup
			//AWS::Redshift::ClusterSecurityGroup
			//AWS::Redshift::ClusterSecurityGroupIngress
			//AWS::Redshift::ClusterSubnetGroup
		},
		Route53: {
			//AWS::Route53::HealthCheck
			//AWS::Route53::HostedZone
			//AWS::Route53::RecordSet
			//AWS::Route53::RecordSetGroup
		},
		S3: {
			Bucket: {
				call: function () {
					return S3
						.listBucketsAsync({})
						.then(function (data) {
							var finalBuckets = [];
							return P
								.map(data.Buckets, function(bucket) {
									return S3
										.getBucketVersioningAsync({ Bucket: bucket.Name })
										.then(function(versionData) {
											bucket.VersioningConfiguration = versionData;
										})
										.then(function() {
											finalBuckets.push(bucket);
										})
								})
								.then(function() {
									return { Buckets: finalBuckets };
								});
						})
				},
				resBlock: 'Buckets',
				rName: 'Name',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::S3::Bucket',
						'Properties': {
							'AccessControl': 'String',
							'BucketName': 'String',
							'CorsConfiguration': 'CORS Configuration',
							'LifecycleConfiguration': 'Lifecycle Configuration',
							'LoggingConfiguration': 'Logging Configuration',
							'NotificationConfiguration' : 'Notification Configuration',
							'ReplicationConfiguration' : 'Replication Configuration',
							'Tags': [],
							'VersioningConfiguration': 'Versioning Configuration',
							'WebsiteConfiguration': 'Website Configuration Type'
						}
					};
				}
			},
			BucketPolicy: {
				call: function() {
					return S3
						.listBucketsAsync({})
						.then(function (data) {
							var finalPolicies = [];
							return P
								.map(data.Buckets, function(bucket) {
									return S3
										.getBucketPolicyAsync({ Bucket: bucket.Name })
										.then(function(policy) {
											finalPolicies.push({ Bucket: bucket.Name, PolicyDocument: policy });
										})
										.catch(function() {
											//Silently catch the NoSuchPolicyException
											return;
										})
								})
								.then(function() {
									return { Policies: finalPolicies };
								});
						})
				},
				resBlock: 'Policies',
				rName: 'Bucket',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::S3::BucketPolicy',
						'Properties': {
							'Bucket': 'String',
							'PolicyDocument': 'JSON'
						}
					};
				}
			}
		},
		SDB: {
			//AWS::SDB::Domain
		},
		SNS: {
			//AWS::SNS::Topic
			//AWS::SNS::TopicPolicy
		},
		SQS: {
			//AWS::SQS::Queue
			//AWS::SQS::QueuePolicy
		},
		SSM: {
			//AWS::SSM::Document
		},
		WAF: {
			//AWS::WAF::ByteMatchSet
			//AWS::WAF::IPSet
			//AWS::WAF::Rule
			//AWS::WAF::SqlInjectionMatchSet
			//AWS::WAF::WebACL
		},
		WorkSpaces: {
			//AWS::WorkSpaces::Workspace
		}
	}
};

module.exports = Resource;
