# Fargate Deployment Process

The Fargate containers can be deployed from the console or via the command line tools ecs-cli. The following instructions are from the aws documentation and use the ecs-cli.

Following are notes from deployment.

## Deployment

Create the task execution role:

```bash
aws iam --region eu-west-1 create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://task-execution-assume-role.json
```

Attach the policy:

```bash
aws iam --region eu-west-1 attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

Setup the Fargate cluster:

```bash
ecs-cli configure --cluster tango-graphing --default-launch-type FARGATE --config-name tango-graphing-config --region eu-west-1
```

Create a profile (aws key and secret removed):

```bash
ecs-cli configure profile --access-key KEY --secret-key SECRET --profile-name tango-graphing-profile
```

Bring up the cluster:

```bash
ecs-cli up --cluster-config tango-graphing-config --ecs-profile tango-graphing-profile
```

The command should output something similar to the following:

```bash
INFO[0008] Created cluster                               cluster=tango-graphing region=eu-west-1
INFO[0011] Waiting for your cluster resources to be created... 
INFO[0012] Cloudformation stack status                   stackStatus=CREATE_IN_PROGRESS
VPC created: REMOVED
Subnet created: REMOVED
Subnet created: REMOVED
Cluster creation succeeded.
```

The cluster came up ok, but we need to make some changes to allow inbound traffic. Describe the cluster:

```bash
aws ec2 describe-security-groups --filters Name=vpc-id,Values=vpc-0f46ca80208998dc4 --region eu-west-1
```

The output of this command contains your security group ID, which is used in the next step.

```bash
{
    "SecurityGroups": [
        {
            "Description": "default VPC security group",
            "GroupName": "default",
            "IpPermissions": [
                {
                    "IpProtocol": "-1",
                    "IpRanges": [],
                    "Ipv6Ranges": [],
                    "PrefixListIds": [],
                    "UserIdGroupPairs": [
                        {
                            "GroupId": "REMOVED",
                            "UserId": "REMOVED"
                        }
                    ]
                }
            ],
            "OwnerId": "REMOVED",
            "GroupId": "REMOVED",
            "IpPermissionsEgress": [
                {
                    "IpProtocol": "-1",
                    "IpRanges": [
                        {
                            "CidrIp": "0.0.0.0/0"
                        }
                    ],
                    "Ipv6Ranges": [],
                    "PrefixListIds": [],
                    "UserIdGroupPairs": []
                }
            ],
            "VpcId": "REMOVED"
        }
    ]
}
```

Add the subnets and security group to the ecs-params.yml file. This is used to parameterize the container when it is brought up. Using AWS CLI, add a security group rule to allow inbound access on port 8000:

```bash
aws ec2 authorize-security-group-ingress --group-id REMOVED --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region eu-west-1
```

Now bring up the container:

```bash
ecs-cli compose --project-name tango-graphing service up --create-log-groups --cluster-config tango-graphing-config --ecs-profile tango-graphing-profile
```

## See Running Containers

```bash
ecs-cli compose --project-name tango-graphing service ps --cluster-config tango-graphing-config --ecs-profile tango-graphing-profile
```

## Update The Deployment

Update image:

```bash
ecs-cli compose --project-name tango-graphing service up --create-log-groups --cluster-config tango-graphing-config --ecs-profile tango-graphing-profile --force-deployment
```

This will cause the IP address to change, so the serverless project must be updated also.

## Debug

See the logs:

```bash
ecs-cli logs --task-id REMOVED --follow --cluster-config tango-graphing-config --ecs-profile tango-graphing-profile 
```
