/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs-core';
// tslint:disable-next-line: no-imports-from-dist
import {ALL_ENVS, BROWSER_ENVS, describeWithFlags} from '@tensorflow/tfjs-core/dist/jasmine_util';
// tslint:disable-next-line: no-imports-from-dist
import {expectArraysClose} from '@tensorflow/tfjs-core/dist/test_util';

import * as poseDetection from '../index';
import {getXYPerFrame, KARMA_SERVER, loadImage, loadVideo} from '../test_util';

const EPSILON_IMAGE = 10;
const EPSILON_VIDEO = 15;

// ref:
// https://github.com/google/mediapipe/blob/7c331ad58b2cca0dca468e342768900041d65adc/mediapipe/python/solutions/pose_test.py#L31-L51
const EXPECTED_LANDMARKS = [
  [460, 283], [467, 273], [471, 273], [474, 273], [465, 273], [465, 273],
  [466, 273], [491, 277], [480, 277], [470, 294], [465, 294], [545, 319],
  [453, 329], [622, 323], [375, 316], [696, 316], [299, 307], [719, 316],
  [278, 306], [721, 311], [274, 304], [713, 313], [283, 306], [520, 476],
  [467, 471], [612, 550], [358, 490], [701, 613], [349, 611], [709, 624],
  [363, 630], [730, 633], [303, 628]
];

describeWithFlags('BlazePose', ALL_ENVS, () => {
  let timeout: number;

  beforeAll(() => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;  // 2mins
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it('estimatePoses does not leak memory.', async () => {
    const startTensors = tf.memory().numTensors;

    // Note: this makes a network request for model assets.
    const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose, {runtime: 'tfjs'});
    const input: tf.Tensor3D = tf.zeros([128, 128, 3]);

    const beforeTensors = tf.memory().numTensors;

    await detector.estimatePoses(input);

    expect(tf.memory().numTensors).toEqual(beforeTensors);

    detector.dispose();
    input.dispose();

    expect(tf.memory().numTensors).toEqual(startTensors);
  });

  it('throws error when runtime is not set.', async (done) => {
    try {
      await poseDetection.createDetector(
          poseDetection.SupportedModels.BlazePose);
      done.fail('Loading without runtime succeeded unexpectedly.');
    } catch (e) {
      expect(e.message).toEqual(
          `Expect modelConfig.runtime to be either ` +
          `'tfjs' or 'mediapipe', but got undefined`);
      done();
    }
  });
});

describeWithFlags('BlazePose static image ', BROWSER_ENVS, () => {
  let detector: poseDetection.PoseDetector;
  let image: HTMLImageElement;
  let timeout: number;

  beforeAll(async () => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;  // 2mins

    image = await loadImage('pose.jpg', 1000, 667);
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it('test.', async () => {
    const startTensors = tf.memory().numTensors;

    // Note: this makes a network request for model assets.
    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        {runtime: 'tfjs', enableSmoothing: false});

    const beforeTensors = tf.memory().numTensors;

    const result = await detector.estimatePoses(
        image,
        {runtime: 'tfjs', maxPoses: 1, flipHorizontal: false} as
            poseDetection.BlazePoseTfjsEstimationConfig);
    const xy = result[0].keypoints.map((keypoint) => [keypoint.x, keypoint.y]);
    const expected = EXPECTED_LANDMARKS;
    expectArraysClose(xy, expected, EPSILON_IMAGE);

    expect(tf.memory().numTensors).toEqual(beforeTensors);

    detector.dispose();

    expect(tf.memory().numTensors).toEqual(startTensors);
  });
});

describeWithFlags('BlazePose video ', BROWSER_ENVS, () => {
  let detector: poseDetection.PoseDetector;
  let timeout: number;
  let expected: number[][][];

  beforeAll(async () => {
    timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;  // 2mins

    expected = await fetch(`${KARMA_SERVER}/pose_squats.full.json`)
                   .then(response => response.json())
                   .then(result => getXYPerFrame(result));
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
  });

  it('test.', async () => {
    // Note: this makes a network request for model assets.

    const model = poseDetection.SupportedModels.BlazePose;
    detector = await poseDetection.createDetector(model, {runtime: 'tfjs'});

    const result: number[][][] = [];

    const callback = async(video: HTMLVideoElement, timestamp: number):
        Promise<poseDetection.Pose[]> => {
          const poses =
              await detector.estimatePoses(video, null /* config */, timestamp);
          result.push(poses[0].keypoints.map(kp => [kp.x, kp.y]));
          return poses;
        };

    // Original video source in 720 * 1280 resolution:
    // https://www.pexels.com/video/woman-doing-squats-4838220/ Video is
    // compressed to be smaller with less frames (5fps), using below
    // command:
    // `ffmpeg -i original_pose.mp4 -r 5 -vcodec libx264 -crf 28 -profile:v
    // baseline pose_squats.mp4`
    await loadVideo('pose_squats.mp4', 5 /* fps */, callback, expected, model);

    expectArraysClose(result, expected, EPSILON_VIDEO);

    detector.dispose();
  });
});
