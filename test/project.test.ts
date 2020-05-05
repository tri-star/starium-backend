import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Starium from '../lib/starium-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Starium.StariumStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
