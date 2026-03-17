import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const I18N = {
  en: {
    mastheadBrand: "CAD2BIM Studio",
    eyebrowRuntime: "Runtime",
    eyebrowInput: "Input",
    eyebrowOutput: "Output Brief",
    eyebrowViewer: "Live Viewer",
    eyebrowBreakdown: "Mapping Breakdown",
    mastheadTitle: "From DXF to live IFC.",
    mastheadLead:
      "Upload a single DXF, map layers to IFC, export, and review the 3D massing in your browser.",
    runtimeChecking: "Checking runtime",
    runtimeMessage: "DXF only. Inspecting conversion tools and upload limits.",
    inputTitle: "Upload a DXF and generate the model.",
    dropzoneTitle: "DXF upload",
    dropzoneSubtitle:
      "Drag a DXF here or choose from disk. IFC stays downloadable and the scene opens in the viewer.",
    chooseFile: "Choose File",
    noFileSelected: "No file selected",
    generateModel: "Generate Model",
    statusWaiting: "Waiting for a DXF file.",
    outputEmptyTitle: "No model yet",
    outputEmptyCopy:
      "After conversion, this rail shows the summary, warnings, and IFC downloads while the 3D scene opens on the right.",
    entities: "Entities",
    layers: "Layers",
    ifcElements: "IFC Elements",
    skipped: "Skipped",
    viewerTitle: "Live 3D viewer",
    resetCamera: "Reset Camera",
    wireframe: "Wireframe",
    solid: "Solid",
    sceneIdle: "Scene idle",
    viewerEmptyTitle: "Your model will appear here.",
    viewerEmptyCopy:
      "Orbit, pan, and zoom once the scene is ready. No extra BIM viewer required.",
    buildingScene: "Building scene...",
    viewerMetaDefault:
      "This view is rendered from the same massing data used to author the IFC file.",
    breakdownTitle: "IFC class distribution",
    statusSelected: "Selected {name}",
    statusChooseFirst: "Choose a DXF file first.",
    statusUploading: "Uploading DXF and building IFC + scene...",
    statusDone: "Conversion finished. The model is live in the viewer.",
    conversionFailed: "Conversion failed.",
    capabilityUnavailable: "Unavailable",
    capabilityDetectFailed:
      "Runtime capability detection failed, but you can still try a conversion.",
    viewerUnavailable: "Viewer unavailable",
    sceneFailed: "Scene generation did not complete.",
    fetchingGeometry: "Fetching viewer geometry...",
    elementsVisible: "{count} IFC elements in view. Drag to orbit, scroll to zoom.",
    selectionEyebrow: "Selection",
    selectionEmptyTitle: "Click a 3D element to inspect its DXF data.",
    selectionLength: "Length",
    selectionText: "Text",
    selectionLayer: "Layer",
    selectionClass: "IFC Class",
    downloadArtifact: "Download {name} · {filename}",
    converted: "Converted: {filename}",
    maxUpload: "Max upload",
  },
  ja: {
    mastheadBrand: "CAD2BIM Studio",
    eyebrowRuntime: "ランタイム",
    eyebrowInput: "入力",
    eyebrowOutput: "出力概要",
    eyebrowViewer: "ライブビューア",
    eyebrowBreakdown: "マッピング内訳",
    mastheadTitle: "DXF から IFC シーンへ。",
    mastheadLead:
      "DXF を 1 つアップロードしてレイヤーを IFC に割り当て、IFC を出力し、ブラウザで 3D マッシングを確認します。",
    runtimeChecking: "ランタイム確認中",
    runtimeMessage: "DXF 専用です。変換ツールとアップロード上限を確認しています。",
    inputTitle: "DXF をアップロードしてモデルを生成",
    dropzoneTitle: "DXF アップロード",
    dropzoneSubtitle:
      "ここに DXF をドラッグするか、ディスクから 1 つ選択。IFC はダウンロードでき、3D シーンはブラウザで確認できます。",
    chooseFile: "ファイルを選択",
    noFileSelected: "ファイル未選択",
    generateModel: "モデルを生成",
    statusWaiting: "DXF 図面ファイルを待機中です。",
    outputEmptyTitle: "まだモデルがありません",
    outputEmptyCopy:
      "変換が完了すると、ここに概要・警告・IFC ダウンロードリンクが並び、右側に 3D シーンが開きます。",
    entities: "エンティティ",
    layers: "レイヤー",
    ifcElements: "IFC 要素",
    skipped: "スキップ",
    viewerTitle: "ライブ 3D ビューア",
    resetCamera: "カメラリセット",
    wireframe: "ワイヤー",
    solid: "ソリッド",
    sceneIdle: "シーン待機中",
    viewerEmptyTitle: "生成したモデルがここに表示されます。",
    viewerEmptyCopy:
      "シーン生成後にオービット・パン・ズームで操作できます。別途 BIM ビューアは不要です。",
    buildingScene: "シーン構築中...",
    viewerMetaDefault: "このビューは IFC ファイルと同じマッシングデータから生成されています。",
    breakdownTitle: "IFC クラス内訳",
    statusSelected: "選択: {name}",
    statusChooseFirst: "先に DXF ファイルを選択してください。",
    statusUploading: "アップロード中。IFC とライブシーンを構築しています...",
    statusDone: "変換が完了しました。ビューアでモデルを確認できます。",
    conversionFailed: "変換に失敗しました。",
    capabilityUnavailable: "利用不可",
    capabilityDetectFailed:
      "ランタイムの検出に失敗しましたが、変換は引き続き試せます。",
    viewerUnavailable: "ビューア利用不可",
    sceneFailed: "シーン生成が完了しませんでした。",
    fetchingGeometry: "ビューアジオメトリ取得中...",
    elementsVisible:
      "ブラウザに {count} 個の IFC 要素を表示中。ドラッグで回転・スクロールでズーム。",
    selectionEyebrow: "選択中の要素",
    selectionEmptyTitle: "3D 要素をクリックすると DXF 情報を表示します。",
    selectionLength: "長さ",
    selectionText: "テキスト",
    selectionLayer: "レイヤー",
    selectionClass: "IFC クラス",
    downloadArtifact: "ダウンロード {name} · {filename}",
    converted: "変換済み: {filename}",
    maxUpload: "最大アップロード",
  },
};

const LANG_STORAGE_KEY = "cad2bim-lang";

function getPreferredLang() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "ja" || stored === "en") return stored;
  const browser = navigator.language || navigator.userLanguage || "";
  return browser.startsWith("ja") ? "ja" : "en";
}

let currentLang = getPreferredLang();

function t(key, subs = {}) {
  const s = I18N[currentLang][key] ?? I18N.en[key] ?? key;
  return Object.keys(subs).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), subs[k]), s);
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = I18N[currentLang]?.[key] ?? I18N.en[key];
    if (text != null) el.textContent = text;
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const spec = el.getAttribute("data-i18n-attr");
    const [attr, key] = spec.split(":");
    const text = I18N[currentLang]?.[key] ?? I18N.en[key];
    if (attr && text != null) el.setAttribute(attr, text);
  });
}

applyI18n();

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
const selectionPanel = document.getElementById("selection-panel");
const selectionTitle = document.getElementById("selection-title");
const selectionMeta = document.getElementById("selection-meta");
const selectionExtra = document.getElementById("selection-extra");
const selectionViewerCanvas = document.getElementById("selection-viewer-canvas");
const resetCameraButton = document.getElementById("reset-camera");
const wireframeButton = document.getElementById("toggle-wireframe");
const layerFilterBar = document.getElementById("layer-filter-bar");
const odaDownloadCta = null;
const odaDownloadBtn = null;
const odaInstalledBtn = null;
const dxfToDwgSection = null;
const dxfToDwgCta = null;
const dxfToDwgNoOda = null;
const dxfToDwgForm = null;
const dxfToDwgFileInput = null;
const dxfToDwgFilename = null;
const dxfToDwgSubmit = null;
const dxfToDwgResult = null;
const dxfToDwgMessage = null;
const dxfToDwgDownload = null;
const dxfToDwgOdaBtn = null;

const ODA_DOWNLOAD_URL_FALLBACK = "";
let lastCapabilities = null;
let dwg2dxfModulePromise = null;

// DWG is disabled in this deployment; browser DWG→DXF is no longer used.

const viewerState = {
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  modelRoot: null,
  highlightRoot: null,
  animationFrame: null,
  resizeObserver: null,
  currentBounds: null,
  wireframe: false,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  layers: new Set(),
  activeLayer: null,
};

const selectionViewerState = {
  renderer: null,
  scene: null,
  camera: null,
  modelRoot: null,
  resizeObserver: null,
};

function setStatus(message) {
  statusText.textContent = message;
}

async function loadCapabilities() {
  const response = await fetch("/api/capabilities");
  const capabilities = await response.json();
  lastCapabilities = capabilities;
  capabilityStatus.textContent = t("dxfOnly");
  capabilityMessage.textContent = `${capabilities.dwg_message} ${t("maxUpload")}: ${capabilities.max_upload_mb}MB.`;
}

function pickFile(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  selectedFileName.textContent = file.name;
  setStatus(t("statusSelected", { name: file.name }));
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
    link.textContent = t("downloadArtifact", { name: name.toUpperCase(), filename: artifact.filename });
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
  viewerState.highlightRoot = new THREE.Group();
  scene.add(viewerState.highlightRoot);

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
  if (viewerState.highlightRoot) {
    for (const child of [...viewerState.highlightRoot.children]) {
      viewerState.highlightRoot.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose && m.dispose());
      } else if (child.material && child.material.dispose) {
        child.material.dispose();
      }
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
  wireframeButton.textContent = viewerState.wireframe ? t("solid") : t("wireframe");
}

function applyLayerFilter() {
  if (!viewerState.modelRoot) return;
  const active = viewerState.activeLayer;
  viewerState.modelRoot.children.forEach((child) => {
    if (!child.userData || active == null) {
      child.visible = true;
    } else {
      child.visible = child.userData.layer === active;
    }
  });
}
function buildLayerFilters() {
  if (!layerFilterBar) return;
  layerFilterBar.innerHTML = "";
  const layers = Array.from(viewerState.layers || []);
  if (!layers.length) return;

  const makeChip = (label, value) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "layer-chip";
    chip.textContent = label;
    chip.dataset.layerValue = value == null ? "" : String(value);
    if ((value == null && viewerState.activeLayer == null) || value === viewerState.activeLayer) {
      chip.classList.add("is-active");
    }
    chip.addEventListener("click", () => {
      viewerState.activeLayer = value;
      layerFilterBar.querySelectorAll(".layer-chip").forEach((el) => {
        el.classList.toggle("is-active", el === chip);
      });
      applyLayerFilter();
      // Clear selection/highlight if current selection is not visible anymore.
      updateSelectionPanel(null);
      updateViewerHighlight([]);
    });
    return chip;
  };

  layerFilterBar.appendChild(makeChip("All", null));
  layers
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach((layerName) => {
      layerFilterBar.appendChild(makeChip(layerName, layerName));
    });
}

function updateSelectionPanel(info) {
  if (!selectionPanel || !selectionTitle || !selectionMeta || !selectionExtra) return;
  if (!info) {
    selectionPanel.classList.add("hidden");
    selectionTitle.textContent = t("selectionEmptyTitle");
    selectionMeta.innerHTML = "";
    selectionExtra.innerHTML = "";
    updateSelectionViewer(null);
    return;
  }
  const title = info.name || info.ifcClass || "";
  selectionTitle.textContent = title || t("selectionEmptyTitle");
  const metaItems = [];
  if (info.ifcClass) metaItems.push(`<li><strong>${t("selectionClass")}:</strong> ${info.ifcClass}</li>`);
  if (info.layer) metaItems.push(`<li><strong>${t("selectionLayer")}:</strong> ${info.layer}</li>`);
  selectionMeta.innerHTML = metaItems.length ? `<ul>${metaItems.join("")}</ul>` : "";
  const extraItems = [];
  if (typeof info.length === "number" && info.length > 0) {
    extraItems.push(
      `<li><strong>${t("selectionLength")}:</strong> ${info.length.toFixed(3)} m</li>`,
    );
  }
  if (info.text) {
    extraItems.push(`<li><strong>${t("selectionText")}:</strong> ${info.text}</li>`);
  }
  selectionExtra.innerHTML = extraItems.length ? `<ul>${extraItems.join("")}</ul>` : "";
  selectionPanel.classList.remove("hidden");
}

function ensureSelectionViewer() {
  if (selectionViewerState.renderer || !selectionViewerCanvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas: selectionViewerCanvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(8, 10, 6);
  scene.add(keyLight);

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  selectionViewerState.renderer = renderer;
  selectionViewerState.scene = scene;
  selectionViewerState.camera = camera;
  selectionViewerState.modelRoot = modelRoot;

  const resize = () => {
    const { clientWidth, clientHeight } = selectionViewerCanvas.parentElement;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  selectionViewerState.resizeObserver = new ResizeObserver(resize);
  selectionViewerState.resizeObserver.observe(selectionViewerCanvas.parentElement);
  resize();

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();
}

function clearSelectionViewerModel() {
  const root = selectionViewerState.modelRoot;
  if (!root) return;
  for (const child of [...root.children]) {
    root.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((m) => m.dispose && m.dispose());
    } else if (child.material && child.material.dispose) {
      child.material.dispose();
    }
  }
}

function updateSelectionViewer(sourceMesh) {
  ensureSelectionViewer();
  clearSelectionViewerModel();
  if (!sourceMesh || !selectionViewerState.modelRoot || !selectionViewerState.camera) return;

  const geometry = sourceMesh.geometry.clone();
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (!bbox) return;

  const center = new THREE.Vector3().addVectors(bbox.min, bbox.max).multiplyScalar(0.5);
  geometry.translate(-center.x, -center.y, -center.z);

  const material = new THREE.MeshStandardMaterial({
    color: 0xff6688,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95,
  });
  const previewMesh = new THREE.Mesh(geometry, material);
  selectionViewerState.modelRoot.add(previewMesh);

  // Draw a line along the longest axis as a visual cue for length.
  const size = new THREE.Vector3().subVectors(bbox.max, bbox.min);
  let dir = new THREE.Vector3(1, 0, 0);
  if (size.y >= size.x && size.y >= size.z) dir.set(0, 1, 0);
  else if (size.z >= size.x && size.z >= size.y) dir.set(0, 0, 1);
  const half = Math.max(size.x, size.y, size.z) / 2 || 1;
  const p1 = dir.clone().multiplyScalar(-half);
  const p2 = dir.clone().multiplyScalar(half);
  const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const line = new THREE.Line(lineGeom, lineMat);
  selectionViewerState.modelRoot.add(line);

  const radius = half * 2.5 || 2.5;
  const camera = selectionViewerState.camera;
  camera.position.set(radius, radius, radius);
  camera.near = Math.max(radius / 100, 0.01);
  camera.far = radius * 20;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

function handleViewerClick(event) {
  if (!viewerState.camera || !viewerState.modelRoot) return;
  const rect = viewerCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  viewerState.pointer.set(x, y);
  viewerState.raycaster.setFromCamera(viewerState.pointer, viewerState.camera);
  const intersects = viewerState.raycaster.intersectObjects(viewerState.modelRoot.children, true);
  if (!intersects.length) {
    updateSelectionPanel(null);
    if (viewerState.highlightRoot) {
      for (const child of [...viewerState.highlightRoot.children]) {
        viewerState.highlightRoot.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose && m.dispose());
        } else if (child.material && child.material.dispose) {
          child.material.dispose();
        }
      }
    }
    return;
  }

  const hit = intersects[0].object;
  const elementId = hit.userData?.elementId;
  let meshesForElement;
  if (viewerState.activeLayer != null) {
    // When a layer filter is active, only highlight the exact mesh that was clicked.
    meshesForElement = [hit];
  } else {
    meshesForElement =
      elementId == null
        ? [hit]
        : viewerState.modelRoot.children.filter(
            (child) =>
              child.visible &&
              child.userData &&
              child.userData.elementId === elementId,
          );
  }
  const primaryMesh = meshesForElement[0] || hit;

  updateSelectionPanel(primaryMesh.userData || null);
  updateSelectionViewer(primaryMesh);
  updateViewerHighlight(meshesForElement);
}

function updateViewerHighlight(meshes) {
  const root = viewerState.highlightRoot;
  if (!root || !viewerState.scene) return;
  for (const child of [...root.children]) {
    root.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((m) => m.dispose && m.dispose());
    } else if (child.material && child.material.dispose) {
      child.material.dispose();
    }
  }
  const list = Array.isArray(meshes) ? meshes.filter(Boolean) : meshes ? [meshes] : [];
  if (!list.length) {
    return;
  }
  list.forEach((sourceMesh) => {
    if (!sourceMesh || !sourceMesh.geometry) return;
    const geom = sourceMesh.geometry.clone();
    const highlightMat = new THREE.MeshStandardMaterial({
      color: 0xffcc55,
      emissive: 0xffcc55,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const highlightMesh = new THREE.Mesh(geom, highlightMat);
    highlightMesh.applyMatrix4(sourceMesh.matrixWorld);
    root.add(highlightMesh);
  });
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
  viewerState.layers = new Set();
  viewerState.meshRegistry = [];
  payload.elements.forEach((element, elementIndex) => {
    if (element.layer) {
      viewerState.layers.add(element.layer);
    }
    element.mesh_items.forEach((meshItem) => {
      const geometry = buildGeometry(meshItem);
      const material = new THREE.MeshStandardMaterial({
        color: element.color,
        roughness: 0.78,
        metalness: 0.08,
        transparent: false,
        opacity: 1.0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = {
        name: element.name,
        ifcClass: element.ifc_class,
        layer: element.layer,
        length: element.length_m,
        text: element.text_content,
        entityType: element.entity_type,
        blockName: element.block_name,
        elementId: elementIndex,
      };
      viewerState.modelRoot.add(mesh);
    });
  });

  viewerState.currentBounds = payload.bounds;
  frameScene(payload.bounds);
  applyWireframeState();
  viewerState.activeLayer = null;
  buildLayerFilters();
  applyLayerFilter();
  viewerMeta.textContent = t("elementsVisible", { count: payload.element_count });
}

async function loadViewer(viewerUrl, inlineScene = null) {
  ensureViewer();
  clearViewerModel();

  viewerEmpty.classList.add("hidden");
  viewerLoading.classList.remove("hidden");
  viewerMeta.textContent = t("fetchingGeometry");

  try {
    if (inlineScene) {
      renderViewerScene(inlineScene);
      return;
    }

    const response = await fetch(viewerUrl);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || t("sceneFailed"));
    }
    renderViewerScene(payload);
  } catch (error) {
    viewerEmpty.classList.remove("hidden");
    viewerEmpty.innerHTML = `
      <p class="viewer-label">${t("viewerUnavailable")}</p>
      <h3>${t("sceneFailed")}</h3>
      <p>${error.message}</p>
    `;
  } finally {
    viewerLoading.classList.add("hidden");
  }
}

async function submitCurrentFile(event) {
  event.preventDefault();
  let file = fileInput.files[0];
  if (!file) {
    setStatus(t("statusChooseFirst"));
    return;
  }

  submitButton.disabled = true;

  setStatus(t("statusUploading"));

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || t("conversionFailed"));
    }

    renderResult(payload);
    await loadViewer(payload.viewer.data_url, payload.viewer.scene || null);
    setStatus(t("statusDone"));
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
    setStatus(t("statusSelected", { name: fileInput.files[0].name }));
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

viewerCanvas.addEventListener("click", handleViewerClick);

form.addEventListener("submit", submitCurrentFile);

// DXF-only: DXF→DWG and ODA download controls are no longer wired.

function refreshLangDependentUI() {
  if (lastCapabilities) {
    capabilityStatus.textContent = t("dxfOnly");
    capabilityMessage.textContent = `${lastCapabilities.dwg_message} ${t("maxUpload")}: ${lastCapabilities.max_upload_mb}MB.`;
  }
  if (viewerState.modelRoot) applyWireframeState();
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
    btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === currentLang);
  });
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === currentLang);
  btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    if (lang === "en" || lang === "ja") {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      currentLang = lang;
      applyI18n();
      refreshLangDependentUI();
    }
  });
});

loadCapabilities().catch(() => {
  capabilityStatus.textContent = t("capabilityUnavailable");
  capabilityMessage.textContent = t("capabilityDetectFailed");
});
