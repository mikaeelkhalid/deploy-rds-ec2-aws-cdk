# Deploy RDS with EC2 using AWS CDK

## How to Use

1. Clone the repository

2. Install the dependencies

```bash
npm install
```

3. Create a Key pair with the name of `ec2-key-pair` in your default region

4. Create the CDK stack

```bash
cdk deploy \
  --outputs-file ./cdk-outputs.json
```

4. Open the AWS CloudFormation Console and the stack should be created in your
   default region

5. Cleanup

```bash
cdk destroy
```
