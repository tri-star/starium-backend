FROM node:12.16-buster

RUN yarn global add aws-cdk aws-sdk typescript ts-node

WORKDIR /app
