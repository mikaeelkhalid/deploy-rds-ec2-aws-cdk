import {
  App, 
  CfnOutput,
  Duration, 
  RemovalPolicy,
  Stack, 
  StackProps
} from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration, 
  AmazonLinuxImage,
  Instance, 
  InstanceClass,
  InstanceSize, 
  InstanceType,
  IpAddresses, 
  KeyPair,
  Peer, 
  Port,
  SecurityGroup,
  SubnetType, 
  Vpc
} from 'aws-cdk-lib/aws-ec2';
import {
  Credentials, 
  DatabaseInstance,
  DatabaseInstanceEngine, 
  PostgresEngineVersion
} from 'aws-cdk-lib/aws-rds';

export class DeployRDSEC2Stack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'main-vpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // create a security group for the EC2 instance
    const ec2InstanceSG = new SecurityGroup(this, 'ec2-instance-sg', {
      vpc,
    });

    ec2InstanceSG.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'allow SSH connections from anywhere',
    );

    // importing your SSH key
    const keyPair = KeyPair.fromKeyPairName(
      this,
      'key-pair',
      'ec2-key-pair',
    );

    // create the EC2 instance
    const ec2Instance = new Instance(this, 'ec2-instance', {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      securityGroup: ec2InstanceSG,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE2,
        InstanceSize.MICRO,
      ),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyPair,
    });

    // create RDS Instance
    const dbInstance = new DatabaseInstance(this, 'db-instance', {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14,
      }),
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.MICRO,
      ),
      credentials: Credentials.fromGeneratedSecret('postgres'),
      multiAz: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 120,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'test-db',
      publiclyAccessible: false,
    });

    dbInstance.connections.allowFrom(ec2Instance, Port.tcp(5432));

    new CfnOutput(this, 'db-endpoint', {
      value: dbInstance.instanceEndpoint.hostname,
    });

    new CfnOutput(this, 'secret-name', {
      value: dbInstance.secret?.secretName!,
    });
  }
}
