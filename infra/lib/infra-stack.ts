import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class InfraStack extends cdk.Stack {
  private projectName = 'LightDoc';

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // S3 Buckets
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${this.projectName.toLowerCase()}-frontend-234234234`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,  // No public read access directly, only via CloudFront
    });
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    const s3Origin = origins.S3BucketOrigin.withOriginAccessIdentity(frontendBucket, {
      originAccessIdentity: oai,
    });
    frontendBucket.grantRead(oai);

    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `${this.projectName.toLowerCase()}-files-453543543`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ['*'], // You can replace '*' with specific domains
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.DELETE,
          ], // Allow all methods
          allowedHeaders: ['*'],
        },
      ],
    });

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: `${this.projectName}UserDocuemntsTable`,
      partitionKey: { name: 'user', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Lambda Function
    const backendLambda = new lambda.Function(this, 'BackendLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../dist/backend'),
      environment: {
        ["tableName"]: table.tableName,
        ["bucketName"]: filesBucket.bucketName
      }
    });

    table.grantReadWriteData(backendLambda);
    filesBucket.grantReadWrite(backendLambda);

    const [pool, authorizer] = this.CreateCognito();
    const api = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `${this.projectName}-API`,
    });


    // Lambda proxy integration
    const lambdaIntegration = new apigateway.LambdaIntegration(backendLambda, {
      proxy: true, // Ensure it's a proxy integration
    });

    // Create a resource and method
    const apiResource = api.root.addResource('api');
    const proxy = apiResource.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true, // Enable for all HTTP methods
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: authorizer,
      }
    });
    // Step 3: Set up CloudFront distribution
    const cloudFrontDistribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      errorResponses: [
        {
          // Handle missing files by redirecting to index.html (SPA handling)
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });


    // DNS Setup
    // const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
    //   domainName: 'lightdoc.cloud',
    // });

    // const certificate = new certificatemanager.Certificate(this, 'Certificate', {
    //   domainName: 'lightdoc.cloud',
    //   validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    // });

    // new route53.ARecord(this, 'CloudFrontAliasRecord', {
    //   zone: hostedZone,
    //   recordName: 'lightdoc',
    //   target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(cloudFrontDistribution)),
    // });

    // Deploy files from ../dist/frontend to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../dist/frontend')],
      destinationBucket: frontendBucket,
      distribution: cloudFrontDistribution, // Automatically update CloudFront after deployment
      distributionPaths: ['/*'], // Invalidate all files in CloudFront
    });
  }

  private CreateCognito(): [cognito.UserPoolClient, apigateway.CognitoUserPoolsAuthorizer] {
    // === Cognito User Pool & Identity Pool ===
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${this.projectName}-UserPool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'APIAuthorizer', {
      cognitoUserPools: [userPool],
    });

    return [userPoolClient, authorizer]
  }
}
