import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import type vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';

/**
 * Sets up a basic grayscale transfer function for volume rendering
 * @param volumeActor - The VTK volume actor
 * @param min - Minimum value for the transfer function
 * @param max - Maximum value for the transfer function
 */
export function setBasicTransferFunction(
  volumeActor: vtkVolume,
  min: number,
  max: number
): void {
  const property = volumeActor.getProperty();
  property.setInterpolationTypeToLinear();

  // Create RGB transfer function (grayscale)
  const cfun = vtkColorTransferFunction.newInstance();
  cfun.addRGBPoint(min, 0.0, 0.0, 0.0);
  cfun.addRGBPoint(max, 1.0, 1.0, 1.0);

  // Create scalar opacity function
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(min, 0.0);
  ofun.addPoint(max, 1.0);

  // Set the transfer functions on the volume actor
  property.setRGBTransferFunction(0, cfun);
  property.setScalarOpacity(0, ofun);
}

/**
 * Sets up a CT-style transfer function with window/level
 * @param volumeActor - The VTK volume actor
 * @param windowCenter - Window center for the transfer function
 * @param windowWidth - Window width for the transfer function
 */
export function setCTTransferFunction(
  volumeActor: vtkVolume,
  windowCenter: number = 40,
  windowWidth: number = 400
): void {
  const property = volumeActor.getProperty();
  property.setInterpolationTypeToLinear();

  const lower = windowCenter - windowWidth / 2.0;
  const upper = windowCenter + windowWidth / 2.0;

  // Create RGB transfer function (CT-style)
  const cfun = vtkColorTransferFunction.newInstance();
  cfun.addRGBPoint(lower, 0.0, 0.0, 0.0);
  cfun.addRGBPoint(upper, 1.0, 1.0, 1.0);

  // Create scalar opacity function
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(lower, 0.0);
  ofun.addPoint(upper, 1.0);

  // Set the transfer functions on the volume actor
  property.setRGBTransferFunction(0, cfun);
  property.setScalarOpacity(0, ofun);
}

/**
 * Sets up a PET-style transfer function with color mapping
 * @param volumeActor - The VTK volume actor
 * @param min - Minimum value for the transfer function
 * @param max - Maximum value for the transfer function
 */
export function setPETTransferFunction(
  volumeActor: vtkVolume,
  min: number = 0,
  max: number = 5
): void {
  const property = volumeActor.getProperty();
  property.setInterpolationTypeToLinear();

  // Create RGB transfer function (PET-style with color mapping)
  const cfun = vtkColorTransferFunction.newInstance();
  cfun.addRGBPoint(min, 0.0, 0.0, 0.0);
  cfun.addRGBPoint(max * 0.2, 0.0, 0.0, 1.0); // Blue
  cfun.addRGBPoint(max * 0.4, 0.0, 1.0, 0.0); // Green
  cfun.addRGBPoint(max * 0.6, 1.0, 1.0, 0.0); // Yellow
  cfun.addRGBPoint(max * 0.8, 1.0, 0.5, 0.0); // Orange
  cfun.addRGBPoint(max, 1.0, 0.0, 0.0); // Red

  // Create scalar opacity function
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(min, 0.0);
  ofun.addPoint(min + (max - min) * 0.1, 0.9);
  ofun.addPoint(max, 1.0);

  // Set the transfer functions on the volume actor
  property.setRGBTransferFunction(0, cfun);
  property.setScalarOpacity(0, ofun);
} 