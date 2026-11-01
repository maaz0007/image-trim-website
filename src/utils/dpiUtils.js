/**
 * DPI & Image Metadata Utilities
 * Pure client-side parsing and embedding for JPEG (JFIF) and PNG (pHYs chunk)
 */

// CRC32 Table for PNG chunk generation
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  return crcTable;
}

function calculateCrc(buf) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Read native DPI from an Image File or Blob (JPEG or PNG)
 */
export async function readImageDpi(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Default fallback for screen displays
  const defaultResult = {
    dpiX: 72,
    dpiY: 72,
    unit: 'inches',
    source: 'Default (Screen standard)',
    hasMetadata: false,
  };

  if (bytes.length < 8) return defaultResult;

  // 1. Check JPEG (starts with 0xFF 0xD8)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 4) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];

      // APP0 Marker (JFIF)
      if (marker === 0xe0) {
        // Check for "JFIF\0" (0x4A, 0x46, 0x49, 0x46, 0x00)
        if (
          bytes[offset + 4] === 0x4a &&
          bytes[offset + 5] === 0x46 &&
          bytes[offset + 6] === 0x49 &&
          bytes[offset + 7] === 0x46 &&
          bytes[offset + 8] === 0x00
        ) {
          const unit = bytes[offset + 11]; // 0 = aspect ratio, 1 = dots/inch, 2 = dots/cm
          const xDensity = (bytes[offset + 12] << 8) | bytes[offset + 13];
          const yDensity = (bytes[offset + 14] << 8) | bytes[offset + 15];

          if (xDensity > 0 && yDensity > 0) {
            let dpiX = xDensity;
            let dpiY = yDensity;
            if (unit === 2) {
              // Convert dots/cm to DPI
              dpiX = Math.round(xDensity * 2.54);
              dpiY = Math.round(yDensity * 2.54);
            }
            return {
              dpiX,
              dpiY,
              unit: unit === 2 ? 'cm' : 'inches',
              source: 'JPEG JFIF Header',
              hasMetadata: true,
            };
          }
        }
      }

      // APP1 Marker (EXIF)
      if (marker === 0xe1) {
        // Search EXIF for 0x011A (XResolution) and 0x011B (YResolution)
        // If found, will parse rational numbers
        const exifLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
        if (
          bytes[offset + 4] === 0x45 &&
          bytes[offset + 5] === 0x78 &&
          bytes[offset + 6] === 0x69 &&
          bytes[offset + 7] === 0x66
        ) {
          const tiffStart = offset + 10;
          const isLittleEndian = bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
          const read16 = (o) => view.getUint16(tiffStart + o, isLittleEndian);
          const read32 = (o) => view.getUint32(tiffStart + o, isLittleEndian);

          try {
            const ifdOffset = read32(4);
            const numEntries = read16(ifdOffset);
            let xRes = null;
            let yRes = null;

            for (let i = 0; i < numEntries; i++) {
              const entryOffset = ifdOffset + 2 + i * 12;
              const tag = read16(entryOffset);
              if (tag === 0x011a) {
                // XResolution tag
                const valOffset = read32(entryOffset + 8);
                const num = read32(valOffset);
                const den = read32(valOffset + 4);
                if (den > 0) xRes = Math.round(num / den);
              } else if (tag === 0x011b) {
                // YResolution tag
                const valOffset = read32(entryOffset + 8);
                const num = read32(valOffset);
                const den = read32(valOffset + 4);
                if (den > 0) yRes = Math.round(num / den);
              }
            }

            if (xRes && yRes) {
              return {
                dpiX: xRes,
                dpiY: yRes,
                unit: 'inches',
                source: 'EXIF Resolution Metadata',
                hasMetadata: true,
              };
            }
          } catch (e) {
            // continue scan
          }
        }
      }

      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + length;
    }
  }

  // 2. Check PNG (starts with 137, 80, 78, 71, 13, 10, 26, 10)
  if (
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  ) {
    let offset = 8;
    while (offset < bytes.length - 8) {
      const length = view.getUint32(offset);
      const chunkName = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      // pHYs chunk contains physical pixel dimensions
      if (chunkName === 'pHYs' && length >= 9) {
        const ppuX = view.getUint32(offset + 8);
        const ppuY = view.getUint32(offset + 12);
        const unit = bytes[offset + 16]; // 1 = meters

        if (unit === 1 && ppuX > 0 && ppuY > 0) {
          // 1 meter = 39.37007874 inches
          const dpiX = Math.round(ppuX / 39.37007874);
          const dpiY = Math.round(ppuY / 39.37007874);
          return {
            dpiX,
            dpiY,
            unit: 'inches',
            source: 'PNG pHYs Chunk',
            hasMetadata: true,
          };
        }
      }

      if (chunkName === 'IEND') break;
      offset += 12 + length; // 4 length + 4 name + data + 4 crc
    }
  }

  return defaultResult;
}

/**
 * Embed custom DPI into a JPEG Blob by writing or updating the JFIF APP0 header
 */
export async function embedDpiJpeg(blob, dpi) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return blob; // Not a valid JPEG
  }

  const dpiInt = Math.round(dpi);

  // If byte 2 is APP0 marker (0xFF 0xE0), check if it's JFIF
  if (bytes[2] === 0xff && bytes[3] === 0xe0) {
    if (
      bytes[6] === 0x4a &&
      bytes[7] === 0x46 &&
      bytes[8] === 0x49 &&
      bytes[9] === 0x46 &&
      bytes[10] === 0x00
    ) {
      // Modify existing JFIF in-place
      const modified = new Uint8Array(bytes);
      modified[13] = 1; // 1 = dots per inch
      modified[14] = (dpiInt >> 8) & 0xff;
      modified[15] = dpiInt & 0xff;
      modified[16] = (dpiInt >> 8) & 0xff;
      modified[17] = dpiInt & 0xff;
      return new Blob([modified], { type: 'image/jpeg' });
    }
  }

  // If no JFIF header present, insert a standard 18-byte JFIF APP0 right after SOI (0xFF 0xD8)
  const jfifSegment = new Uint8Array([
    0xff, 0xe0, // APP0
    0x00, 0x10, // length = 16
    0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
    0x01, 0x01, // Version 1.1
    0x01,       // Units: 1 = dots per inch
    (dpiInt >> 8) & 0xff, dpiInt & 0xff, // X density
    (dpiInt >> 8) & 0xff, dpiInt & 0xff, // Y density
    0x00, 0x00  // Thumbnail size = 0
  ]);

  const result = new Uint8Array(bytes.length + jfifSegment.length);
  result.set(bytes.subarray(0, 2), 0); // 0xFF, 0xD8
  result.set(jfifSegment, 2);
  result.set(bytes.subarray(2), 2 + jfifSegment.length);

  return new Blob([result], { type: 'image/jpeg' });
}

/**
 * Embed custom DPI into a PNG Blob by inserting or updating the pHYs chunk
 */
export async function embedDpiPng(blob, dpi) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Check PNG signature
  if (
    bytes[0] !== 137 ||
    bytes[1] !== 80 ||
    bytes[2] !== 78 ||
    bytes[3] !== 71
  ) {
    return blob;
  }

  // 1 meter = 39.37007874 inches
  const ppu = Math.round(dpi * 39.37007874);

  // Build the 21-byte pHYs chunk (4 length + 4 name + 9 data + 4 crc)
  const physChunk = new Uint8Array(21);
  const physView = new DataView(physChunk.buffer);

  physView.setUint32(0, 9); // Length = 9
  physChunk[4] = 112; // 'p'
  physChunk[5] = 72;  // 'H'
  physChunk[6] = 121; // 'y'
  physChunk[7] = 115; // 's'
  physView.setUint32(8, ppu);  // Pixels per unit X
  physView.setUint32(12, ppu); // Pixels per unit Y
  physChunk[16] = 1;          // Unit = 1 (meters)

  // Calculate CRC for [pHYs + data]
  const crcTarget = physChunk.subarray(4, 17);
  const crc = calculateCrc(crcTarget);
  physView.setUint32(17, crc);

  // Check if an existing pHYs chunk exists
  let existingPhysOffset = -1;
  let offset = 8;
  let insertOffset = 8 + 25; // Default insert point right after IHDR (8 sig + 25 IHDR)

  while (offset < bytes.length - 8) {
    const length = view.getUint32(offset);
    const chunkName = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (chunkName === 'pHYs') {
      existingPhysOffset = offset;
      break;
    }
    if (chunkName === 'IHDR') {
      insertOffset = offset + 12 + length;
    }
    if (chunkName === 'IDAT') {
      break;
    }
    offset += 12 + length;
  }

  if (existingPhysOffset !== -1) {
    // Replace existing chunk
    const existingLength = view.getUint32(existingPhysOffset);
    const existingTotal = 12 + existingLength;
    const result = new Uint8Array(bytes.length - existingTotal + physChunk.length);
    result.set(bytes.subarray(0, existingPhysOffset), 0);
    result.set(physChunk, existingPhysOffset);
    result.set(bytes.subarray(existingPhysOffset + existingTotal), existingPhysOffset + physChunk.length);
    return new Blob([result], { type: 'image/png' });
  }

  // Insert after IHDR
  const result = new Uint8Array(bytes.length + physChunk.length);
  result.set(bytes.subarray(0, insertOffset), 0);
  result.set(physChunk, insertOffset);
  result.set(bytes.subarray(insertOffset), insertOffset + physChunk.length);
  return new Blob([result], { type: 'image/png' });
}

/**
 * Universal DPI embedder supporting JPEG, PNG, or canvas export
 */
export async function embedDpi(blob, dpi, mimeType = 'image/jpeg') {
  if (mimeType === 'image/jpeg' || mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return await embedDpiJpeg(blob, dpi);
  }
  if (mimeType === 'image/png' || mimeType.includes('png')) {
    return await embedDpiPng(blob, dpi);
  }
  return blob;
}

/**
 * Calculate physical print dimensions and suitability
 */
export function calculatePrintDimensions(widthPx, heightPx, dpi) {
  const safeDpi = Math.max(1, dpi);
  const widthInches = widthPx / safeDpi;
  const heightInches = heightPx / safeDpi;

  const widthCm = widthInches * 2.54;
  const heightCm = heightInches * 2.54;

  const widthMm = widthCm * 10;
  const heightMm = heightCm * 10;

  let qualityGrade = 'Web / Screen';
  let qualityColor = 'text-amber-600 dark:text-amber-400';
  let description = 'Standard for web and digital displays. Not recommended for crisp print.';

  if (safeDpi >= 600) {
    qualityGrade = 'Ultra HD Archival';
    qualityColor = 'text-purple-600 dark:text-purple-400';
    description = 'Fine art gallery prints, extreme detail, and archival photography standards.';
  } else if (safeDpi >= 300) {
    qualityGrade = 'Commercial Print Standard';
    qualityColor = 'text-emerald-600 dark:text-emerald-400';
    description = 'Industry benchmark for magazines, brochures, business cards, and framing.';
  } else if (safeDpi >= 150) {
    qualityGrade = 'Medium Print Quality';
    qualityColor = 'text-blue-600 dark:text-blue-400';
    description = 'Suitable for large posters, newspapers, and viewing from greater distances.';
  }

  return {
    widthInches: Number(widthInches.toFixed(2)),
    heightInches: Number(heightInches.toFixed(2)),
    widthCm: Number(widthCm.toFixed(1)),
    heightCm: Number(heightCm.toFixed(1)),
    widthMm: Math.round(widthMm),
    heightMm: Math.round(heightMm),
    qualityGrade,
    qualityColor,
    description,
  };
}

