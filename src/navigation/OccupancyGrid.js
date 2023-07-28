/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An OccupancyGrid can convert a ROS occupancy grid message into a THREE object.
 *
 * @constructor
 * @param options - object with following keys:
 *
 *   * message - the occupancy grid message
 *   * color (optional) - color of the visualized grid
 *   * opacity (optional) - opacity of the visualized grid (0.0 == fully transparent, 1.0 == opaque)
 */
ROS3D.OccupancyGrid = function (options) {
  options = options || {};
  var message = options.message;
  var opacity = options.opacity || 1.0;
  var color = options.color || { r: 255, g: 255, b: 255, a: 255 };

  // create the geometry
  var info = message.info;
  var origin = info.origin;
  var width = info.width;
  var height = info.height;
  var geom = new THREE.PlaneBufferGeometry(width, height, 100, 100);


  // create the color material
  var imageData = new Uint8Array(width * height * 4);
  var texture = new THREE.DataTexture(imageData, width, height, THREE.RGBAFormat);
  texture.flipY = true;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  var displacementData = new Uint8Array(width * height * 3);
  var texture_displacement = new THREE.DataTexture(displacementData, width, height, THREE.RGBFormat);
  texture_displacement.flipY = true;
  texture_displacement.minFilter = THREE.NearestFilter;
  texture_displacement.magFilter = THREE.NearestFilter;
  texture_displacement.needsUpdate = true;

  // var material = new THREE.MeshBasicMaterial({
  var material = new THREE.MeshPhongMaterial({
    map: texture,
    displacementMap: texture_displacement,
    //   displacementScale: 1.0,
    //   transparent : true,
    shininess:0.0,
    // specular: new THREE.Color( 0x000000 ),
    transparent: false,
    opacity: opacity
  });
  // material.side = THREE.DoubleSide;
  material.side = THREE.FrontSide;

  // console.log('dupa');

  // create the mesh
  THREE.Mesh.call(this, geom, material);
  // move the map so the corner is at X, Y and correct orientation (informations from message.info)

  // assign options to this for subclasses
  Object.assign(this, options);

  this.quaternion.copy(new THREE.Quaternion(
    origin.orientation.x,
    origin.orientation.y,
    origin.orientation.z,
    origin.orientation.w
  ));
  this.position.x = (width * info.resolution) / 2 + origin.position.x;
  this.position.y = (height * info.resolution) / 2 + origin.position.y;
  this.position.z = origin.position.z;
  this.scale.x = info.resolution;
  this.scale.y = info.resolution;

  var data = message.data;
  // update the texture (after the the super call and this are accessible)
  this.color = color;
  this.material = material;
  this.texture = texture;
  this.texture_displacement = texture_displacement;
  this.geom = geom;

  for (var row = 0; row < height; row++) {
    for (var col = 0; col < width; col++) {

      // determine the index into the map data
      var invRow = (height - row - 1);
      var mapI = col + (invRow * width);
      // determine the value
      var val = this.getValue(mapI, invRow, col, data);

      // determine the color
      var color = this.getColor(mapI, invRow, col, 255-(val/100)*255);
      color[3] = (100 - val)/100*255;
      // determine the index into the image data array
      var i = (col + (row * width)) * 4;
      var ii = (col + (row * width)) * 3;



      if (val >= 90 || val === -1) {
        // color = [255,255,255,255];
        color = [0,0,0,0];
      }


      if (val >= 100){
        displacementData.set([255, 255, 255], ii);
      } else {
        displacementData.set([0, 0, 0], ii);
      }

      // copy the color
      imageData.set(color, i);
    }
  }

  texture.needsUpdate = true;
  // imageData = null;
  // displacementData = null;
};

ROS3D.OccupancyGrid.prototype.dispose = function () {
  this.geom.dispose()
  this.texture.dispose();
  this.texture_displacement.dispose();
  this.material.dispose();
};

/**
 * Returns the value for a given grid cell
 * @param {int} index the current index of the cell
 * @param {int} row the row of the cell
 * @param {int} col the column of the cell
 * @param {object} data the data buffer
 */
ROS3D.OccupancyGrid.prototype.getValue = function (index, row, col, data) {
  return data[index];
};

/**
 * Returns a color value given parameters of the position in the grid; the default implementation
 * scales the default color value by the grid value. Subclasses can extend this functionality
 * (e.g. lookup a color in a color map).
 * @param {int} index the current index of the cell
 * @param {int} row the row of the cell
 * @param {int} col the column of the cell
 * @param {float} value the value of the cell
 * @returns r,g,b,a array of values from 0 to 255 representing the color values for each channel
 */
ROS3D.OccupancyGrid.prototype.getColor = function (index, row, col, value) {
  return [
    (value * this.color.r) / 255,
    (value * this.color.g) / 255,
    (value * this.color.b) / 255,
    255
  ];
};
// getColor(index, row, col, value) {
// // console.log(value)
// // value = 255 - value
//   return [
//   //   (value * this.color.r) / 255,
//   //   (value * this.color.g) / 255,
//   //   (value * this.color.b) / 255,
// //   255
// 64,90,221,
// //   value ==-1?0:255
//   value > 90?0:255
// // (value/100)*255
//   ];
// };

ROS3D.OccupancyGrid.prototype.__proto__ = THREE.Mesh.prototype;
