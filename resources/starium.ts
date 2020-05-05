import axios from 'axios'
import * as AWS from 'aws-sdk'

export type StariumConfig = {
  region: string
  configParameterName: string
  currentDate: Date
  bucketName: string
  resultFilePath: string
}

type ServiceEntry = {
  name: string
  endpointUrl: string
}

type ServiceConfig = {
  services: Array<ServiceEntry>
}

type ServiceWatchResultEntry = {
  name: string
  status: string
  errorDetail?: string
}


class ConfigFormatError extends Error {}


export class StariumBackend {

  config: StariumConfig

  constructor(config: StariumConfig) {
    this.config = config
  }

  public async execute() {
    try {

      const configDocument: string = await this.getConfigDocument()
      const json = JSON.parse(configDocument)
      const serviceConfig: ServiceConfig = this.parseConfig(json)
      let watchResultList:  Array<ServiceWatchResultEntry> = []

      for(let service of serviceConfig.services) {
        try {
          await axios.get(service.endpointUrl)
          watchResultList.push({
            name: service.name,
            status: 'OK'
          })
        } catch(e) {
          watchResultList.push({
            name: service.name,
            status: 'ERROR',
            errorDetail: e.message
          })
        }
      }

      await this.saveResult(watchResultList)

    } catch(e) {
      console.log(e)
      throw e
    }

  }

  private async getConfigDocument(): Promise<string> {
    const ssm = new AWS.SSM({
      region: this.config.region
    })

    const document = await ssm.getParameter({
      Name: this.config.configParameterName
    }).promise()

    const data: any = document.$response.data
    console.log(data?.Parameter?.Value)
    return String(data?.Parameter?.Value)
  }

  private parseConfig(json: any): ServiceConfig {
    let config: ServiceConfig = {
      services: []
    }

    if(!json.services) {
      throw new ConfigFormatError('Configuration file does not include "services" entry.')
    }

    Object.keys(json.services).forEach(key => {
      if(!json.services[key]['endpoint_url']) {
        throw new ConfigFormatError(key + ': Missing "endpoint_url" key.')
      }
      config.services.push({
        name: key,
        endpointUrl: json.services[key].endpoint_url
      })
    })

    return config
  }


  async saveResult(watchResultList: Array<ServiceWatchResultEntry>) {
    const s3 = new AWS.S3({
      region: this.config.region
    })

    const resultObject: any = {
      last_updated: this.config.currentDate.toISOString(),
      services: {}
    }

    watchResultList.forEach(entry => {
      resultObject.services[entry.name] = {
        status: entry.status,
        error_detail: entry.errorDetail ?? ''
      }
    })

    console.log(JSON.stringify(resultObject))

    const s3Result = await s3.putObject({
      Body: JSON.stringify(resultObject),
      Bucket: this.config.bucketName,
      Key: this.config.resultFilePath,
    }).promise()
    console.log(s3Result)
  }
}
