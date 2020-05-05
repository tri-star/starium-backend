#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { StariumStack } from '../lib/starium-stack';

const app = new cdk.App();
new StariumStack(app, 'StariumStack');
