import { config } from 'dotenv'
import { resolve } from 'path'
import * as cdk from '@aws-cdk/core'
import * as events from '@aws-cdk/aws-events'
import * as eventsTargets from '@aws-cdk/aws-events-targets'
import * as s3 from '@aws-cdk/aws-s3'
import * as lambda from '@aws-cdk/aws-lambda-nodejs'
import * as ssm from '@aws-cdk/aws-ssm'
import { Duration } from '@aws-cdk/core'

export class StariumStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    config({ path: resolve(__dirname,  '../.env') })

    const bucket = new s3.Bucket(this, "StatusDataBucket", {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html'
    })

    const configParameterName = process.env.CONFIG_PARAMETER_NAME || ''
    if(!configParameterName) {
      throw new Error('CONFIG_PARAMETER_NAME が指定されていません')
    }
    const stariumConfigDocument = ssm.StringParameter.fromStringParameterName(this, 'StariumConfigDocument', configParameterName)

    const handler = new lambda.NodejsFunction(this, 'StariumBackendFunction', {
      entry: './resources/index.ts',
      handler: 'handler',
      timeout: Duration.minutes(1),
      memorySize: 256,
      environment: {
        REGION: process.env.REGION || '',
        CONFIG_PARAMETER_NAME: process.env.CONFIG_PARAMETER_NAME || '',
        BUCKET_NAME: bucket.bucketName,
        RESULT_FILE_PATH: process.env.RESULT_FILE_PATH || '',
      }
    })

    new events.Rule(this, 'StariumWatchEvent', {
      schedule: events.Schedule.rate(Duration.minutes(5)),
      targets: [
        new eventsTargets.LambdaFunction(handler)
      ]
    })

    bucket.grantWrite(handler)
    stariumConfigDocument.grantRead(handler)
  }
}
