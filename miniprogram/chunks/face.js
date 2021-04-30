'use strict';

var tfjs = require('./tfjs.js');

/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
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

// Container for the coordinates of the facial bounding box.






const disposeBox = (box) => {
  box.startEndTensor.dispose();
  box.startPoint.dispose();
  box.endPoint.dispose();
};

const createBox = (startEndTensor) => ({
  startEndTensor,
  startPoint: tfjs.slice(startEndTensor, [0, 0], [-1, 2]),
  endPoint: tfjs.slice(startEndTensor, [0, 2], [-1, 2])
});

const scaleBox = (box, factors) => {
  const starts = tfjs.mul(box.startPoint, factors);
  const ends = tfjs.mul(box.endPoint, factors);

  const newCoordinates =
      tfjs.concat2d([starts , ends ], 1);

  return createBox(newCoordinates);
};

/*
 * The object describing a face.
 */




























const ANCHORS_CONFIG = {
  'strides': [8, 16],
  'anchors': [2, 6]
};

// `NUM_LANDMARKS` is a fixed property of the model.
const NUM_LANDMARKS = 6;

function generateAnchors(
    width, height, outputSpec) {
  const anchors = [];
  for (let i = 0; i < outputSpec.strides.length; i++) {
    const stride = outputSpec.strides[i];
    const gridRows = Math.floor((height + stride - 1) / stride);
    const gridCols = Math.floor((width + stride - 1) / stride);
    const anchorsNum = outputSpec.anchors[i];

    for (let gridY = 0; gridY < gridRows; gridY++) {
      const anchorY = stride * (gridY + 0.5);

      for (let gridX = 0; gridX < gridCols; gridX++) {
        const anchorX = stride * (gridX + 0.5);
        for (let n = 0; n < anchorsNum; n++) {
          anchors.push([anchorX, anchorY]);
        }
      }
    }
  }

  return anchors;
}

function decodeBounds(
    boxOutputs, anchors,
    inputSize) {
  const boxStarts = tfjs.slice(boxOutputs, [0, 1], [-1, 2]);
  const centers = tfjs.add(boxStarts, anchors);
  const boxSizes = tfjs.slice(boxOutputs, [0, 3], [-1, 2]);

  const boxSizesNormalized = tfjs.div(boxSizes, inputSize);
  const centersNormalized = tfjs.div(centers, inputSize);

  const halfBoxSize = tfjs.div(boxSizesNormalized, 2);
  const starts = tfjs.sub(centersNormalized, halfBoxSize);
  const ends = tfjs.add(centersNormalized, halfBoxSize);

  const startNormalized = tfjs.mul(starts, inputSize);
  const endNormalized = tfjs.mul(ends, inputSize);

  const concatAxis = 1;
  return tfjs.concat2d(
      [startNormalized , endNormalized ],
      concatAxis);
}

function getInputTensorDimensions(input

) {
  return input instanceof tfjs.Tensor ? [input.shape[0], input.shape[1]] :
                                      [input.height, input.width];
}

function flipFaceHorizontal(
    face, imageWidth) {
  let flippedTopLeft,
      flippedBottomRight,
      flippedLandmarks;

  if (face.topLeft instanceof tfjs.Tensor &&
      face.bottomRight instanceof tfjs.Tensor) {
    const [topLeft, bottomRight] = tfjs.tidy(() => {
      return [
        tfjs.concat([
          tfjs.slice(tfjs.sub(imageWidth - 1, (face.topLeft )), 0, 1),
          tfjs.slice((face.topLeft ), 1, 1)
        ]) ,
        tfjs.concat([
          tfjs.sub(imageWidth - 1,
            tfjs.slice((face.bottomRight ), 0, 1)),
          tfjs.slice((face.bottomRight ), 1, 1)
        ]) 
      ];
    });

    flippedTopLeft = topLeft;
    flippedBottomRight = bottomRight;

    if (face.landmarks != null) {
      flippedLandmarks = tfjs.tidy(() => {
        const a =
            tfjs.sub(tfjs.tensor1d([imageWidth - 1, 0]), face.landmarks);
        const b = tfjs.tensor1d([1, -1]);
        const product = tfjs.mul(a, b);
        return product;
      });
    }
  } else {
    const [topLeftX, topLeftY] = face.topLeft ;
    const [bottomRightX, bottomRightY] = face.bottomRight ;

    flippedTopLeft = [imageWidth - 1 - topLeftX, topLeftY];
    flippedBottomRight = [imageWidth - 1 - bottomRightX, bottomRightY];

    if (face.landmarks != null) {
      flippedLandmarks =
          (face.landmarks ).map((coord) => ([
                                               imageWidth - 1 - coord[0],
                                               coord[1]
                                             ]));
    }
  }

  const flippedFace = {
    topLeft: flippedTopLeft,
    bottomRight: flippedBottomRight
  };

  if (flippedLandmarks != null) {
    flippedFace.landmarks = flippedLandmarks;
  }

  if (face.probability != null) {
    flippedFace.probability = face.probability instanceof tfjs.Tensor ?
        face.probability.clone() :
        face.probability;
  }

  return flippedFace;
}

function scaleBoxFromPrediction(
    face, scaleFactor) {
  return tfjs.tidy(() => {
    let box;
    if (face.hasOwnProperty('box')) {
      box = (face ).box;
    } else {
      box = face;
    }
    return tfjs.squeeze(scaleBox(box , scaleFactor).startEndTensor);
  });
}

class BlazeFaceModel {
  
  
  
  
  
  
  
  
  
  

  constructor(
      model, width, height, maxFaces,
      iouThreshold, scoreThreshold) {
    this.blazeFaceModel = model;
    this.width = width;
    this.height = height;
    this.maxFaces = maxFaces;
    this.anchorsData = generateAnchors(
        width, height,
        ANCHORS_CONFIG 
);
    this.anchors = tfjs.tensor2d(this.anchorsData);
    this.inputSizeData = [width, height];
    this.inputSize = tfjs.tensor1d([width, height]);

    this.iouThreshold = iouThreshold;
    this.scoreThreshold = scoreThreshold;
  }

  async getBoundingBoxes(
      inputImage, returnTensors,
      annotateBoxes = true)


 {
    const [detectedOutputs, boxes, scores] = tfjs.tidy((

) => {
      const resizedImage = tfjs.image.resizeBilinear(inputImage,
        [this.width, this.height]);
      const normalizedImage = tfjs.mul(tfjs.sub(tfjs.div(resizedImage, 255), 0.5), 2);

      // [1, 897, 17] 1 = batch, 897 = number of anchors
      const batchedPrediction = this.blazeFaceModel.predict(normalizedImage);
      const prediction = tfjs.squeeze((batchedPrediction ));

      const decodedBounds =
          decodeBounds(prediction , this.anchors, this.inputSize);
      const logits = tfjs.slice(prediction , [0, 0], [-1, 1]);
      const scores = tfjs.squeeze(tfjs.sigmoid(logits));
      return [prediction , decodedBounds, scores ];
    });

    // TODO: Once tf.image.nonMaxSuppression includes a flag to suppress console
    // warnings for not using async version, pass that flag in.
    const savedConsoleWarnFn = console.warn;
    console.warn = () => {};
    const boxIndicesTensor = tfjs.image.nonMaxSuppression(
        boxes, scores, this.maxFaces, this.iouThreshold, this.scoreThreshold);
    console.warn = savedConsoleWarnFn;

    const boxIndices = await boxIndicesTensor.array();
    boxIndicesTensor.dispose();

    let boundingBoxes = boxIndices.map(
        (boxIndex) => tfjs.slice(boxes, [boxIndex, 0], [1, -1]));
    if (!returnTensors) {
      boundingBoxes = await Promise.all(
          boundingBoxes.map(async (boundingBox) => {
            const vals = await boundingBox.array();
            boundingBox.dispose();
            return vals;
          }));
    }

    const originalHeight = inputImage.shape[1];
    const originalWidth = inputImage.shape[2];

    let scaleFactor;
    if (returnTensors) {
      scaleFactor = tfjs.div([originalWidth, originalHeight], this.inputSize);
    } else {
      scaleFactor = [
        originalWidth / this.inputSizeData[0],
        originalHeight / this.inputSizeData[1]
      ];
    }

    const annotatedBoxes = [];
    for (let i = 0; i < boundingBoxes.length; i++) {
      const boundingBox = boundingBoxes[i] ;
      const annotatedBox = tfjs.tidy(() => {
        const box = boundingBox instanceof tfjs.Tensor ?
            createBox(boundingBox) :
            createBox(tfjs.tensor2d(boundingBox));

        if (!annotateBoxes) {
          return box;
        }

        const boxIndex = boxIndices[i];

        let anchor;
        if (returnTensors) {
          anchor = tfjs.slice(this.anchors, [boxIndex, 0], [1, 2]);
        } else {
          anchor = this.anchorsData[boxIndex] ;
        }

        const landmarks = tfjs.reshape(tfjs.squeeze(tfjs.slice(detectedOutputs,
          [boxIndex, NUM_LANDMARKS - 1], [1, -1])), [NUM_LANDMARKS, -1]);
        const probability = tfjs.slice(scores, [boxIndex], [1]);

        return {box, landmarks, probability, anchor};
      });
      annotatedBoxes.push(annotatedBox);
    }

    boxes.dispose();
    scores.dispose();
    detectedOutputs.dispose();

    return {
      boxes: annotatedBoxes ,
      scaleFactor
    };
  }

  /**
   * Returns an array of faces in an image.
   *
   * @param input The image to classify. Can be a tensor, DOM element image,
   * video, or canvas.
   * @param returnTensors (defaults to `false`) Whether to return tensors as
   * opposed to values.
   * @param flipHorizontal Whether to flip/mirror the facial keypoints
   * horizontally. Should be true for videos that are flipped by default (e.g.
   * webcams).
   * @param annotateBoxes (defaults to `true`) Whether to annotate bounding
   * boxes with additional properties such as landmarks and probability. Pass in
   * `false` for faster inference if annotations are not needed.
   *
   * @return An array of detected faces, each with the following properties:
   *  `topLeft`: the upper left coordinate of the face in the form `[x, y]`
   *  `bottomRight`: the lower right coordinate of the face in the form `[x, y]`
   *  `landmarks`: facial landmark coordinates
   *  `probability`: the probability of the face being present
   */
  async estimateFaces(
      input
,
      returnTensors = false, flipHorizontal = false,
      annotateBoxes = true) {
    const [, width] = getInputTensorDimensions(input);
    const image = tfjs.tidy(() => {
      if (!(input instanceof tfjs.Tensor)) {
        input = tfjs.fromPixels(input);
      }
      return tfjs.expandDims(tfjs.cast((input ), 'float32'), 0);
    });
    const {boxes, scaleFactor} = await this.getBoundingBoxes(
        image , returnTensors, annotateBoxes);
    image.dispose();

    if (returnTensors) {
      return boxes.map((face) => {
        const scaledBox =
            scaleBoxFromPrediction(face, scaleFactor );
        let normalizedFace = {
          topLeft: tfjs.slice(scaledBox, [0], [2]) ,
          bottomRight: tfjs.slice(scaledBox, [2], [2]) 
        };

        if (annotateBoxes) {
          const {landmarks, probability, anchor} = face 



;

          const normalizedLandmarks =
              tfjs.mul(tfjs.add(landmarks, anchor), scaleFactor);
          normalizedFace.landmarks = normalizedLandmarks;
          normalizedFace.probability = probability;
        }

        if (flipHorizontal) {
          normalizedFace = flipFaceHorizontal(normalizedFace, width);
        }
        return normalizedFace;
      });
    }

    return Promise.all(boxes.map(async (face) => {
      const scaledBox =
          scaleBoxFromPrediction(face, scaleFactor );
      let normalizedFace;
      if (!annotateBoxes) {
        const boxData = await scaledBox.array();
        normalizedFace = {
          topLeft: (boxData ).slice(0, 2) ,
          bottomRight: (boxData ).slice(2) 
        };
      } else {
        const [landmarkData, boxData, probabilityData] =
            await Promise.all([face.landmarks, scaledBox, face.probability].map(
                async d => d.array()));

        const anchor = face.anchor ;
        const [scaleFactorX, scaleFactorY] = scaleFactor ;
        const scaledLandmarks =
            (landmarkData )
                .map(landmark => ([
                       (landmark[0] + anchor[0]) * scaleFactorX,
                       (landmark[1] + anchor[1]) * scaleFactorY
                     ]));

        normalizedFace = {
          topLeft: (boxData ).slice(0, 2) ,
          bottomRight: (boxData ).slice(2) ,
          landmarks: scaledLandmarks,
          probability: probabilityData 
        };

        disposeBox(face.box);
        face.landmarks.dispose();
        face.probability.dispose();
      }

      scaledBox.dispose();

      if (flipHorizontal) {
        normalizedFace = flipFaceHorizontal(normalizedFace, width);
      }

      return normalizedFace;
    }));
  }
}

exports.BlazeFaceModel = BlazeFaceModel;
