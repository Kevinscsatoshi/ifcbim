# CAD2BIM Studio

Upload a `DWG` or `DXF` file and generate:

- an `IFC` model package
- an in-browser 3D viewer scene
- a normalized `DXF` source when the input starts as `DWG`

## Run locally

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python tests/test_pipeline.py
python main.py
```

Open [http://localhost:8000](http://localhost:8000).

## DWG support

The project uses `ezdxf.addons.odafc` for DWG normalization.

- `DXF` converts directly
- `DWG` requires a local `ODA File Converter` installation

If ODA is missing, the UI and API return a clear runtime message instead of failing silently.

## 支持的文件与限制

### DWG

- **版本**：ODA File Converter 支持 **R12 (AC1009) ～ R2018 (AC1032)** 的 DWG。早于 R12 或尚未被 ODA 支持的更新版本会转换失败。
- **环境**：需在本机或服务器上安装 [ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter)；Vercel 等 Serverless 环境无法安装，仅支持 DXF。
- **失败情况**：文件损坏、不支持的 DWG 版本、或 ODA 转换异常时，转换会失败；接口会返回 400 及具体原因（如「不支持的 DWG 版本」或「DWG 转换失败」）。

### DXF

- **版本**：支持 ezdxf 可正确读入的常见 DXF 版本（如 R12～R2018 等），文件结构需合法。
- **实体**：仅下列 2D 实体会参与 BIM 化：Line、LWPolyline、Polyline、Circle、Arc、Insert（块参照）、Text、MText。其他实体类型会被跳过，并在结果中体现为「部分实体未生成 IFC」（skipped_entities）。
- **失败情况**：文件损坏、编码异常或格式不兼容会导致解析失败；实体几何不完整（如 footprint 点数不足）时，该实体可能被跳过或导致构建失败。解析/构建错误会以 400 和可读文案返回。

## Deploy to Vercel

The app now includes Vercel deployment scaffolding:

- [api/index.py](/Users/satoshik/ifcbim/api/index.py) exports the FastAPI `app` as the Vercel serverless entrypoint
- [vercel.json](/Users/satoshik/ifcbim/vercel.json) rewrites all requests into the FastAPI entrypoint
- [.python-version](/Users/satoshik/ifcbim/.python-version) pins Python `3.12`
- [.vercelignore](/Users/satoshik/ifcbim/.vercelignore) keeps local artifacts and test data out of the deployment upload

Preview runtime notes:

- Vercel Python functions have a `500 MB` uncompressed bundle limit
- Vercel functions cap request and response payloads at `4.5 MB`, so the deployed app advertises a `4 MB` upload ceiling
- Vercel previews use temporary function storage, so the in-browser 3D viewer is the primary experience after upload
- `DWG` conversion is disabled in Vercel previews because `ODA File Converter` cannot be installed inside the serverless runtime

Deploy a preview with:

```bash
vercel deploy -y
```

## Build a macOS installer

If you want a downloadable local app instead of a web deployment, build the packaged macOS installer:

```bash
chmod +x packaging/macos/build_pkg.sh
./packaging/macos/build_pkg.sh
```

Artifacts are written to:

- [dist/macos/CAD2BIM Studio.pkg](/Users/satoshik/ifcbim/dist/macos/CAD2BIM%20Studio.pkg)
- [dist/macos/stage/CAD2BIM Studio.app](/Users/satoshik/ifcbim/dist/macos/stage/CAD2BIM%20Studio.app)

Behavior:

- installing the `.pkg` places `CAD2BIM Studio.app` in `/Applications`
- launching the app starts a local FastAPI server on `http://127.0.0.1:8765`
- the launcher automatically opens the browser UI
- generated jobs are stored in `~/Library/Application Support/CAD2BIM Studio/jobs`
- `DWG` still requires `ODA File Converter` to be installed on the Mac, but `DXF` works immediately
