import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("cad-file");
const dropzone = document.getElementById("dropzone");
const chooseFileButton = document.getElementById("choose-file");
const selectedFileName = document.getElementById("selected-file-name");
const submitButton = document.getElementById("submit-button");
const statusText = document.getElementById("status-text");
const capabilityStatus = document.getElementById("capability-status");
const capabilityMessage = document.getElementById("capability-message");
const resultEmpty = document.getElementById("result-empty");
const resultView = document.getElementById("result-view");
const resultFilename = document.getElementById("result-filename");
const resultMeta = document.getElementById("result-meta");
const resultPill = document.getElementById("result-pill");
const artifactLinks = document.getElementById("artifact-links");
const warningList = document.getElementById("warning-list");
const entityCount = document.getElementById("entity-count");
const layerCount = document.getElementById("layer-count");
const ifcCount = document.getElementById("ifc-count");
const skippedCount = document.getElementById("skipped-count");
const classCounts = document.getElementById("class-counts");
const viewerCanvas = document.getElementById("viewer-canvas");
const viewerEmpty = document.getElementById("viewer-empty");
const viewerLoading = document.getElementById("viewer-loading");
const viewerMeta = document.getElementById("viewer-meta");
const resetCameraButton = document.getElementById("reset-camera");
const wireframeButton = document.getElementById("toggle-wireframe");
const odaDownloadCta = document.getElementById("oda-download-cta");
const odaDownloadBtn = document.getElementById("oda-download-btn");
const odaInstalledBtn = document.getElementById("oda-installed-btn");
const dxfToDwgSection = document.getElementById("dxf-to-dwg-section");
const dxfToDwgCta = document.getElementById("dxf-to-dwg-cta");
const dxfToDwgNoOda = document.getElementById("dxf-to-dwg-no-oda");
const dxfToDwgForm = document.getElementById("dxf-to-dwg-form");
const dxfToDwgFileInput = document.getElementById("dxf-to-dwg-file");
const dxfToDwgFilename = document.getElementById("dxf-to-dwg-filename");
const dxfToDwgSubmit = document.getElementById("dxf-to-dwg-submit");
const dxfToDwgResult = document.getElementById("dxf-to-dwg-result");
const dxfToDwgMessage = document.getElementById("dxf-to-dwg-message");
const dxfToDwgDownload = document.getElementById("dxf-to-dwg-download");
const dxfToDwgOdaBtn = document.getElementById("dxf-to-dwg-oda-btn");

const ODA_DOWNLOAD_URL_FALLBACK = "https://www.opendesign.com/guestfiles/oda_file_converter";
let lastCapabilities = null;

const viewerState = {
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  modelRoot: null,
  animationFrame: null,
  resizeObserver: null,
  currentBounds: null,
  wireframe: false,
};

function setStatus(message) {
  statusText.textContent = message;
}

async function loadCapabilities() {
  const response = await fetch("/api/capabilities");
  const capabilities = await response.json();
  lastCapabilities = capabilities;
  capabilityStatus.textContent = capabilities.dwg_enabled ? "DWG Ready" : "DXF Only";
  capabilityMessage.textContent = `${capabilities.dwg_message} Max upload: ${capabilities.max_upload_mb}MB.`;
  if (odaDownloadCta) {
    if (capabilities.dwg_enabled) {
      odaDownloadCta.classList.add("hidden");
    } else {
      odaDownloadCta.classList.remove("hidden");
    }
  }
  if (dxfToDwgCta && dxfToDwgNoOda) {
    if (capabilities.dwg_enabled) {
      dxfToDwgCta.classList.remove("hidden");
      dxfToDwgNoOda.classList.add("hidden");
    } else {
      dxfToDwgCta.classList.add("hidden");
      dxfToDwgNoOda.classList.remove("hidden");
    }
  }
}

function pickFile(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  selectedFileName.textContent = file.name;
  setStatus(`Selected ${file.name}`);
}

function renderClassCounts(classCountMap) {
  classCounts.innerHTML = "";
  Object.entries(classCountMap).forEach(([name, value]) => {
    const pill = document.createElement("span");
    pill.className = "class-pill";
    pill.textContent = `${name} · ${value}`;
    classCounts.appendChild(pill);
  });
}

function renderWarnings(warnings) {
  warningList.innerHTML = "";
  warnings.forEach((warning) => {
    const item = document.createElement("p");
    item.textContent = warning;
    warningList.appendChild(item);
  });
}

function renderArtifacts(artifacts) {
  artifactLinks.innerHTML = "";
  Object.entries(artifacts).forEach(([name, artifact]) => {
    const link = document.createElement("a");
    link.href = artifact.download_url;
    link.textContent = `Download ${name.toUpperCase()} · ${artifact.filename}`;
    artifactLinks.appendChild(link);
  });
}

function renderResult(payload) {
  resultEmpty.classList.add("hidden");
  resultView.classList.remove("hidden");

  resultFilename.textContent = payload.original_filename;
  resultMeta.textContent = `${payload.input_format.toUpperCase()} -> ${payload.normalized_source} · ${payload.summary.units}`;
  resultPill.textContent = payload.status;
  entityCount.textContent = payload.summary.entity_count;
  layerCount.textContent = payload.summary.layer_count;
  ifcCount.textContent = payload.ifc.element_count;
  skippedCount.textContent = payload.ifc.skipped_entities;

  renderArtifacts(payload.artifacts);
  renderWarnings(payload.warnings || []);
  renderClassCounts(payload.ifc.class_counts || {});
}

function ensureViewer() {
  if (viewerState.renderer) {
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas: viewerCanvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
  const controls = new OrbitControls(camera, viewerCanvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  scene.add(new THREE.AmbientLight(0xffffff, 1.35));

  const keyLight = new THREE.DirectionalLight(0xfff3dd, 2.0);
  keyLight.position.set(12, 18, 10);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xa7d4ff, 0.85);
  fillLight.position.set(-12, 10, -10);
  scene.add(fillLight);

  const grid = new THREE.GridHelper(120, 40, 0x4c5a74, 0x263447);
  grid.position.y = -0.001;
  scene.add(grid);

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  viewerState.renderer = renderer;
  viewerState.scene = scene;
  viewerState.camera = camera;
  viewerState.controls = controls;
  viewerState.modelRoot = modelRoot;

  const resize = () => {
    const { clientWidth, clientHeight } = viewerCanvas.parentElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  viewerState.resizeObserver = new ResizeObserver(resize);
  viewerState.resizeObserver.observe(viewerCanvas.parentElement);
  resize();

  const animate = () => {
    viewerState.animationFrame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
}

function clearViewerModel() {
  if (!viewerState.modelRoot) {
    return;
  }
  for (const child of [...viewerState.modelRoot.children]) {
    viewerState.modelRoot.remove(child);
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else if (child.material) {
      child.material.dispose();
    }
  }
  viewerState.currentBounds = null;
}

function buildGeometry(meshItem) {
  const positions = [];
  const indices = [];

  meshItem.vertices.forEach((vertex) => {
    positions.push(vertex[0], vertex[2], -vertex[1]);
  });

  meshItem.faces.forEach((face) => {
    if (face.length < 3) {
      return;
    }
    for (let index = 1; index < face.length - 1; index += 1) {
      indices.push(face[0], face[index], face[index + 1]);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function applyWireframeState() {
  if (!viewerState.modelRoot) {
    return;
  }
  viewerState.modelRoot.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.wireframe = viewerState.wireframe;
    }
  });
  wireframeButton.textContent = viewerState.wireframe ? "Solid" : "Wireframe";
}

function frameScene(bounds) {
  if (!bounds || !viewerState.camera || !viewerState.controls) {
    return;
  }

  const min = new THREE.Vector3(bounds.min.x, bounds.min.z, -bounds.max.y);
  const max = new THREE.Vector3(bounds.max.x, bounds.max.z, -bounds.min.y);
  const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const size = new THREE.Vector3().subVectors(max, min);
  const radius = Math.max(size.length() * 0.65, 2.5);

  viewerState.camera.position.set(center.x + radius, center.y + radius * 0.8, center.z + radius);
  viewerState.camera.near = Math.max(radius / 100, 0.01);
  viewerState.camera.far = radius * 20;
  viewerState.camera.updateProjectionMatrix();

  viewerState.controls.target.copy(center);
  viewerState.controls.update();
}

function renderViewerScene(payload) {
  payload.elements.forEach((element) => {
    element.mesh_items.forEach((meshItem) => {
      const geometry = buildGeometry(meshItem);
      const material = new THREE.MeshStandardMaterial({
        color: element.color,
        roughness: 0.78,
        metalness: 0.08,
        transparent: true,
        opacity: 0.96,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = {
        name: element.name,
        ifcClass: element.ifc_class,
        layer: element.layer,
      };
      viewerState.modelRoot.add(mesh);
    });
  });

  viewerState.currentBounds = payload.bounds;
  frameScene(payload.bounds);
  applyWireframeState();
  viewerMeta.textContent = `${payload.element_count} IFC elements are visible in-browser. Drag to orbit, scroll to zoom.`;
}

async function loadViewer(viewerUrl, inlineScene = null) {
  ensureViewer();
  clearViewerModel();

  viewerEmpty.classList.add("hidden");
  viewerLoading.classList.remove("hidden");
  viewerMeta.textContent = "Fetching viewer geometry...";

  try {
    if (inlineScene) {
      renderViewerScene(inlineScene);
      return;
    }

    const response = await fetch(viewerUrl);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Viewer data could not be loaded.");
    }
    renderViewerScene(payload);
  } catch (error) {
    viewerEmpty.classList.remove("hidden");
    viewerEmpty.innerHTML = `
      <p class="viewer-label">Viewer unavailable</p>
      <h3>Scene generation did not complete.</h3>
      <p>${error.message}</p>
    `;
  } finally {
    viewerLoading.classList.add("hidden");
  }
}

async function submitCurrentFile(event) {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    setStatus("Choose a DWG or DXF file first.");
    return;
  }
  if (
    lastCapabilities &&
    !lastCapabilities.dwg_enabled &&
    file.name.toLowerCase().endsWith(".dwg")
  ) {
    setStatus("当前环境不支持 DWG，请先安装 ODA File Converter 或改为上传 DXF。");
    if (odaDownloadCta) {
      odaDownloadCta.classList.remove("hidden");
      odaDownloadCta.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    return;
  }

  submitButton.disabled = true;
  setStatus("Uploading file and generating IFC + live scene...");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || "Conversion failed.");
    }

    renderResult(payload);
    await loadViewer(payload.viewer.data_url, payload.viewer.scene || null);
    setStatus("Conversion finished. The model is now live in the viewer.");
  } catch (error) {
    setStatus(error.message);
  } finally {
    submitButton.disabled = false;
  }
}

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
});

dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) {
    pickFile(file);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) {
    selectedFileName.textContent = fileInput.files[0].name;
    setStatus(`Selected ${fileInput.files[0].name}`);
  }
});

chooseFileButton.addEventListener("click", () => {
  fileInput.click();
});

resetCameraButton.addEventListener("click", () => {
  frameScene(viewerState.currentBounds);
});

wireframeButton.addEventListener("click", () => {
  viewerState.wireframe = !viewerState.wireframe;
  applyWireframeState();
});

form.addEventListener("submit", submitCurrentFile);

if (odaDownloadBtn) {
  odaDownloadBtn.addEventListener("click", () => {
    const url = lastCapabilities?.oda_download_url || ODA_DOWNLOAD_URL_FALLBACK;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}
if (odaInstalledBtn) {
  odaInstalledBtn.addEventListener("click", () => {
    odaInstalledBtn.disabled = true;
    loadCapabilities()
      .then(() => {
        if (lastCapabilities?.dwg_enabled) {
          setStatus("DWG 转换已可用，可以上传 DWG 进行 BIM 化。");
        }
      })
      .finally(() => {
        odaInstalledBtn.disabled = false;
      });
  });
}

if (dxfToDwgFileInput) {
  dxfToDwgFileInput.addEventListener("change", () => {
    const file = dxfToDwgFileInput.files[0];
    if (dxfToDwgFilename) dxfToDwgFilename.textContent = file ? file.name : "未选择文件";
    if (dxfToDwgSubmit) dxfToDwgSubmit.disabled = !file;
    if (dxfToDwgResult) dxfToDwgResult.classList.add("hidden");
  });
}

if (dxfToDwgForm) {
  dxfToDwgForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = dxfToDwgFileInput?.files[0];
    if (!file) return;
    dxfToDwgSubmit.disabled = true;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/convert-dxf-to-dwg", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "转换失败");
      if (dxfToDwgMessage) dxfToDwgMessage.textContent = `已转换：${payload.filename}`;
      if (dxfToDwgDownload) {
        const url = payload.download_url + (payload.filename ? "?filename=" + encodeURIComponent(payload.filename) : "");
        dxfToDwgDownload.href = url;
        dxfToDwgDownload.download = payload.filename || "output.dwg";
        dxfToDwgDownload.classList.remove("hidden");
      }
      if (dxfToDwgResult) dxfToDwgResult.classList.remove("hidden");
    } catch (err) {
      if (dxfToDwgMessage) dxfToDwgMessage.textContent = err.message;
      if (dxfToDwgResult) dxfToDwgResult.classList.remove("hidden");
      if (dxfToDwgDownload) dxfToDwgDownload.classList.add("hidden");
    } finally {
      dxfToDwgSubmit.disabled = false;
    }
  });
}

if (dxfToDwgOdaBtn) {
  dxfToDwgOdaBtn.addEventListener("click", () => {
    const url = lastCapabilities?.oda_download_url || ODA_DOWNLOAD_URL_FALLBACK;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

loadCapabilities().catch(() => {
  capabilityStatus.textContent = "Unavailable";
  capabilityMessage.textContent = "Runtime capability detection failed, but you can still try a conversion.";
});
