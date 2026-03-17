"""
DWG conversion helpers.
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

import ezdxf
from ezdxf.addons import odafc


class DwgConversionError(RuntimeError):
    """Raised when a DWG file cannot be normalized into DXF."""


class DwgConverter:
    """Normalizes DWG uploads into DXF files by using ODA File Converter."""

    def _candidate_paths(self) -> list[Path]:
        home = Path.home()
        return [
            home / "Applications" / "ODAFileConverter.app" / "Contents" / "MacOS" / "ODAFileConverter",
            Path("/Applications/ODAFileConverter.app/Contents/MacOS/ODAFileConverter"),
            home / "Downloads" / "oda" / "ODAFileConverter.app" / "Contents" / "MacOS" / "ODAFileConverter",
            Path("/usr/bin/ODAFileConverter"),
        ]

    def _configure_local_install(self) -> Path | None:
        env_path = os.getenv("ODA_FILE_CONVERTER_PATH")
        if env_path:
            path = Path(env_path)
            if path.is_file():
                ezdxf.options.set("odafc-addon", "unix_exec_path", str(path))
                return path

        binary = shutil.which("ODAFileConverter")
        if binary:
            ezdxf.options.set("odafc-addon", "unix_exec_path", binary)
            return Path(binary)

        for candidate in self._candidate_paths():
            if candidate.is_file():
                ezdxf.options.set("odafc-addon", "unix_exec_path", str(candidate))
                return candidate
        return None

    def is_available(self) -> bool:
        if os.getenv("VERCEL"):
            return False
        self._configure_local_install()
        return odafc.is_installed()

    def availability_message(self) -> str:
        if os.getenv("VERCEL"):
            return "DWG conversion is unavailable on Vercel because ODA File Converter cannot run inside the serverless runtime. Upload DXF in previews."
        binary = self._configure_local_install()
        if binary and self.is_available():
            return f"ODA File Converter detected. DWG conversion is available. Current path: {binary}"
        return "ODA File Converter was not detected. DXF works immediately; DWG requires ODA."

    def convert_to_dxf(self, source_path: Path, target_path: Path) -> Path:
        if source_path.suffix.lower() != ".dwg":
            raise DwgConversionError("Only DWG files can be normalized into DXF.")
        self._configure_local_install()
        if not self.is_available():
            raise DwgConversionError(
                "ODA File Converter is not installed in this environment. Install it and retry, or upload DXF directly."
            )

        try:
            odafc.convert(str(source_path), str(target_path), replace=True, audit=True)
        except odafc.UnsupportedVersion as exc:
            raise DwgConversionError(
                f"不支持的 DWG 版本，仅支持 R12～R2018。{exc}"
            ) from exc
        except odafc.UnknownODAFCError as exc:
            raise DwgConversionError(f"DWG 转换失败：{exc}") from exc
        except odafc.UnsupportedFileFormat as exc:
            raise DwgConversionError(f"不支持的文件格式：{exc}") from exc
        except odafc.ODAFCNotInstalledError as exc:
            raise DwgConversionError(str(exc)) from exc
        except odafc.ODAFCError as exc:
            raise DwgConversionError(f"DWG 转换失败：{exc}") from exc

        if not target_path.exists():
            raise DwgConversionError("DWG conversion finished without producing a DXF file.")
        return target_path

    def convert_to_dwg(self, source_path: Path, target_path: Path, version: str = "R2018") -> Path:
        """Convert DXF to DWG using ODA File Converter. Requires ODA to be installed."""
        if source_path.suffix.lower() != ".dxf":
            raise DwgConversionError("Only DXF files can be converted to DWG.")
        self._configure_local_install()
        if not self.is_available():
            raise DwgConversionError(
                "ODA File Converter is not installed. Install it to convert DXF to DWG, or use DXF directly for BIM."
            )
        try:
            odafc.convert(
                str(source_path),
                str(target_path),
                version=version,
                audit=True,
                replace=True,
            )
        except odafc.UnsupportedVersion as exc:
            raise DwgConversionError(f"不支持的输出版本，仅支持 R12～R2018。{exc}") from exc
        except odafc.UnknownODAFCError as exc:
            raise DwgConversionError(f"DXF 转 DWG 失败：{exc}") from exc
        except odafc.UnsupportedFileFormat as exc:
            raise DwgConversionError(f"不支持的文件格式：{exc}") from exc
        except odafc.ODAFCNotInstalledError as exc:
            raise DwgConversionError(str(exc)) from exc
        except odafc.ODAFCError as exc:
            raise DwgConversionError(f"DXF 转 DWG 失败：{exc}") from exc
        if not target_path.exists():
            raise DwgConversionError("Conversion finished without producing a DWG file.")
        return target_path
