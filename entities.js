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

const state = {
  user: {
    id: 1,
    lng: -71.2760,
    lat: 42.4906
  },
  strangers: [
    {
      id: 2,
      lng: -89.5890,
      lat: 40.6936
    },
    {
      id: 3,
      lng: 7.5886,
      lat: 40.6936
    }
  ]
};

class PaleBlue {
  constructor(user, strangers) {
    // remove unnecessary UI features
    // credits hidden by rendering it in a div underneath the viewer
    this.viewer = new Cesium.Viewer('cesiumContainer', {
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

    // limit max zoom
    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000;

    this.user = null;
    this.strangers = null;
    this.dots = this.viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());

    this.initialize(user, strangers);

    this.getMapCenter = this.getMapCenter.bind(this);

    // event listener triggered on camera stop
    const cameraStopEvent = this.viewer.camera.moveEnd;
    cameraStopEvent.addEventListener(this.getMapCenter);
  }

  initialize(user, strangers) {
    this.user = this.loadUser(user);
    this.strangers = this.loadStrangers(strangers);
    this.setCamera(user.lng, user.lat)
  }

  setCamera(lng, lat, height = 20000000) {
    // center camera on a specific point - provide lat/long/height
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0.0
      }
    });
  }

  loadUser(user) {
    return {
      id: user.id,
      dot: this.dots.add({
        position: Cesium.Cartesian3.fromDegrees(user.lng, user.lat),
        color: Cesium.Color.DEEPSKYBLUE
      })
    };
  }

  loadStrangers(strangers) {
    return strangers.map(stranger => {
      return {
        id: stranger.id,
        dot: this.dots.add({
          position: Cesium.Cartesian3.fromDegrees(stranger.lng, stranger.lat),
          color: Cesium.Color.GOLD
        })
      };
    });
  }

  addStranger(stranger) {
    const dot = this.dots.add({
      position: Cesium.Cartesian3.fromDegrees(stranger.lng, stranger.lat),
      color: Cesium.Color.GOLD
    });
    this.strangers.push({
      id: stranger.id,
      dot
    });
    this.pulse(stranger.lng, stranger.lat);
    setTimeout(() => {
      this.pulse(stranger.lng, stranger.lat);
    }, 500);
    setTimeout(() => {
      this.pulse(stranger.lng, stranger.lat);
    }, 1000);
  }

  pulse(lng, lat) {
    // animate expanding circle
    const duration = 4000;
    const rate = 250;

    const circle = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lng, lat),
      billboard: {
        image: './circle.svg',
        width: 20,
        height: 20,
        scale: expand(rate),
        color: fadeOut(duration)
      }
    });
    setTimeout(() => {
      this.viewer.entities.remove(circle);
    }, duration);
  }

  drawLine(startDot, endDot) {
    // render polylines - distance / velocity is render time for the line animation
    const velocity = 500;
    const duration = distanceBetween(startDot, endDot) / velocity;

    const startEntity = this.viewer.entities.add({
      position: startDot.position,
      point: {
        color: startDot.color
      }
    });
    const endEntity = this.viewer.entities.add({
      position: endDot.position,
      point: {
        color: endDot.color
      }
    });

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

  // calculate location at the center of the camera
  getMapCenter() {
    const windowPosition = new Cesium.Cartesian2(this.viewer.container.clientWidth / 2, this.viewer.container.clientHeight / 2);
    const pickRay = this.viewer.scene.camera.getPickRay(windowPosition);
    const result = {};
    const pickPosition = this.viewer.scene.globe.pick(pickRay, this.viewer.scene, result);
    if (pickPosition == undefined) {
      return null;
    }
    console.log(result);
    return result;
  }

  findDotById(id) {
    const stranger = this.strangers.find(stranger => stranger.id === id);
    return stranger.dot;
  }

  likedBy(id) {
    const strangerDot = this.findDotById(id);
    const userDot = this.user.dot;
    this.viewer.entities.add({
      polyline: {
        positions: this.drawLine(strangerDot, userDot),
        material: Cesium.Color.SALMON
      }
    });
  }
}





// executed code
const pb = new PaleBlue(state.user, state.strangers);

setTimeout(() => {
  pb.addStranger({
    id: 4,
    lng: -84.388,
    lat: 33.749
  });
}, 3000);

setTimeout(() => {
  pb.likedBy(2);
}, 5000);

setTimeout(() => {
  pb.likedBy(3);
}, 6000);

setTimeout(() => {
  pb.likedBy(4);
}, 7000);









function distanceBetween(dot1, dot2) {
  console.log('dot 1 position', dot1.position);
  return Cesium.Cartesian3.distance(dot1.position, dot2.position);
}


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

// property for circle animation expansion
function expand(rate) {
  const start = performance.now();
  return new Cesium.CallbackProperty((time, scale) => {
    if (!Cesium.defined(scale)) {
      scale = 1.0;
    }
    const now = performance.now();
    const t = now - start;
    return scale + t / rate;
  }, false);
}

// property for circle animation fade out
function fadeOut(duration) {
  const start = performance.now();
  return new Cesium.CallbackProperty((time, color) => {
    const now = performance.now();
    const t = now - start;
    let alpha = 1.0 - t / duration;
    if (alpha < 0) alpha = 0;
    return new Cesium.Color(1.0, 1.0, 1.0, alpha);
  }, false);
}
