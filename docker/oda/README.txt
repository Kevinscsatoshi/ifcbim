Place ODA File Converter Linux .deb here for full DWG support in the Docker image.

1. Download from: https://www.opendesign.com/guestfiles/oda_file_converter
   (Choose the Linux DEB package, e.g. ODAFileConverter_QT6_lnxX64_8.3dll_27.1.deb)
2. Save the file into this directory (docker/oda/).
3. Build the image: docker build -t cad2bim .

If you build without a .deb, the image will run in DXF-only mode (no DWG conversion).
