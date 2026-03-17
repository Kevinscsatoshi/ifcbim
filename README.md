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

## Supported files and limits

### DWG

- **Versions**: ODA File Converter supports **R12 (AC1009) through R2018 (AC1032)**. Older than R12 or newer unsupported versions will fail to convert.
- **Environment**: Install [ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter) on the machine or server; Vercel and other Serverless environments cannot install it, so only DXF is supported there.
- **Failure cases**: Corrupted files, unsupported DWG version, or ODA conversion errors return 400 with a clear message (e.g. "Unsupported DWG version" or "DWG conversion failed").

### DXF

- **Versions**: Common DXF versions that ezdxf can read (e.g. R12–R2018) with valid structure are supported.
- **Entities**: Only these 2D entities are used for BIM: Line, LWPolyline, Polyline, Circle, Arc, Insert (block ref), Text, MText. Others are skipped and reported as skipped_entities.
- **Failure cases**: Corrupted or invalid DXF, or incomplete geometry (e.g. footprint with too few points), can cause parse or build failures; errors are returned as 400 with a readable message.

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
