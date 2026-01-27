@echo off
echo Building Type Arena contracts using Docker...
echo.

REM Build the Docker image
docker build -f contracts/Dockerfile.build -t type-arena-builder .

REM Create output directory
if not exist "contracts\output" mkdir contracts\output

REM Copy WASM files from container
docker run --rm -v "%cd%\contracts\output:/output" type-arena-builder sh -c "cp /app/contracts/type_arena/target/wasm32-unknown-unknown/release/*.wasm /output/ 2>/dev/null || echo 'Copying WASM files...'"

echo.
echo Build complete! Check contracts\output for WASM files:
dir contracts\output\*.wasm 2>nul || echo No WASM files found

echo.
pause
