---
id: "aws_vpc_entity_nat_gateway.NatGateway"
title: "Table: nat_gateway"
displayed_sidebar: "docs"
sidebar_label: "SQL"
sidebar_position: 0
custom_edit_url: null
---

Table to manage AWS NAT Gateway instances.
A NAT gateway is a Network Address Translation (NAT) service.
You can use a NAT gateway so that instances in a private subnet can connect to services
outside your VPC but external services cannot initiate a connection with those instances.

**`Example`**

```sql TheButton[Manage a NAT gateway]="Manage a NAT gateway"
INSERT INTO nat_gateway (connectivity_type, subnet_id, tags) SELECT 'private', id, '{"Name":"nat_gateway"}
FROM subnet WHERE cidr_block = '191.0.0.0/16';

SELECT * FROM nat_gateway WHERE tags ->> 'name' = 'nat_gateway';

DELETE FROM nat_gateway WHERE tags ->> 'name' = 'nat_gateway';
```

**`See`**

 - https://github.com/iasql/iasql-engine/blob/main/test/modules/aws-vpc-eip-nat-integration.ts#L218L221
 - https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html

## Columns

• **connectivity\_type**: [`connectivity_type`](../enums/aws_vpc_entity_nat_gateway.ConnectivityType.md)

Connectivity type for this NAT gateway

• `Optional` **elastic\_ip**: [`elastic_ip`](aws_vpc_entity_elastic_ip.ElasticIp.md)

Reference to the elastic IP used by this NAT gateway

**`See`**

https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html

• `Optional` **nat\_gateway\_id**: `string`

AWS ID to identify the NAT gateway

• **region**: `string`

Reference to the region where it belongs

• `Optional` **state**: [`nat_gateway_state`](../enums/aws_vpc_entity_nat_gateway.NatGatewayState.md)

Current state for the gateway

• `Optional` **subnet**: [`subnet`](aws_vpc_entity_subnet.Subnet.md)

Reference to the associated subnets for the NAT gateway

**`See`**

https://aws.amazon.com/premiumsupport/knowledge-center/nat-gateway-vpc-private-subnet/

• `Optional` **tags**: `Object`

Complex type to provide identifier tags for the gateway

#### Type definition

▪ [key: `string`]: `string`