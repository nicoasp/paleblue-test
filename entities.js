// const skyBox = new Cesium.SkyBox({
//   sources: {
//     positiveX: 'http://i2.kym-cdn.com/entries/icons/facebook/000/013/564/aP2dv.jpg',
//     negativeX: 'http://i2.kym-cdn.com/entries/icons/facebook/000/013/564/aP2dv.jpg',
//     positiveY: 'http://i2.kym-cdn.com/entries/icons/facebook/000/013/564/aP2dv.jpg',
//     negativeY: 'http://i2.kym-cdn.com/entries/icons/facebook/000/013/564/aP2dv.jpg',
//     positiveZ: 'http://i2.kym-cdn.com/entries/icons/facebook/000/013/564/aP2dv.jpg',
//     negativeZ: 'http://i2.kym-cdn.com/entries/icons/facebook/000/013/564/aP2dv.jpg'
//   }
// });


// remove unnecessary UI features
// credits hidden by rendering it in a div underneath the viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false,
  navigationInstructionsInitiallyVisible: false,
  skyAtmosphere: false,
  creditContainer: "credits"
});


// ellipse entity property
const blueDot = {
  semiMinorAxis: 50000.0,
  semiMajorAxis: 50000.0,
  material: Cesium.Color.DEEPSKYBLUE.withAlpha(0.9)
}

const yellowDot = {
  semiMinorAxis: 50000.0,
  semiMajorAxis: 50000.0,
  material: Cesium.Color.YELLOW.withAlpha(0.9)
}

// locations
const newYork = Cesium.Cartesian3.fromDegrees(-74.059, 40.7128);
const peoria = Cesium.Cartesian3.fromDegrees(-89.5890, 40.6936);
const basel = Cesium.Cartesian3.fromDegrees(7.5886, 47.5596);

// entities
const home = viewer.entities.add({
  position: newYork,
  name: 'home',
  ellipse: blueDot
});

const mark = viewer.entities.add({
  position: peoria,
  name: 'mark',
  ellipse: yellowDot
});

const nicolas = viewer.entities.add({
  position: basel,
  name: 'nicolas',
  ellipse: yellowDot
})

// center camera on a specific point - provide lat/long/height
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-74.059, 40.7128, 20000000),
  orientation: {
    heading: 0.0,
    pitch: -Cesium.Math.PI_OVER_TWO,
    roll: 0.0
  }
});

// spherical interpolation to prevent line from moving when globe is rotated
function Slerp(start, end, t, result) {
  const result1 = new Cesium.Cartesian3();
  const result2 = new Cesium.Cartesian3();
  const result3 = new Cesium.Cartesian3();
  const theta = Cesium.Cartesian3.angleBetween(start, end);
  Cesium.Cartesian3.multiplyByScalar(start, Math.sin((1-t)*theta), result1);
  Cesium.Cartesian3.multiplyByScalar(end, Math.sin(t*theta), result2);
  Cesium.Cartesian3.add(result1, result2, result3);
  Cesium.Cartesian3.divideByScalar(result3, Math.sin(theta), result);

  return result;
}

function drawLine(startEntity, endEntity, duration) {
  const startTime = performance.now();
  return new Cesium.CallbackProperty((time, result) => {
    if (!Cesium.defined(result)) {
      result = [];
    }
    const now = performance.now();
    const start = startEntity.position.getValue(time, result[0]);
    const end = endEntity.position.getValue(time, result[1]);
    const t = Math.min(1.0, (now - startTime) / duration);
    Slerp(start, end, t, end);

    result[0] = start;
    result[1] = end;
    result.length = 2;
    return result;

  }, false);
}

// calculating distance between two entities
const distanceToNico = Cesium.Cartesian3.distance(nicolas.position.getValue(), home.position.getValue());
const distanceToMark = Cesium.Cartesian3.distance(mark.position.getValue(), home.position.getValue());
console.log(distanceToNico);
console.log(distanceToMark);

const velocity = 1000;

// distance / velocity is render time for the line animation
viewer.entities.add({
  polyline: {
    positions: drawLine(nicolas, home, distanceToNico / velocity)
  }
});

viewer.entities.add({
  polyline: {
    positions: drawLine(mark, home, distanceToMark / velocity)
  }
})
