/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Pose } from '../../../tfjs-models-async/posenet';
import * as posenet from '../../../tfjs-models-sync/posenet';

const color = 'aqua';
const boundingBoxColor = 'red';
const lineWidth = 2;

function toTuple({ y, x }: { [key: string]: number }): [number, number] {
  return [y, x];
}

export function drawPoint(
  ctx: CanvasRenderingContext2D, y: number, x: number, r: number,
  color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export function drawSegment(
  [ay, ax]: [number, number], [by, bx]: [number, number], color: string,
  scale: number, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
// tslint:disable-next-line:no-any
export function drawSkeleton(
  keypoints: any, minConfidence: number, ctx: CanvasRenderingContext2D,
  scale = 1) {
  const adjacentKeyPoints =
    posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  // tslint:disable-next-line:no-any
  adjacentKeyPoints.forEach((keypoints: any) => {
    drawSegment(
      toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
      scale, ctx);
  });
}

/**
 * Draw pose keypoints onto a canvas
 */
// tslint:disable-next-line:no-any
export function drawKeypoints(
  keypoints: any, minConfidence: number, ctx: CanvasRenderingContext2D,
  scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
// tslint:disable-next-line:no-any
export function drawBoundingBox(
  keypoints: any, ctx: CanvasRenderingContext2D) {
  const boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(
    boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
    boundingBox.maxY - boundingBox.minY);

  ctx.strokeStyle = boundingBoxColor;
  ctx.stroke();
}

export function drawPoses(poses: Pose[], ctx: CanvasRenderingContext2D) {
  const minPoseConfidence = 0.3;
  const minPartConfidence = 0.3;
  // For each pose (i.e. person) detected in an image, loop through the poses
  // and draw the resulting skeleton and keypoints if over certain confidence
  // scores
  poses.forEach(({ score, keypoints }) => {
    if (score >= minPoseConfidence) {
      drawKeypoints(keypoints, minPartConfidence, ctx);
      drawSkeleton(keypoints, minPartConfidence, ctx);
    }
  });
  return poses;
}

