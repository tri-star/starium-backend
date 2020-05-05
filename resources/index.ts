import {StariumBackend, StariumConfig} from './starium'

export async function handler(event: any, _: any) {
  const config: StariumConfig = {
    region: process.env.REGION || '',
    configParameterName: process.env.CONFIG_PARAMETER_NAME || '',
    currentDate: new Date(),
    bucketName: process.env.BUCKET_NAME || '',
    resultFilePath: process.env.RESULT_FILE_PATH || '',
  }
  const stariumBackend = new StariumBackend(config)

  await stariumBackend.execute()
  return {status: "OK"};
}
