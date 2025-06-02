import * as THREE from "three";

export function setupRenderer(pixelated: boolean) {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);

  if (pixelated) {
    renderer.domElement.style.imageRendering = "pixelated";
  } else {
    renderer.domElement.style.imageRendering = "";
  }

  // setup render target and screen quad if pixelated
  let renderTarget: THREE.WebGLRenderTarget | undefined;
  let screenScene: THREE.Scene | undefined;
  let screenCamera: THREE.OrthographicCamera | undefined;
  let screenMaterial: THREE.MeshBasicMaterial | undefined;
  let screenQuad: THREE.Mesh | undefined;

  if (pixelated) {
    const pixelWidth = 256;
    const pixelHeight = 256;

    renderTarget = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
    });

    screenScene = new THREE.Scene();
    screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    screenMaterial = new THREE.MeshBasicMaterial({
      map: renderTarget.texture,
    });

    screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMaterial);
    screenScene.add(screenQuad);
  }

  return {
    renderer,
    renderTarget,
    screenScene,
    screenCamera,
  };
}
