/* empty css                             */
import { A as AstroError, c as InvalidImageService, d as ExpectedImageOptions, E as ExpectedImage, F as FailedToFetchRemoteImageDimensions, e as createAstro, f as createComponent, g as ImageMissingAlt, r as renderTemplate, m as maybeRenderHead, h as addAttribute, s as spreadAttributes, i as renderComponent, u as unescapeHTML, j as Fragment, k as renderHead, l as renderSlot } from '../astro_uNdN2VWs.mjs';
import sendGrid from '@sendgrid/mail';
/* empty css                             */
import { i as isRemoteImage, a as isESMImportedImage, b as isLocalService, D as DEFAULT_HASH_PROPS } from '../astro/assets-service_Dy8oiIsF.mjs';
/* empty css                             */
/* empty css                             */

const decoder = new TextDecoder();
const toUTF8String = (input, start = 0, end = input.length) => decoder.decode(input.slice(start, end));
const toHexString = (input, start = 0, end = input.length) => input.slice(start, end).reduce((memo, i) => memo + ("0" + i.toString(16)).slice(-2), "");
const readInt16LE = (input, offset = 0) => {
  const val = input[offset] + input[offset + 1] * 2 ** 8;
  return val | (val & 2 ** 15) * 131070;
};
const readUInt16BE = (input, offset = 0) => input[offset] * 2 ** 8 + input[offset + 1];
const readUInt16LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8;
const readUInt24LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16;
const readInt32LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16 + (input[offset + 3] << 24);
const readUInt32BE = (input, offset = 0) => input[offset] * 2 ** 24 + input[offset + 1] * 2 ** 16 + input[offset + 2] * 2 ** 8 + input[offset + 3];
const readUInt32LE = (input, offset = 0) => input[offset] + input[offset + 1] * 2 ** 8 + input[offset + 2] * 2 ** 16 + input[offset + 3] * 2 ** 24;
const methods = {
  readUInt16BE,
  readUInt16LE,
  readUInt32BE,
  readUInt32LE
};
function readUInt(input, bits, offset, isBigEndian) {
  offset = offset || 0;
  const endian = isBigEndian ? "BE" : "LE";
  const methodName = "readUInt" + bits + endian;
  return methods[methodName](input, offset);
}
function readBox(buffer, offset) {
  if (buffer.length - offset < 4)
    return;
  const boxSize = readUInt32BE(buffer, offset);
  if (buffer.length - offset < boxSize)
    return;
  return {
    name: toUTF8String(buffer, 4 + offset, 8 + offset),
    offset,
    size: boxSize
  };
}
function findBox(buffer, boxName, offset) {
  while (offset < buffer.length) {
    const box = readBox(buffer, offset);
    if (!box)
      break;
    if (box.name === boxName)
      return box;
    offset += box.size;
  }
}

const BMP = {
  validate: (input) => toUTF8String(input, 0, 2) === "BM",
  calculate: (input) => ({
    height: Math.abs(readInt32LE(input, 22)),
    width: readUInt32LE(input, 18)
  })
};

const TYPE_ICON = 1;
const SIZE_HEADER$1 = 2 + 2 + 2;
const SIZE_IMAGE_ENTRY = 1 + 1 + 1 + 1 + 2 + 2 + 4 + 4;
function getSizeFromOffset(input, offset) {
  const value = input[offset];
  return value === 0 ? 256 : value;
}
function getImageSize$1(input, imageIndex) {
  const offset = SIZE_HEADER$1 + imageIndex * SIZE_IMAGE_ENTRY;
  return {
    height: getSizeFromOffset(input, offset + 1),
    width: getSizeFromOffset(input, offset)
  };
}
const ICO = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0)
      return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_ICON;
  },
  calculate(input) {
    const nbImages = readUInt16LE(input, 4);
    const imageSize = getImageSize$1(input, 0);
    if (nbImages === 1)
      return imageSize;
    const imgs = [imageSize];
    for (let imageIndex = 1; imageIndex < nbImages; imageIndex += 1) {
      imgs.push(getImageSize$1(input, imageIndex));
    }
    return {
      height: imageSize.height,
      images: imgs,
      width: imageSize.width
    };
  }
};

const TYPE_CURSOR = 2;
const CUR = {
  validate(input) {
    const reserved = readUInt16LE(input, 0);
    const imageCount = readUInt16LE(input, 4);
    if (reserved !== 0 || imageCount === 0)
      return false;
    const imageType = readUInt16LE(input, 2);
    return imageType === TYPE_CURSOR;
  },
  calculate: (input) => ICO.calculate(input)
};

const DDS = {
  validate: (input) => readUInt32LE(input, 0) === 542327876,
  calculate: (input) => ({
    height: readUInt32LE(input, 12),
    width: readUInt32LE(input, 16)
  })
};

const gifRegexp = /^GIF8[79]a/;
const GIF = {
  validate: (input) => gifRegexp.test(toUTF8String(input, 0, 6)),
  calculate: (input) => ({
    height: readUInt16LE(input, 8),
    width: readUInt16LE(input, 6)
  })
};

const brandMap = {
  avif: "avif",
  mif1: "heif",
  msf1: "heif",
  // hief-sequence
  heic: "heic",
  heix: "heic",
  hevc: "heic",
  // heic-sequence
  hevx: "heic"
  // heic-sequence
};
function detectBrands(buffer, start, end) {
  let brandsDetected = {};
  for (let i = start; i <= end; i += 4) {
    const brand = toUTF8String(buffer, i, i + 4);
    if (brand in brandMap) {
      brandsDetected[brand] = 1;
    }
  }
  if ("avif" in brandsDetected) {
    return "avif";
  } else if ("heic" in brandsDetected || "heix" in brandsDetected || "hevc" in brandsDetected || "hevx" in brandsDetected) {
    return "heic";
  } else if ("mif1" in brandsDetected || "msf1" in brandsDetected) {
    return "heif";
  }
}
const HEIF = {
  validate(buffer) {
    const ftype = toUTF8String(buffer, 4, 8);
    const brand = toUTF8String(buffer, 8, 12);
    return "ftyp" === ftype && brand in brandMap;
  },
  calculate(buffer) {
    const metaBox = findBox(buffer, "meta", 0);
    const iprpBox = metaBox && findBox(buffer, "iprp", metaBox.offset + 12);
    const ipcoBox = iprpBox && findBox(buffer, "ipco", iprpBox.offset + 8);
    const ispeBox = ipcoBox && findBox(buffer, "ispe", ipcoBox.offset + 8);
    if (ispeBox) {
      return {
        height: readUInt32BE(buffer, ispeBox.offset + 16),
        width: readUInt32BE(buffer, ispeBox.offset + 12),
        type: detectBrands(buffer, 8, metaBox.offset)
      };
    }
    throw new TypeError("Invalid HEIF, no size found");
  }
};

const SIZE_HEADER = 4 + 4;
const FILE_LENGTH_OFFSET = 4;
const ENTRY_LENGTH_OFFSET = 4;
const ICON_TYPE_SIZE = {
  ICON: 32,
  "ICN#": 32,
  // m => 16 x 16
  "icm#": 16,
  icm4: 16,
  icm8: 16,
  // s => 16 x 16
  "ics#": 16,
  ics4: 16,
  ics8: 16,
  is32: 16,
  s8mk: 16,
  icp4: 16,
  // l => 32 x 32
  icl4: 32,
  icl8: 32,
  il32: 32,
  l8mk: 32,
  icp5: 32,
  ic11: 32,
  // h => 48 x 48
  ich4: 48,
  ich8: 48,
  ih32: 48,
  h8mk: 48,
  // . => 64 x 64
  icp6: 64,
  ic12: 32,
  // t => 128 x 128
  it32: 128,
  t8mk: 128,
  ic07: 128,
  // . => 256 x 256
  ic08: 256,
  ic13: 256,
  // . => 512 x 512
  ic09: 512,
  ic14: 512,
  // . => 1024 x 1024
  ic10: 1024
};
function readImageHeader(input, imageOffset) {
  const imageLengthOffset = imageOffset + ENTRY_LENGTH_OFFSET;
  return [
    toUTF8String(input, imageOffset, imageLengthOffset),
    readUInt32BE(input, imageLengthOffset)
  ];
}
function getImageSize(type) {
  const size = ICON_TYPE_SIZE[type];
  return { width: size, height: size, type };
}
const ICNS = {
  validate: (input) => toUTF8String(input, 0, 4) === "icns",
  calculate(input) {
    const inputLength = input.length;
    const fileLength = readUInt32BE(input, FILE_LENGTH_OFFSET);
    let imageOffset = SIZE_HEADER;
    let imageHeader = readImageHeader(input, imageOffset);
    let imageSize = getImageSize(imageHeader[0]);
    imageOffset += imageHeader[1];
    if (imageOffset === fileLength)
      return imageSize;
    const result = {
      height: imageSize.height,
      images: [imageSize],
      width: imageSize.width
    };
    while (imageOffset < fileLength && imageOffset < inputLength) {
      imageHeader = readImageHeader(input, imageOffset);
      imageSize = getImageSize(imageHeader[0]);
      imageOffset += imageHeader[1];
      result.images.push(imageSize);
    }
    return result;
  }
};

const J2C = {
  // TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
  validate: (input) => toHexString(input, 0, 4) === "ff4fff51",
  calculate: (input) => ({
    height: readUInt32BE(input, 12),
    width: readUInt32BE(input, 8)
  })
};

const JP2 = {
  validate(input) {
    if (readUInt32BE(input, 4) !== 1783636e3 || readUInt32BE(input, 0) < 1)
      return false;
    const ftypBox = findBox(input, "ftyp", 0);
    if (!ftypBox)
      return false;
    return readUInt32BE(input, ftypBox.offset + 4) === 1718909296;
  },
  calculate(input) {
    const jp2hBox = findBox(input, "jp2h", 0);
    const ihdrBox = jp2hBox && findBox(input, "ihdr", jp2hBox.offset + 8);
    if (ihdrBox) {
      return {
        height: readUInt32BE(input, ihdrBox.offset + 8),
        width: readUInt32BE(input, ihdrBox.offset + 12)
      };
    }
    throw new TypeError("Unsupported JPEG 2000 format");
  }
};

const EXIF_MARKER = "45786966";
const APP1_DATA_SIZE_BYTES = 2;
const EXIF_HEADER_BYTES = 6;
const TIFF_BYTE_ALIGN_BYTES = 2;
const BIG_ENDIAN_BYTE_ALIGN = "4d4d";
const LITTLE_ENDIAN_BYTE_ALIGN = "4949";
const IDF_ENTRY_BYTES = 12;
const NUM_DIRECTORY_ENTRIES_BYTES = 2;
function isEXIF(input) {
  return toHexString(input, 2, 6) === EXIF_MARKER;
}
function extractSize(input, index) {
  return {
    height: readUInt16BE(input, index),
    width: readUInt16BE(input, index + 2)
  };
}
function extractOrientation(exifBlock, isBigEndian) {
  const idfOffset = 8;
  const offset = EXIF_HEADER_BYTES + idfOffset;
  const idfDirectoryEntries = readUInt(exifBlock, 16, offset, isBigEndian);
  for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
    const start = offset + NUM_DIRECTORY_ENTRIES_BYTES + directoryEntryNumber * IDF_ENTRY_BYTES;
    const end = start + IDF_ENTRY_BYTES;
    if (start > exifBlock.length) {
      return;
    }
    const block = exifBlock.slice(start, end);
    const tagNumber = readUInt(block, 16, 0, isBigEndian);
    if (tagNumber === 274) {
      const dataFormat = readUInt(block, 16, 2, isBigEndian);
      if (dataFormat !== 3) {
        return;
      }
      const numberOfComponents = readUInt(block, 32, 4, isBigEndian);
      if (numberOfComponents !== 1) {
        return;
      }
      return readUInt(block, 16, 8, isBigEndian);
    }
  }
}
function validateExifBlock(input, index) {
  const exifBlock = input.slice(APP1_DATA_SIZE_BYTES, index);
  const byteAlign = toHexString(
    exifBlock,
    EXIF_HEADER_BYTES,
    EXIF_HEADER_BYTES + TIFF_BYTE_ALIGN_BYTES
  );
  const isBigEndian = byteAlign === BIG_ENDIAN_BYTE_ALIGN;
  const isLittleEndian = byteAlign === LITTLE_ENDIAN_BYTE_ALIGN;
  if (isBigEndian || isLittleEndian) {
    return extractOrientation(exifBlock, isBigEndian);
  }
}
function validateInput(input, index) {
  if (index > input.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
}
const JPG = {
  validate: (input) => toHexString(input, 0, 2) === "ffd8",
  calculate(input) {
    input = input.slice(4);
    let orientation;
    let next;
    while (input.length) {
      const i = readUInt16BE(input, 0);
      if (input[i] !== 255) {
        input = input.slice(1);
        continue;
      }
      if (isEXIF(input)) {
        orientation = validateExifBlock(input, i);
      }
      validateInput(input, i);
      next = input[i + 1];
      if (next === 192 || next === 193 || next === 194) {
        const size = extractSize(input, i + 5);
        if (!orientation) {
          return size;
        }
        return {
          height: size.height,
          orientation,
          width: size.width
        };
      }
      input = input.slice(i + 2);
    }
    throw new TypeError("Invalid JPG, no size found");
  }
};

const KTX = {
  validate: (input) => {
    const signature = toUTF8String(input, 1, 7);
    return ["KTX 11", "KTX 20"].includes(signature);
  },
  calculate: (input) => {
    const type = input[5] === 49 ? "ktx" : "ktx2";
    const offset = type === "ktx" ? 36 : 20;
    return {
      height: readUInt32LE(input, offset + 4),
      width: readUInt32LE(input, offset),
      type
    };
  }
};

const pngSignature = "PNG\r\n\n";
const pngImageHeaderChunkName = "IHDR";
const pngFriedChunkName = "CgBI";
const PNG = {
  validate(input) {
    if (pngSignature === toUTF8String(input, 1, 8)) {
      let chunkName = toUTF8String(input, 12, 16);
      if (chunkName === pngFriedChunkName) {
        chunkName = toUTF8String(input, 28, 32);
      }
      if (chunkName !== pngImageHeaderChunkName) {
        throw new TypeError("Invalid PNG");
      }
      return true;
    }
    return false;
  },
  calculate(input) {
    if (toUTF8String(input, 12, 16) === pngFriedChunkName) {
      return {
        height: readUInt32BE(input, 36),
        width: readUInt32BE(input, 32)
      };
    }
    return {
      height: readUInt32BE(input, 20),
      width: readUInt32BE(input, 16)
    };
  }
};

const PNMTypes = {
  P1: "pbm/ascii",
  P2: "pgm/ascii",
  P3: "ppm/ascii",
  P4: "pbm",
  P5: "pgm",
  P6: "ppm",
  P7: "pam",
  PF: "pfm"
};
const handlers = {
  default: (lines) => {
    let dimensions = [];
    while (lines.length > 0) {
      const line = lines.shift();
      if (line[0] === "#") {
        continue;
      }
      dimensions = line.split(" ");
      break;
    }
    if (dimensions.length === 2) {
      return {
        height: parseInt(dimensions[1], 10),
        width: parseInt(dimensions[0], 10)
      };
    } else {
      throw new TypeError("Invalid PNM");
    }
  },
  pam: (lines) => {
    const size = {};
    while (lines.length > 0) {
      const line = lines.shift();
      if (line.length > 16 || line.charCodeAt(0) > 128) {
        continue;
      }
      const [key, value] = line.split(" ");
      if (key && value) {
        size[key.toLowerCase()] = parseInt(value, 10);
      }
      if (size.height && size.width) {
        break;
      }
    }
    if (size.height && size.width) {
      return {
        height: size.height,
        width: size.width
      };
    } else {
      throw new TypeError("Invalid PAM");
    }
  }
};
const PNM = {
  validate: (input) => toUTF8String(input, 0, 2) in PNMTypes,
  calculate(input) {
    const signature = toUTF8String(input, 0, 2);
    const type = PNMTypes[signature];
    const lines = toUTF8String(input, 3).split(/[\r\n]+/);
    const handler = handlers[type] || handlers.default;
    return handler(lines);
  }
};

const PSD = {
  validate: (input) => toUTF8String(input, 0, 4) === "8BPS",
  calculate: (input) => ({
    height: readUInt32BE(input, 14),
    width: readUInt32BE(input, 18)
  })
};

const svgReg = /<svg\s([^>"']|"[^"]*"|'[^']*')*>/;
const extractorRegExps = {
  height: /\sheight=(['"])([^%]+?)\1/,
  root: svgReg,
  viewbox: /\sviewBox=(['"])(.+?)\1/i,
  width: /\swidth=(['"])([^%]+?)\1/
};
const INCH_CM = 2.54;
const units = {
  in: 96,
  cm: 96 / INCH_CM,
  em: 16,
  ex: 8,
  m: 96 / INCH_CM * 100,
  mm: 96 / INCH_CM / 10,
  pc: 96 / 72 / 12,
  pt: 96 / 72,
  px: 1
};
const unitsReg = new RegExp(
  // eslint-disable-next-line regexp/prefer-d
  `^([0-9.]+(?:e\\d+)?)(${Object.keys(units).join("|")})?$`
);
function parseLength(len) {
  const m = unitsReg.exec(len);
  if (!m) {
    return void 0;
  }
  return Math.round(Number(m[1]) * (units[m[2]] || 1));
}
function parseViewbox(viewbox) {
  const bounds = viewbox.split(" ");
  return {
    height: parseLength(bounds[3]),
    width: parseLength(bounds[2])
  };
}
function parseAttributes(root) {
  const width = root.match(extractorRegExps.width);
  const height = root.match(extractorRegExps.height);
  const viewbox = root.match(extractorRegExps.viewbox);
  return {
    height: height && parseLength(height[2]),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    viewbox: viewbox && parseViewbox(viewbox[2]),
    width: width && parseLength(width[2])
  };
}
function calculateByDimensions(attrs) {
  return {
    height: attrs.height,
    width: attrs.width
  };
}
function calculateByViewbox(attrs, viewbox) {
  const ratio = viewbox.width / viewbox.height;
  if (attrs.width) {
    return {
      height: Math.floor(attrs.width / ratio),
      width: attrs.width
    };
  }
  if (attrs.height) {
    return {
      height: attrs.height,
      width: Math.floor(attrs.height * ratio)
    };
  }
  return {
    height: viewbox.height,
    width: viewbox.width
  };
}
const SVG = {
  // Scan only the first kilo-byte to speed up the check on larger files
  validate: (input) => svgReg.test(toUTF8String(input, 0, 1e3)),
  calculate(input) {
    const root = toUTF8String(input).match(extractorRegExps.root);
    if (root) {
      const attrs = parseAttributes(root[0]);
      if (attrs.width && attrs.height) {
        return calculateByDimensions(attrs);
      }
      if (attrs.viewbox) {
        return calculateByViewbox(attrs, attrs.viewbox);
      }
    }
    throw new TypeError("Invalid SVG");
  }
};

const TGA = {
  validate(input) {
    return readUInt16LE(input, 0) === 0 && readUInt16LE(input, 4) === 0;
  },
  calculate(input) {
    return {
      height: readUInt16LE(input, 14),
      width: readUInt16LE(input, 12)
    };
  }
};

function readIFD(input, isBigEndian) {
  const ifdOffset = readUInt(input, 32, 4, isBigEndian);
  return input.slice(ifdOffset + 2);
}
function readValue(input, isBigEndian) {
  const low = readUInt(input, 16, 8, isBigEndian);
  const high = readUInt(input, 16, 10, isBigEndian);
  return (high << 16) + low;
}
function nextTag(input) {
  if (input.length > 24) {
    return input.slice(12);
  }
}
function extractTags(input, isBigEndian) {
  const tags = {};
  let temp = input;
  while (temp && temp.length) {
    const code = readUInt(temp, 16, 0, isBigEndian);
    const type = readUInt(temp, 16, 2, isBigEndian);
    const length = readUInt(temp, 32, 4, isBigEndian);
    if (code === 0) {
      break;
    } else {
      if (length === 1 && (type === 3 || type === 4)) {
        tags[code] = readValue(temp, isBigEndian);
      }
      temp = nextTag(temp);
    }
  }
  return tags;
}
function determineEndianness(input) {
  const signature = toUTF8String(input, 0, 2);
  if ("II" === signature) {
    return "LE";
  } else if ("MM" === signature) {
    return "BE";
  }
}
const signatures = [
  // '492049', // currently not supported
  "49492a00",
  // Little endian
  "4d4d002a"
  // Big Endian
  // '4d4d002a', // BigTIFF > 4GB. currently not supported
];
const TIFF = {
  validate: (input) => signatures.includes(toHexString(input, 0, 4)),
  calculate(input) {
    const isBigEndian = determineEndianness(input) === "BE";
    const ifdBuffer = readIFD(input, isBigEndian);
    const tags = extractTags(ifdBuffer, isBigEndian);
    const width = tags[256];
    const height = tags[257];
    if (!width || !height) {
      throw new TypeError("Invalid Tiff. Missing tags");
    }
    return { height, width };
  }
};

function calculateExtended(input) {
  return {
    height: 1 + readUInt24LE(input, 7),
    width: 1 + readUInt24LE(input, 4)
  };
}
function calculateLossless(input) {
  return {
    height: 1 + ((input[4] & 15) << 10 | input[3] << 2 | (input[2] & 192) >> 6),
    width: 1 + ((input[2] & 63) << 8 | input[1])
  };
}
function calculateLossy(input) {
  return {
    height: readInt16LE(input, 8) & 16383,
    width: readInt16LE(input, 6) & 16383
  };
}
const WEBP = {
  validate(input) {
    const riffHeader = "RIFF" === toUTF8String(input, 0, 4);
    const webpHeader = "WEBP" === toUTF8String(input, 8, 12);
    const vp8Header = "VP8" === toUTF8String(input, 12, 15);
    return riffHeader && webpHeader && vp8Header;
  },
  calculate(input) {
    const chunkHeader = toUTF8String(input, 12, 16);
    input = input.slice(20, 30);
    if (chunkHeader === "VP8X") {
      const extendedHeader = input[0];
      const validStart = (extendedHeader & 192) === 0;
      const validEnd = (extendedHeader & 1) === 0;
      if (validStart && validEnd) {
        return calculateExtended(input);
      } else {
        throw new TypeError("Invalid WebP");
      }
    }
    if (chunkHeader === "VP8 " && input[0] !== 47) {
      return calculateLossy(input);
    }
    const signature = toHexString(input, 3, 6);
    if (chunkHeader === "VP8L" && signature !== "9d012a") {
      return calculateLossless(input);
    }
    throw new TypeError("Invalid WebP");
  }
};

const typeHandlers = /* @__PURE__ */ new Map([
  ["bmp", BMP],
  ["cur", CUR],
  ["dds", DDS],
  ["gif", GIF],
  ["heif", HEIF],
  ["icns", ICNS],
  ["ico", ICO],
  ["j2c", J2C],
  ["jp2", JP2],
  ["jpg", JPG],
  ["ktx", KTX],
  ["png", PNG],
  ["pnm", PNM],
  ["psd", PSD],
  ["svg", SVG],
  ["tga", TGA],
  ["tiff", TIFF],
  ["webp", WEBP]
]);
const types = Array.from(typeHandlers.keys());

const firstBytes = /* @__PURE__ */ new Map([
  [56, "psd"],
  [66, "bmp"],
  [68, "dds"],
  [71, "gif"],
  [73, "tiff"],
  [77, "tiff"],
  [82, "webp"],
  [105, "icns"],
  [137, "png"],
  [255, "jpg"]
]);
function detector(input) {
  const byte = input[0];
  const type = firstBytes.get(byte);
  if (type && typeHandlers.get(type).validate(input)) {
    return type;
  }
  return types.find((fileType) => typeHandlers.get(fileType).validate(input));
}

const globalOptions = {
  disabledTypes: []
};
function lookup(input) {
  const type = detector(input);
  if (typeof type !== "undefined") {
    if (globalOptions.disabledTypes.indexOf(type) > -1) {
      throw new TypeError("disabled file type: " + type);
    }
    const size = typeHandlers.get(type).calculate(input);
    if (size !== void 0) {
      size.type = size.type ?? type;
      return size;
    }
  }
  throw new TypeError("unsupported file type: " + type);
}

async function probe(url) {
  const response = await fetch(url);
  if (!response.body || !response.ok) {
    throw new Error("Failed to fetch image");
  }
  const reader = response.body.getReader();
  let done, value;
  let accumulatedChunks = new Uint8Array();
  while (!done) {
    const readResult = await reader.read();
    done = readResult.done;
    if (done)
      break;
    if (readResult.value) {
      value = readResult.value;
      let tmp = new Uint8Array(accumulatedChunks.length + value.length);
      tmp.set(accumulatedChunks, 0);
      tmp.set(value, accumulatedChunks.length);
      accumulatedChunks = tmp;
      try {
        const dimensions = lookup(accumulatedChunks);
        if (dimensions) {
          await reader.cancel();
          return dimensions;
        }
      } catch (error) {
      }
    }
  }
  throw new Error("Failed to parse the size");
}

async function getConfiguredImageService() {
  if (!globalThis?.astroAsset?.imageService) {
    const { default: service } = await import(
      // @ts-expect-error
      '../astro/assets-service_Dy8oiIsF.mjs'
    ).then(n => n.g).catch((e) => {
      const error = new AstroError(InvalidImageService);
      error.cause = e;
      throw error;
    });
    if (!globalThis.astroAsset)
      globalThis.astroAsset = {};
    globalThis.astroAsset.imageService = service;
    return service;
  }
  return globalThis.astroAsset.imageService;
}
async function getImage$1(options, imageConfig) {
  if (!options || typeof options !== "object") {
    throw new AstroError({
      ...ExpectedImageOptions,
      message: ExpectedImageOptions.message(JSON.stringify(options))
    });
  }
  if (typeof options.src === "undefined") {
    throw new AstroError({
      ...ExpectedImage,
      message: ExpectedImage.message(
        options.src,
        "undefined",
        JSON.stringify(options)
      )
    });
  }
  const service = await getConfiguredImageService();
  const resolvedOptions = {
    ...options,
    src: typeof options.src === "object" && "then" in options.src ? (await options.src).default ?? await options.src : options.src
  };
  if (options.inferSize && isRemoteImage(resolvedOptions.src)) {
    try {
      const result = await probe(resolvedOptions.src);
      resolvedOptions.width ??= result.width;
      resolvedOptions.height ??= result.height;
      delete resolvedOptions.inferSize;
    } catch {
      throw new AstroError({
        ...FailedToFetchRemoteImageDimensions,
        message: FailedToFetchRemoteImageDimensions.message(resolvedOptions.src)
      });
    }
  }
  const originalPath = isESMImportedImage(resolvedOptions.src) ? resolvedOptions.src.fsPath : resolvedOptions.src;
  const clonedSrc = isESMImportedImage(resolvedOptions.src) ? (
    // @ts-expect-error - clone is a private, hidden prop
    resolvedOptions.src.clone ?? resolvedOptions.src
  ) : resolvedOptions.src;
  resolvedOptions.src = clonedSrc;
  const validatedOptions = service.validateOptions ? await service.validateOptions(resolvedOptions, imageConfig) : resolvedOptions;
  const srcSetTransforms = service.getSrcSet ? await service.getSrcSet(validatedOptions, imageConfig) : [];
  let imageURL = await service.getURL(validatedOptions, imageConfig);
  let srcSets = await Promise.all(
    srcSetTransforms.map(async (srcSet) => ({
      transform: srcSet.transform,
      url: await service.getURL(srcSet.transform, imageConfig),
      descriptor: srcSet.descriptor,
      attributes: srcSet.attributes
    }))
  );
  if (isLocalService(service) && globalThis.astroAsset.addStaticImage && !(isRemoteImage(validatedOptions.src) && imageURL === validatedOptions.src)) {
    const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
    imageURL = globalThis.astroAsset.addStaticImage(validatedOptions, propsToHash, originalPath);
    srcSets = srcSetTransforms.map((srcSet) => ({
      transform: srcSet.transform,
      url: globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalPath),
      descriptor: srcSet.descriptor,
      attributes: srcSet.attributes
    }));
  }
  return {
    rawOptions: resolvedOptions,
    options: validatedOptions,
    src: imageURL,
    srcSet: {
      values: srcSets,
      attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(", ")
    },
    attributes: service.getHTMLAttributes !== void 0 ? await service.getHTMLAttributes(validatedOptions, imageConfig) : {}
  };
}

const $$Astro$9 = createAstro();
const $$Image = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$Image;
  const props = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  if (typeof props.width === "string") {
    props.width = parseInt(props.width);
  }
  if (typeof props.height === "string") {
    props.height = parseInt(props.height);
  }
  const image = await getImage(props);
  const additionalAttributes = {};
  if (image.srcSet.values.length > 0) {
    additionalAttributes.srcset = image.srcSet.attribute;
  }
  return renderTemplate`${maybeRenderHead()}<img${addAttribute(image.src, "src")}${spreadAttributes(additionalAttributes)}${spreadAttributes(image.attributes)}>`;
}, "/home/ldore/projects/cluster-salud-sd/node_modules/.pnpm/astro@4.4.0_typescript@5.3.2/node_modules/astro/components/Image.astro", void 0);

const $$Astro$8 = createAstro();
const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Picture;
  const defaultFormats = ["webp"];
  const defaultFallbackFormat = "png";
  const specialFormatsFallback = ["gif", "svg", "jpg", "jpeg"];
  const { formats = defaultFormats, pictureAttributes = {}, fallbackFormat, ...props } = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    throw new AstroError(ImageMissingAlt);
  }
  const optimizedImages = await Promise.all(
    formats.map(
      async (format) => await getImage({ ...props, format, widths: props.widths, densities: props.densities })
    )
  );
  let resultFallbackFormat = fallbackFormat ?? defaultFallbackFormat;
  if (!fallbackFormat && isESMImportedImage(props.src) && specialFormatsFallback.includes(props.src.format)) {
    resultFallbackFormat = props.src.format;
  }
  const fallbackImage = await getImage({
    ...props,
    format: resultFallbackFormat,
    widths: props.widths,
    densities: props.densities
  });
  const imgAdditionalAttributes = {};
  const sourceAdditionalAttributes = {};
  if (props.sizes) {
    sourceAdditionalAttributes.sizes = props.sizes;
  }
  if (fallbackImage.srcSet.values.length > 0) {
    imgAdditionalAttributes.srcset = fallbackImage.srcSet.attribute;
  }
  return renderTemplate`${maybeRenderHead()}<picture${spreadAttributes(pictureAttributes)}> ${Object.entries(optimizedImages).map(([_, image]) => {
    const srcsetAttribute = props.densities || !props.densities && !props.widths ? `${image.src}${image.srcSet.values.length > 0 ? ", " + image.srcSet.attribute : ""}` : image.srcSet.attribute;
    return renderTemplate`<source${addAttribute(srcsetAttribute, "srcset")}${addAttribute("image/" + image.options.format, "type")}${spreadAttributes(sourceAdditionalAttributes)}>`;
  })} <img${addAttribute(fallbackImage.src, "src")}${spreadAttributes(imgAdditionalAttributes)}${spreadAttributes(fallbackImage.attributes)}> </picture>`;
}, "/home/ldore/projects/cluster-salud-sd/node_modules/.pnpm/astro@4.4.0_typescript@5.3.2/node_modules/astro/components/Picture.astro", void 0);

const imageConfig = {"service":{"entrypoint":"astro/assets/services/sharp","config":{}},"domains":[],"remotePatterns":[]};
					new URL("file:///home/ldore/projects/cluster-salud-sd/.vercel/output/static/");
					const getImage = async (options) => await getImage$1(options, imageConfig);

const $$Astro$7 = createAstro();
const $$SvgImg = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$SvgImg;
  const { width, height, color, icon } = Astro2.props;
  const facebookIcon = `
  <svg
    class="inline-block"
    height="${height}"
    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
    version="1.1"
    viewBox="0 0 512 512"
    width="${width}"
    xml:space="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    ><path
      d="M374.244,285.825l14.105,-91.961l-88.233,0l0,-59.677c0,-25.159 12.325,-49.682 51.845,-49.682l40.116,0l0,-78.291c0,0 -36.407,-6.214 -71.213,-6.214c-72.67,0 -120.165,44.042 -120.165,123.775l0,70.089l-80.777,0l0,91.961l80.777,0l0,222.31c16.197,2.541 32.798,3.865 49.709,3.865c16.911,0 33.511,-1.324 49.708,-3.865l0,-222.31l74.128,0Z"
      fill-rule="nonzero"
      fill="${color}"></path></svg
  >
`;
  const twitterIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="inline-block"
    width="${width}"
    height="${height}"
    viewBox="0 0 1200 1227"
    fill="none"
    ><g clip-path="url(#clip0_1_2)"
      ><path
        d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
        fill="${color}"></path></g
    ><defs
      ><clipPath id="clip0_1_2"
        ><rect width="1200" height="1227" fill="white"></rect></clipPath
      ></defs
    ></svg
  >
`;
  const icons = {
    facebook: facebookIcon,
    twitter: twitterIcon
  };
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`${unescapeHTML(icons[icon])}` })}`;
}, "/home/ldore/projects/cluster-salud-sd/src/components/SvgImg.astro", void 0);

const logo = new Proxy({"src":"/_astro/logo.Ijou4OXp.jpg","width":324,"height":118,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/home/ldore/projects/cluster-salud-sd/src/assets/logo.jpg";
							}
							
							return target[name];
						}
					});

const $$Astro$6 = createAstro();
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Header;
  const path = Astro2.url.pathname;
  const menu = [
    {
      name: "Inicio",
      href: "/"
    },
    {
      name: "Sobre Nosotros",
      href: "/nosotros"
    },
    {
      name: "Sobre los Clusters",
      href: "/sobre-clusters"
    },
    {
      name: "HUBHealth",
      href: "/hubhealth"
    },
    {
      name: "Cont\xE1ctanos",
      href: "/contacto"
    }
  ];
  return renderTemplate`${maybeRenderHead()}<header class="relative" data-astro-cid-3ef6ksr2> <div class="bg-zinc-600 py-3 text-sm text-zinc-400" data-astro-cid-3ef6ksr2> <div class="cssd-container text-center sm:flex sm:items-center sm:justify-between" data-astro-cid-3ef6ksr2> <div data-astro-cid-3ef6ksr2> <span class="mr-1" data-astro-cid-3ef6ksr2>Infórmate:</span><a href="mailto:info@clustersaludsd.org" data-astro-cid-3ef6ksr2>info@clustersaludsd.org</a> | <a href="tel:8093781962" data-astro-cid-3ef6ksr2>809-378-1962</a> </div> <div class="mt-4 flex items-center justify-center leading-normal sm:mt-0 sm:justify-end" data-astro-cid-3ef6ksr2> <a href="#" target="_blank" class="mr-3" data-astro-cid-3ef6ksr2> ${renderComponent($$result, "SvgImg", $$SvgImg, { "height": 20, "width": 20, "color": "#a1a1aa", "icon": "facebook", "data-astro-cid-3ef6ksr2": true })} </a> <a href="https://twitter.com/clustersaludsd" target="_blank" data-astro-cid-3ef6ksr2> ${renderComponent($$result, "SvgImg", $$SvgImg, { "height": 20, "width": 19, "color": "#a1a1aa", "icon": "twitter", "data-astro-cid-3ef6ksr2": true })} </a> </div> </div> </div> <div class="relative bg-white py-5 lg:py-1.5" x-data="{ open: false }" data-astro-cid-3ef6ksr2> <div class="cssd-container flex items-center justify-between md:flex-col lg:flex-row" data-astro-cid-3ef6ksr2> <a href="/" class="mx-auto mb-2 block w-60 flex-shrink-0 flex-grow-0 lg:mb-0 lg:w-72 lg:basis-72 xl:w-80 xl:basis-80" data-astro-cid-3ef6ksr2>${renderComponent($$result, "Image", $$Image, { "src": logo, "alt": "Cluster Salud SD", "data-astro-cid-3ef6ksr2": true })}</a> <div class="flex-auto text-right" data-astro-cid-3ef6ksr2> <button type="button" class="hamburger bg-secondary p-2.5 md:hidden" :class="open ? 'active' : ''" aria-label="Abrir menú" aria-controls="navigation" @click="open = !open" data-astro-cid-3ef6ksr2> <span class="hamburger-box" data-astro-cid-3ef6ksr2> <span class="hamburger-inner" data-astro-cid-3ef6ksr2></span> </span> </button> <nav class="hidden md:!block" data-astro-cid-3ef6ksr2> <ul class="flex items-center justify-center text-sm lg:justify-end xl:text-base" data-astro-cid-3ef6ksr2> ${menu.map((item) => renderTemplate`<li data-astro-cid-3ef6ksr2> <a${addAttribute(item.href, "href")}${addAttribute([
    "menu-item block px-4 py-2 hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
    { "bg-white text-zinc-600": path !== item.href },
    { "bg-primary text-white": path === item.href }
  ], "class:list")} data-astro-cid-3ef6ksr2> ${item.name} </a> </li>`)} </ul> </nav> </div> </div> <nav id="navigation" class="px-4 md:hidden" x-show="open" x-collapse data-astro-cid-3ef6ksr2> <ul class="text-sm" data-astro-cid-3ef6ksr2> ${menu.map((item) => renderTemplate`<li data-astro-cid-3ef6ksr2> <a${addAttribute(item.href, "href")} class="menu-item block border-t border-solid border-secondary-light bg-secondary px-8 py-3.5 uppercase text-white hover:bg-secondary-hover focus:bg-secondary-hover" data-astro-cid-3ef6ksr2> ${item.name} </a> </li>`)} </ul> </nav> </div> </header> `;
}, "/home/ldore/projects/cluster-salud-sd/src/components/Header.astro", void 0);

const $$Astro$5 = createAstro();
const $$Footer = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Footer;
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="relative"> <div class="bg-zinc-600 pb-7 pt-6 text-sm text-zinc-400"> <div class="cssd-container text-center sm:flex sm:items-center sm:justify-between"> <div>
&copy; ${year} de Salud Santo Domingo. Todos los derechos reservados.
</div> <div class="mt-4 flex items-center justify-center leading-normal sm:mt-0 sm:justify-end"> <a href="#" target="_blank" class="mr-3"> ${renderComponent($$result, "SvgImg", $$SvgImg, { "height": 20, "width": 20, "color": "#a1a1aa", "icon": "facebook" })} </a> <a href="https://twitter.com/clustersaludsd" target="_blank"> ${renderComponent($$result, "SvgImg", $$SvgImg, { "height": 20, "width": 19, "color": "#a1a1aa", "icon": "twitter" })} </a> </div> </div> </div> </footer>`;
}, "/home/ldore/projects/cluster-salud-sd/src/components/Footer.astro", void 0);

const $$Astro$4 = createAstro();
const $$BaseLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { pageTitle = "Home" } = Astro2.props;
  return renderTemplate`<html lang="en" class="scroll-smooth"> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${pageTitle} | Cluster de Salud Santo Domingo</title>${renderHead()}</head> <body class="text-zinc-500"> ${renderComponent($$result, "Header", $$Header, {})} <main class="relative"> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, {})} <a href="#top" id="scroll-top" class="fixed bottom-14 right-5 z-50 hidden h-10 w-10 items-center justify-center rounded-full bg-primary opacity-0 shadow-md transition-opacity sm:flex"> <!--?xml version="1.0" ?--> <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" class="w-3/4"><rect fill="none" height="256" width="256"></rect><polyline fill="none" points="48 160 128 80 208 160" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></polyline></svg> </a> </body></html>`;
}, "/home/ldore/projects/cluster-salud-sd/src/layouts/BaseLayout.astro", void 0);

const $$Astro$3 = createAstro();
const $$PageLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$PageLayout;
  const { pageTitle = "Home", bannerImage = "/src/assets/page-banner.jpg" } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "pageTitle": pageTitle }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="h-44 bg-cover bg-top bg-no-repeat"${addAttribute(`background-image: url(${bannerImage})`, "style")}> <span class="sr-only">Banner para la pagina ${pageTitle}</span> </div> <div class="py-6"> <div class="cssd-container flex flex-col gap-4 sm:flex-row sm:items-center"> <h1 class="text-3xl font-normal">${pageTitle}</h1> <nav> <ul class="flex items-center text-sm"> <li class="flex items-center"> <a href="/" class="menu-item hover:underline">Inicio</a> <span class="block h-2.5 w-6 bg-[url('/src/assets/breadcrumbs-divider.png')] bg-center bg-no-repeat"></span> </li> <li class="text-accent">${pageTitle}</li> </ul> </nav> </div> </div> <div class="bg-zinc-100 py-12"> <div class="cssd-container page-content"> ${renderSlot($$result2, $$slots["default"])} </div> </div> ` })} `;
}, "/home/ldore/projects/cluster-salud-sd/src/layouts/PageLayout.astro", void 0);

const $$Astro$2 = createAstro();
const $$Button = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Button;
  const { as: Tag, intent = "primary", ...props } = Astro2.props;
  const { class: className, ...rest } = props;
  return renderTemplate`${renderComponent($$result, "Tag", Tag, { ...rest, "class:list": [
    "button inline-block px-5 py-2.5 text-sm font-semibold text-white",
    { "bg-primary hover:bg-accent focus:bg-accent": intent === "primary" },
    { "bg-accent hover:bg-zinc-800 focus:bg-zinc-800": intent === "accent" },
    className
  ] }, { "default": ($$result2) => renderTemplate` ${renderSlot($$result2, $$slots["default"])} ` })}`;
}, "/home/ldore/projects/cluster-salud-sd/src/components/Button.astro", void 0);

const $$Astro$1 = createAstro();
const $$Alert = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Alert;
  const { intent, className, show = false } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div${addAttribute([
    "border-l-4 border-solid px-4 py-1 text-sm text-white",
    { "border-green-800 bg-green-700": intent === "success" },
    { "border-red-800 bg-red-700": intent === "error" },
    { hidden: !show },
    className
  ], "class:list")}> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/home/ldore/projects/cluster-salud-sd/src/components/Alert.astro", void 0);

const $$Astro = createAstro();
const prerender = false;
const $$Contacto = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Contacto;
  const pageTitle = "Contáctanos";
  const alert = {
    type: "success",
    message: "Tu mensaje fue enviado correctamente. Te responderemos a la brevedad.",
    show: false
  };
  if (Astro2.request.method === "POST") {
    try {
      sendGrid.setApiKey("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");
      const data = await Astro2.request.formData();
      const [name, email, phone, message] = data.values();
      if (!name) {
        throw new Error("Debes introducir un nombre");
      }
      if (!email) {
        throw new Error("Debes introducir tu dirección de email");
      }
      const emailBody = `Nombre: ${name}
Email: ${email}
Teléfono: ${phone}

Mensaje: ${message}`;
      const msg = {
        to: "leon.dore@gmail.com",
        from: {
          name: "Cluster de Salud Santo Domingo",
          email: "hello@leon.ninja"
        },
        subject: "Cluster de Salud Santo Domingo: New contact form submission",
        text: emailBody
      };
      await sendGrid.send(msg);
      alert.show = true;
    } catch (error) {
      let errorMessage = "Ocurrió un error al enviar tu mensaje. Por favor, intenta de nuevo.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert.type = "error";
      alert.message = errorMessage;
      alert.show = true;
    }
  }
  const reCaptchaSiteKey = "6LfBpIspAAAAAL3KsfVzy-rj4_En7-lja59MjApC";
  return renderTemplate`${renderComponent($$result, "PageLayout", $$PageLayout, { "pageTitle": pageTitle, "data-astro-cid-2mxdoeuz": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Alert", $$Alert, { "intent": alert.type, "show": alert.show, "className": "mb-6", "data-astro-cid-2mxdoeuz": true }, { "default": ($$result3) => renderTemplate`${alert.message}` })} ${maybeRenderHead()}<h2 data-astro-cid-2mxdoeuz>Contáctanos</h2> <p data-astro-cid-2mxdoeuz>Envianos un mensaje, responderemos a la brevedad.</p> <div class="grid grid-cols-2 gap-8" data-astro-cid-2mxdoeuz> <form name="contact" id="contact-form" method="POST" class="col-span-2 border-b border-solid border-zinc-300 pb-7 md:col-span-1 md:border-0 md:pb-0" data-astro-cid-2mxdoeuz> <label class="block" data-astro-cid-2mxdoeuz> <span class="sr-only" data-astro-cid-2mxdoeuz>Nombre</span> <input type="text" name="name" placeholder="Nombre" required data-astro-cid-2mxdoeuz> </label> <input type="email" name="email" placeholder="Dirección de Email" required data-astro-cid-2mxdoeuz> <label class="block" data-astro-cid-2mxdoeuz> <span class="sr-only" data-astro-cid-2mxdoeuz>Número de teléfono</span> <input type="tel" name="phone" placeholder="Número de teléfono" data-astro-cid-2mxdoeuz> </label> <label class="block" data-astro-cid-2mxdoeuz> <span class="sr-only" data-astro-cid-2mxdoeuz>Mensaje</span> <textarea name="message" placeholder="Mensaje" rows="2" data-astro-cid-2mxdoeuz></textarea> </label> <div class="text-right" data-astro-cid-2mxdoeuz> ${renderComponent($$result2, "Button", $$Button, { "as": "button", "intent": "primary", "type": "submit", "class": "g-recaptcha px-7 py-4", "data-sitekey": reCaptchaSiteKey, "data-callback": "onSubmit", "data-action": "submit", "data-astro-cid-2mxdoeuz": true }, { "default": ($$result3) => renderTemplate`
Enviar
` })} </div> </form> <div class="col-span-2 md:col-span-1" data-astro-cid-2mxdoeuz> <h3 class="mb-7" data-astro-cid-2mxdoeuz>Cluster de Salud Santo Domingo</h3> <address class="mb-5 text-sm" data-astro-cid-2mxdoeuz>
Ave. Roberto Pastoriza #160, Naco Santo Domingo, República Dominicana
</address> <div class="mb-1 flex text-sm" data-astro-cid-2mxdoeuz> <span class="mr-5 block w-14 flex-shrink-0 flex-grow-0 basis-14 text-right font-medium text-zinc-700" data-astro-cid-2mxdoeuz>Tel:</span> <span class="block flex-auto" data-astro-cid-2mxdoeuz>809-565-4411</span> </div> <div class="mb-7 flex border-b border-solid border-zinc-300 pb-2.5 text-sm" data-astro-cid-2mxdoeuz> <span class="mr-5 block w-14 flex-shrink-0 flex-grow-0 basis-14 text-right font-medium text-zinc-700" data-astro-cid-2mxdoeuz>Email:</span> <span class="block flex-auto" data-astro-cid-2mxdoeuz>ClusterSaludSD@gmail.com</span> </div> <h5 class="mb-5" data-astro-cid-2mxdoeuz>Social:</h5> <div class="flex gap-2.5 border-b border-solid border-zinc-300 pb-10" data-astro-cid-2mxdoeuz> <a href="#" target="_blank" class="flex h-9 w-9 items-center justify-center bg-zinc-300 hover:bg-[#395b89]" data-astro-cid-2mxdoeuz> ${renderComponent($$result2, "SvgImg", $$SvgImg, { "height": 20, "width": 20, "color": "#ffffff", "icon": "facebook", "data-astro-cid-2mxdoeuz": true })} </a> <a href="#" target="_blank" class="flex h-9 w-9 items-center justify-center bg-zinc-300 hover:bg-[#2bbfec]" data-astro-cid-2mxdoeuz> ${renderComponent($$result2, "SvgImg", $$SvgImg, { "height": 20, "width": 19, "color": "#ffffff", "icon": "twitter", "data-astro-cid-2mxdoeuz": true })} </a> </div> </div> </div> <div class="pt-24" data-astro-cid-2mxdoeuz> <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d946.0669699623078!2d-69.93590082440674!3d18.47152136812538!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eaf89e6e497cab9%3A0x2fe837b0e59311d6!2sMedical%20Net%20A!5e0!3m2!1sen!2sdo!4v1709487585231!5m2!1sen!2sdo" width="1138" height="360" style="border:0;width:100%;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-astro-cid-2mxdoeuz></iframe> </div> ` })}   `;
}, "/home/ldore/projects/cluster-salud-sd/src/pages/contacto.astro", void 0);
const $$file = "/home/ldore/projects/cluster-salud-sd/src/pages/contacto.astro";
const $$url = "/contacto";

const contacto = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contacto,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

export { $$Image as $, $$PageLayout as a, $$Button as b, $$BaseLayout as c, contacto as d, getConfiguredImageService as g, imageConfig as i };
