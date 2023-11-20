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
  this.width = info.width;
  this.height = info.height;
  var geom = new THREE.PlaneBufferGeometry(this.width, this.height, 100, 100);


  // create the color material
  this.imageData = new Uint8Array(this.width * this.height * 4);
  this.texture = new THREE.DataTexture(this.imageData, this.width, this.height, THREE.RGBAFormat);
  this.texture.flipY = true;
  this.texture.minFilter = THREE.NearestFilter;
  this.texture.magFilter = THREE.NearestFilter;
  this.texture.needsUpdate = true;

  this.displacementData = new Uint8Array(this.width * this.height * 3);
  this.texture_displacement = new THREE.DataTexture(this.displacementData, this.width, this.height, THREE.RGBFormat);
  this.texture_displacement.flipY = true;
  this.texture_displacement.minFilter = THREE.NearestFilter;
  this.texture_displacement.magFilter = THREE.NearestFilter;
  this.texture_displacement.needsUpdate = true;

  // TODO: add https://threejs.org/manual/#en/canvas-textures

  const geometry = new THREE.IcosahedronGeometry( 0.5, 3 );
  const marker_material = new THREE.MeshPhongMaterial( { color: 0xffffff } );

  let amount = 100

  let mesh = new THREE.InstancedMesh( geometry, marker_material, amount*amount );

  let i = 0;
  const offset = ( amount - 1 ) / 2;

  const matrix = new THREE.Matrix4();

  for ( let x = 0; x < amount; x ++ ) {

    for ( let y = 0; y < amount; y ++ ) {


        matrix.setPosition( offset - x, offset - y, 0 );

        mesh.setMatrixAt( i, matrix );
        mesh.setColorAt( i, color );
        i ++;

      

    }

  }


  // var material = new THREE.MeshBasicMaterial({
  var material = new THREE.MeshPhongMaterial({
    map: this.texture,
    displacementMap: this.texture_displacement,
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
  this.position.x = (this.width * info.resolution) / 2 + origin.position.x;
  this.position.y = (this.height * info.resolution) / 2 + origin.position.y;
  this.position.z = origin.position.z;
  this.scale.x = info.resolution;
  this.scale.y = info.resolution;

  var data = message.data;
  // update the texture (after the the super call and this are accessible)
  this.color = color;
  this.material = material;
  this.texture = this.texture;
  this.texture_displacement = this.texture_displacement;
  this.geom = geom;

  this.circles = [];

  this.add(mesh);
    

  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {

      // determine the index into the map data
      var invRow = (this.height - row - 1);
      var mapI = col + (invRow * this.width);
      // determine the value
      var val = this.getValue(mapI, invRow, col, data);

      // determine the color
      var color = this.getColor(mapI, invRow, col, 255-(val/100)*255);
      color[3] = (100 - val)/100*255;
      // determine the index into the image data array
      let i = (col + (row * this.width)) * 4;
      let ii = (col + (row * this.width)) * 3;



      if (val >= 100 || val === -1) {
        // color = [255,255,255,255];
        color = [0,0,0,0];
      }


      if (val >= 100){
        this.displacementData.set([255, 255, 255], ii);
      } else {
        this.displacementData.set([0, 0, 0], ii);
      }

      // copy the color
      this.imageData.set(color, i);
    }
  }

  this.texture.needsUpdate = true;
  // imageData = null;
  // displacementData = null;
};

ROS3D.OccupancyGrid.prototype.processMessage = function (message){
  let data = message.data;
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {

      // determine the index into the map data
      var invRow = (this.height - row - 1);
      var mapI = col + (invRow * this.width);
      // determine the value
      var val = this.getValue(mapI, invRow, col, data);

      // determine the color
      var color = this.getColor(mapI, invRow, col, 255-(val/100)*255);
      color[3] = (100 - val)/100*255;
      // determine the index into the image data array
      let i = (col + (row * this.width)) * 4;
      let ii = (col + (row * this.width)) * 3;



      if (val >= 100 || val === -1) {
        // color = [255,255,255,255];
        color = [0,0,0,0];
      }


      if (val >= 100){
        this.displacementData.set([255, 255, 255], ii);
      } else {
        this.displacementData.set([0, 0, 0], ii);
      }

      // copy the color
      this.imageData.set(color, i);
    }
  }

  this.texture.needsUpdate = true;
  this.texture_displacement.needsUpdate = true;
};


ROS3D.OccupancyGrid.prototype.dispose = function () {
  this.geom.dispose();
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
