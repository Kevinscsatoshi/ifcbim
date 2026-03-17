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
    mastheadTitle: "Turn DWG drafts into a live IFC scene.",
    mastheadLead: "Upload a DWG or DXF, map CAD layers into IFC classes, export the IFC package, and inspect the generated 3D massing directly in the browser.",
    runtimeChecking: "Checking runtime",
    runtimeMessage: "Inspecting DWG support, conversion tools, and upload limits.",
    odaCopy: "DWG conversion requires ODA File Converter. Install it to enable DWG support.",
    odaDownload: "Download ODA",
    odaInstalled: "I've installed it",
    inputTitle: "Drop a drawing file and generate the model.",
    dropzoneTitle: "DWG / DXF ingestion",
    dropzoneSubtitle: "Drag a file here or pick one from disk. IFC export stays downloadable. The BIM experience moves into the live 3D viewer.",
    chooseFile: "Choose File",
    noFileSelected: "No file selected",
    generateModel: "Generate Model",
    statusWaiting: "Waiting for a drawing file.",
    dxf2dwgTitle: "Convert DXF to DWG",
    dxf2dwgCopy: "When only DXF is supported, conversion runs on your machine. Install ODA File Converter to upload DXF and download DWG here.",
    chooseDxf: "Choose DXF file",
    noFileChosen: "No file chosen",
    convertToDwg: "Convert to DWG",
    downloadDwg: "Download DWG",
    dxf2dwgNoOda: "ODA File Converter is required to convert DXF to DWG.",
    downloadOda: "Download ODA",
    outputEmptyTitle: "No model yet",
    outputEmptyCopy: "Once a conversion finishes, this rail shows the file summary, warnings, and IFC download links while the 3D scene opens on the right.",
    entities: "Entities",
    layers: "Layers",
    ifcElements: "IFC Elements",
    skipped: "Skipped",
    viewerTitle: "Online 3D inspection",
    resetCamera: "Reset Camera",
    wireframe: "Wireframe",
    solid: "Solid",
    sceneIdle: "Scene idle",
    viewerEmptyTitle: "Your generated model will appear here.",
    viewerEmptyCopy: "Orbit, pan, and zoom the scene after conversion. No BIM download step required.",
    buildingScene: "Building scene...",
    viewerMetaDefault: "The browser view is generated from the same massing data used to author the IFC file.",
    breakdownTitle: "IFC class distribution",
    statusSelected: "Selected {name}",
    statusChooseFirst: "Choose a DWG or DXF file first.",
    statusDwgNotSupported: "DWG is not supported in this environment. Install ODA File Converter or upload DXF instead.",
    statusUploading: "Uploading file and generating IFC + live scene...",
    statusDone: "Conversion finished. The model is now live in the viewer.",
    conversionFailed: "Conversion failed.",
    dwgAvailable: "DWG conversion is available. You can upload DWG for BIM conversion.",
    dwgReady: "DWG Ready",
    dxfOnly: "DXF Only",
    capabilityUnavailable: "Unavailable",
    capabilityDetectFailed: "Runtime capability detection failed, but you can still try a conversion.",
    viewerUnavailable: "Viewer unavailable",
    sceneFailed: "Scene generation did not complete.",
    fetchingGeometry: "Fetching viewer geometry...",
    elementsVisible: "{count} IFC elements are visible in-browser. Drag to orbit, scroll to zoom.",
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
    mastheadTitle: "DWG 図面を IFC シーンに。",
    mastheadLead: "DWG または DXF をアップロードし、CAD レイヤーを IFC クラスにマッピング。IFC をエクスポートし、ブラウザで 3D マッシングを確認できます。",
    runtimeChecking: "ランタイム確認中",
    runtimeMessage: "DWG 対応・変換ツール・アップロード上限を確認しています。",
    odaCopy: "DWG 変換には ODA File Converter が必要です。インストールすると DWG に対応します。",
    odaDownload: "ODA をダウンロード",
    odaInstalled: "インストールしました",
    inputTitle: "図面ファイルをドロップしてモデルを生成",
    dropzoneTitle: "DWG / DXF 取り込み",
    dropzoneSubtitle: "ここにファイルをドラッグするか、ディスクから選択。IFC はダウンロード可能。BIM は 3D ビューアで確認できます。",
    chooseFile: "ファイルを選択",
    noFileSelected: "ファイル未選択",
    generateModel: "モデルを生成",
    statusWaiting: "図面ファイルを待機中です。",
    dxf2dwgTitle: "DXF を DWG に変換",
    dxf2dwgCopy: "DXF のみ対応の環境では、変換はお使いの環境で実行されます。ODA File Converter をインストールすると、ここで DXF をアップロードして DWG をダウンロードできます。",
    chooseDxf: "DXF ファイルを選択",
    noFileChosen: "ファイル未選択",
    convertToDwg: "DWG に変換",
    downloadDwg: "DWG をダウンロード",
    dxf2dwgNoOda: "DXF を DWG に変換するには ODA File Converter が必要です。",
    downloadOda: "ODA をダウンロード",
    outputEmptyTitle: "まだモデルがありません",
    outputEmptyCopy: "変換が完了すると、ここにファイル概要・警告・IFC ダウンロードリンクが表示され、右側に 3D シーンが開きます。",
    entities: "エンティティ",
    layers: "レイヤー",
    ifcElements: "IFC 要素",
    skipped: "スキップ",
    viewerTitle: "オンライン 3D 確認",
    resetCamera: "カメラリセット",
    wireframe: "ワイヤー",
    solid: "ソリッド",
    sceneIdle: "シーン待機中",
    viewerEmptyTitle: "生成したモデルがここに表示されます。",
    viewerEmptyCopy: "変換後にオービット・パン・ズームで操作できます。BIM のダウンロードは不要です。",
    buildingScene: "シーン構築中...",
    viewerMetaDefault: "ブラウザ表示は IFC ファイルと同じマッシングデータから生成されています。",
    breakdownTitle: "IFC クラス内訳",
    statusSelected: "選択: {name}",
    statusChooseFirst: "先に DWG または DXF ファイルを選択してください。",
    statusDwgNotSupported: "この環境では DWG に対応していません。ODA File Converter をインストールするか、DXF をアップロードしてください。",
    statusUploading: "アップロード中。IFC とライブシーンを生成しています...",
    statusDone: "変換が完了しました。ビューアでモデルを確認できます。",
    conversionFailed: "変換に失敗しました。",
    dwgAvailable: "DWG 変換が利用可能です。DWG をアップロードして BIM 変換できます。",
    dwgReady: "DWG 対応",
    dxfOnly: "DXF のみ",
    capabilityUnavailable: "利用不可",
    capabilityDetectFailed: "ランタイムの検出に失敗しましたが、変換は試せます。",
    viewerUnavailable: "ビューア利用不可",
    sceneFailed: "シーン生成が完了しませんでした。",
    fetchingGeometry: "ビューアジオメトリ取得中...",
    elementsVisible: "ブラウザに {count} 個の IFC 要素を表示中。ドラッグで回転、スクロールでズーム。",
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
  capabilityStatus.textContent = capabilities.dwg_enabled ? t("dwgReady") : t("dxfOnly");
  capabilityMessage.textContent = `${capabilities.dwg_message} ${t("maxUpload")}: ${capabilities.max_upload_mb}MB.`;
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
  wireframeButton.textContent = viewerState.wireframe ? t("solid") : t("wireframe");
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
  const file = fileInput.files[0];
  if (!file) {
    setStatus(t("statusChooseFirst"));
    return;
  }
  if (
    lastCapabilities &&
    !lastCapabilities.dwg_enabled &&
    file.name.toLowerCase().endsWith(".dwg")
  ) {
    setStatus(t("statusDwgNotSupported"));
    if (odaDownloadCta) {
      odaDownloadCta.classList.remove("hidden");
      odaDownloadCta.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
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
          setStatus(t("dwgAvailable"));
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
    if (dxfToDwgFilename) dxfToDwgFilename.textContent = file ? file.name : t("noFileChosen");
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
      if (!response.ok) throw new Error(payload.detail || t("conversionFailed"));
      if (dxfToDwgMessage) dxfToDwgMessage.textContent = t("converted", { filename: payload.filename });
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

function refreshLangDependentUI() {
  if (lastCapabilities) {
    capabilityStatus.textContent = lastCapabilities.dwg_enabled ? t("dwgReady") : t("dxfOnly");
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
